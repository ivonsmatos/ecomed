#!/bin/sh
set -eu

target_host="${1:?Informe o endpoint esperado}"
app_container="${2:-ecomed-web}"

configured_host="$(
  docker exec "$app_container" node -e '
    const value = process.env.DATABASE_URL;
    if (!value) process.exit(2);
    process.stdout.write(new URL(value).hostname);
  '
)"

echo "configured_endpoint=$configured_host"
if [ "$configured_host" = "$target_host" ]; then
  echo "configured_endpoint_match=yes"
else
  echo "configured_endpoint_match=no"
fi

sql_file="$(mktemp /tmp/ecomed-db-check.XXXXXX.sql)"
trap 'rm -f "$sql_file"' EXIT
cat >"$sql_file" <<'SQL'
SELECT 'connection=ok';
SELECT 'database_name=' || current_database();
SELECT 'server_version=' || current_setting('server_version');
SELECT 'connections_to_database=' || count(*) FROM pg_stat_activity WHERE datname = current_database();
SELECT 'ecomed_core_tables=' || count(*)
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('User', 'Point', 'Checkin', 'Wallet', 'CoinTransaction');
SELECT 'latest_user_update=' || COALESCE(MAX("updatedAt")::text, 'none') FROM "User";
SELECT 'latest_checkin=' || COALESCE(MAX("createdAt")::text, 'none') FROM "Checkin";
SELECT 'latest_coin_transaction=' || COALESCE(MAX("createdAt")::text, 'none') FROM "CoinTransaction";
SQL

docker run --rm \
  --env-file /opt/ecomed/.env \
  -v "$sql_file:/tmp/ecomed-db-check.sql:ro" \
  postgres:18-alpine \
  sh -c 'psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -At -f /tmp/ecomed-db-check.sql'
