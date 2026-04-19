# Scripts de manutenção (servidor)

Estes scripts são versionados aqui para auditoria, mas **rodam no host VPS** em
`/opt/ecomed/scripts/maintenance/`. Sincronizar manualmente após mudanças:

```bash
# no servidor
cd /opt/ecomed/app
git pull origin master
install -m 0755 ops/maintenance/healthcheck.sh /opt/ecomed/scripts/maintenance/healthcheck.sh
```

## healthcheck.sh

Cron sugerido (a cada 2 min):

```cron
*/2 * * * * HEALTH_WEBHOOK_URL="https://hooks.slack.com/..." /opt/ecomed/scripts/maintenance/healthcheck.sh
```

- Faz GET em `http://127.0.0.1:3010/api/health` (timeout 8s).
- Após 3 falhas consecutivas: `docker restart ecomed-web` + webhook opcional.
- Estado em `/var/lib/ecomed-health/fail_count`, log em `/var/log/ecomed-health.log`.
- Webhook é opcional — se vazio, apenas reinicia e loga.

## db-backup.sh

Já instalado em `/opt/ecomed/scripts/maintenance/db-backup.sh`.
Cron diário 03:30 → `pg_dump` para `/opt/ecomed/backups/ecomed_TIMESTAMP.sql.gz`,
retenção 14 dias.
