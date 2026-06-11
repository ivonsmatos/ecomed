#!/usr/bin/env bash
# deploy.sh — atualiza, migra e reinicia o container ecomed-web
# Uso: ./scripts/deploy.sh
set -euo pipefail

cd /opt/ecomed

echo '=== [1/7] Atualizando código ==='
git fetch origin
git reset --hard origin/master

echo '=== [2/7] Carregando variáveis ==='
set -a; source .env; set +a

# Args públicos compartilhados pelos dois builds
BUILD_ARGS=(
  --build-arg "AUTH_URL=${AUTH_URL}"
  --build-arg "GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}"
  --build-arg "NEXT_PUBLIC_VAPID_PUBLIC_KEY=${NEXT_PUBLIC_VAPID_PUBLIC_KEY}"
  --build-arg "NEXT_PUBLIC_SANITY_PROJECT_ID=${NEXT_PUBLIC_SANITY_PROJECT_ID:-q9uk6qff}"
  --build-arg "NEXT_PUBLIC_SANITY_DATASET=${NEXT_PUBLIC_SANITY_DATASET:-production}"
)
# Segredos via BuildKit (não ficam nas camadas da imagem)
SECRET_ARGS=(
  --secret "id=DATABASE_URL,env=DATABASE_URL"
  --secret "id=AUTH_SECRET,env=AUTH_SECRET"
  --secret "id=GOOGLE_CLIENT_SECRET,env=GOOGLE_CLIENT_SECRET"
)

echo '=== [3/7] Build Docker (estágio builder) ==='
docker build --target builder -t ecomed-builder:latest \
  "${BUILD_ARGS[@]}" "${SECRET_ARGS[@]}" .

echo '=== [4/7] Aplicando migrações Prisma ==='
MIGRATION_URL="${DIRECT_URL:-$DATABASE_URL}"
docker run --rm \
  -e DATABASE_URL="${MIGRATION_URL}" \
  -e DIRECT_URL="${MIGRATION_URL}" \
  ecomed-builder:latest \
  pnpm exec prisma migrate deploy

echo '=== [5/7] Build imagem final ==='
docker build -t ecomed-web \
  "${BUILD_ARGS[@]}" "${SECRET_ARGS[@]}" .

echo '=== [6/7] Re-indexando base de conhecimento EcoBot ==='
docker exec ecomed-ia python -m app.ingest --reset 2>/dev/null || echo "⚠ ingest skipped (container not running yet)"

echo '=== [7/7] Reiniciando container ==='
docker stop ecomed-web 2>/dev/null || true
docker rm -f ecomed-web 2>/dev/null || true
# aguarda remoção completa antes do docker run
sleep 2
docker run -d --name ecomed-web --restart unless-stopped \
  --network ia_default \
  -p 3010:3010 --env-file .env ecomed-web

echo '=== Garantindo cron de backup do banco ==='
install -m 0755 ops/maintenance/backup-db.sh /opt/ecomed/scripts/maintenance/backup-db.sh 2>/dev/null || {
  mkdir -p /opt/ecomed/scripts/maintenance
  install -m 0755 ops/maintenance/backup-db.sh /opt/ecomed/scripts/maintenance/backup-db.sh
}
current_cron=$(crontab -l 2>/dev/null || true)
if ! echo "$current_cron" | grep -q '/opt/ecomed/scripts/maintenance/backup-db.sh'; then
  printf '%s\n30 2 * * * /opt/ecomed/scripts/maintenance/backup-db.sh >> /var/log/ecomed-backup.log 2>&1\n' "$current_cron" | sed '/^$/d' | crontab -
  echo '✅ Cron backup-db adicionado (02:30 diário)'
fi

echo '=== Aguardando health check ==='
for i in $(seq 1 12); do
  sleep 5
  STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3010/api/health 2>/dev/null || echo '000')
  echo "  tentativa $i: $STATUS"
  [ "$STATUS" = '200' ] && echo '✓ App no ar!' && exit 0
done
echo '✗ Health check falhou' && exit 1
