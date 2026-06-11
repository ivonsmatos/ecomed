#!/usr/bin/env bash
# backup-db.sh — dump diário do PostgreSQL (formato custom, comprimido)
#
# Instalado pelo deploy em /opt/ecomed/scripts/maintenance/backup-db.sh
# Cron: 30 2 * * * (02:30 UTC, diário)
#
# - Usa pg_dump da imagem postgres:17-alpine (compatível com servidores <= 17)
# - Retenção: 14 dias
# - Valida tamanho mínimo do dump (falha ruidosamente se vier vazio)
#
# Restauração:
#   docker run --rm -i postgres:17-alpine pg_restore -d "$DATABASE_URL" --clean --if-exists < arquivo.dump
set -euo pipefail

cd /opt/ecomed
set -a; source .env; set +a

BACKUP_DIR=/opt/ecomed/backups
RETENTION_DAYS=14
MIN_BYTES=1048576   # 1 MB — dump menor que isso indica falha
URL="${DIRECT_URL:-$DATABASE_URL}"
STAMP=$(date -u +%Y%m%d-%H%M%S)
OUT="$BACKUP_DIR/ecomed-$STAMP.dump"

mkdir -p "$BACKUP_DIR"

echo "[backup-db] $(date -u '+%F %T') iniciando dump -> $OUT"
docker run --rm postgres:17-alpine \
  pg_dump --dbname="$URL" --format=custom --compress=6 --no-owner --no-privileges \
  > "$OUT"

SIZE=$(stat -c%s "$OUT")
if [ "$SIZE" -lt "$MIN_BYTES" ]; then
  echo "[backup-db] ERRO: dump suspeito de falha (apenas $SIZE bytes) — mantendo para inspeção em $OUT.failed"
  mv "$OUT" "$OUT.failed"
  exit 1
fi

echo "[backup-db] OK: $(numfmt --to=iec "$SIZE" 2>/dev/null || echo "$SIZE bytes")"

# Retenção
find "$BACKUP_DIR" -name 'ecomed-*.dump' -mtime +"$RETENTION_DAYS" -delete
echo "[backup-db] retenção aplicada (> $RETENTION_DAYS dias removidos)"
