#!/usr/bin/env bash
# /opt/ecomed/scripts/maintenance/cron-missoes.sh
# Dispara os endpoints de cron de missões. Usa CRON_SECRET de /opt/ecomed/.env.
# Uso: cron-missoes.sh reset|ensure
set -u

if [[ ! -f /opt/ecomed/.env ]]; then
  echo "[$(date -u +%FT%TZ)] /opt/ecomed/.env não encontrado" >&2
  exit 1
fi
# shellcheck disable=SC1091
source /opt/ecomed/.env

if [[ -z "${CRON_SECRET:-}" ]]; then
  echo "[$(date -u +%FT%TZ)] CRON_SECRET ausente em /opt/ecomed/.env" >&2
  exit 1
fi

target="${1:-}"
case "$target" in
  reset)  endpoint="reset-missoes" ;;
  ensure) endpoint="ensure-missoes" ;;
  *) echo "uso: $0 reset|ensure" >&2; exit 2 ;;
esac

LOG_FILE="/var/log/ecomed-cron.log"
ts=$(date -u +%FT%TZ)
http_code=$(curl -s -o /tmp/ecomed-cron.body -w "%{http_code}" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  --max-time 60 \
  "http://127.0.0.1:3010/api/cron/${endpoint}" || echo "000")

echo "[$ts] cron=${endpoint} http=${http_code} body=$(cat /tmp/ecomed-cron.body 2>/dev/null | head -c 200)" >> "$LOG_FILE"
[[ "$http_code" == "200" ]] || exit 1
