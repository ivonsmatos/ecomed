#!/usr/bin/env bash
# /opt/ecomed/scripts/maintenance/healthcheck.sh
# Verifica /api/health localmente no host. Em caso de 3 falhas consecutivas,
# tenta reiniciar o container ecomed-web e dispara webhook (se configurado).
# Cron sugerido: */2 * * * * /opt/ecomed/scripts/maintenance/healthcheck.sh
set -u

URL="${HEALTH_URL:-http://127.0.0.1:3010/api/health}"
STATE_DIR="/var/lib/ecomed-health"
STATE_FILE="${STATE_DIR}/fail_count"
LOG_FILE="/var/log/ecomed-health.log"
THRESHOLD=3
WEBHOOK="${HEALTH_WEBHOOK_URL:-}"

mkdir -p "$STATE_DIR"
touch "$STATE_FILE" "$LOG_FILE"
fails=$(cat "$STATE_FILE" 2>/dev/null || echo 0)
fails=${fails:-0}

ts() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }

http_code=$(curl -s -o /tmp/ecomed-health.body -w "%{http_code}" --max-time 8 "$URL" || echo "000")

if [[ "$http_code" == "200" ]]; then
  if [[ "$fails" -gt 0 ]]; then
    echo "[$(ts)] recovered after $fails failures (200 OK)" >> "$LOG_FILE"
  fi
  echo 0 > "$STATE_FILE"
  exit 0
fi

fails=$((fails + 1))
echo "$fails" > "$STATE_FILE"
echo "[$(ts)] DOWN http=$http_code fails=$fails url=$URL" >> "$LOG_FILE"

if [[ "$fails" -ge "$THRESHOLD" ]]; then
  echo "[$(ts)] threshold reached — restarting ecomed-web" >> "$LOG_FILE"
  docker restart ecomed-web >> "$LOG_FILE" 2>&1 || true

  if [[ -n "$WEBHOOK" ]]; then
    curl -s -m 5 -X POST "$WEBHOOK" \
      -H "Content-Type: application/json" \
      -d "{\"text\":\"EcoMed health DOWN — http=$http_code fails=$fails — restart issued at $(ts)\"}" \
      >> "$LOG_FILE" 2>&1 || true
  fi
  # Reseta para evitar loop de restart
  echo 0 > "$STATE_FILE"
fi
