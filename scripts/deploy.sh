#!/usr/bin/env bash
# deploy.sh — atualiza e reinicia o container ecomed-web
# Uso: ./scripts/deploy.sh
set -euo pipefail

cd /opt/ecomed

echo '=== [1/4] Atualizando código ==='
git fetch origin
git reset --hard origin/master

echo '=== [2/4] Carregando variáveis ==='
set -a; source .env; set +a

echo '=== [3/4] Build Docker ==='
docker build -t ecomed-web \
  --build-arg DATABASE_URL="$DATABASE_URL" \
  --build-arg AUTH_SECRET="$AUTH_SECRET" \
  --build-arg AUTH_URL="$AUTH_URL" \
  --build-arg GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID" \
  --build-arg GOOGLE_CLIENT_SECRET="$GOOGLE_CLIENT_SECRET" \
  --build-arg NEXT_PUBLIC_VAPID_PUBLIC_KEY="$NEXT_PUBLIC_VAPID_PUBLIC_KEY" \
  --build-arg NEXT_PUBLIC_SANITY_PROJECT_ID="$NEXT_PUBLIC_SANITY_PROJECT_ID" \
  --build-arg NEXT_PUBLIC_SANITY_DATASET="${NEXT_PUBLIC_SANITY_DATASET:-production}" \
  .

echo '=== [4/5] Re-indexando base de conhecimento EcoBot ==='
cd /opt/ecomed/ia
pip install -q -r requirements.txt
python -m app.ingest --reset
cd /opt/ecomed

echo '=== [5/5] Reiniciando container ==='
docker stop ecomed-web 2>/dev/null || true
docker rm -f ecomed-web 2>/dev/null || true
# aguarda remoção completa antes do docker run
sleep 2
docker run -d --name ecomed-web --restart unless-stopped \
  --network ia_default \
  -p 3010:3010 --env-file .env ecomed-web

echo '=== Aguardando health check ==='
for i in $(seq 1 12); do
  sleep 5
  STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3010/api/health 2>/dev/null || echo '000')
  echo "  tentativa $i: $STATUS"
  [ "$STATUS" = '200' ] && echo '✓ App no ar!' && exit 0
done
echo '✗ Health check falhou' && exit 1
