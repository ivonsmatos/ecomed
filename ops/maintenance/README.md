# Scripts de manutenção (servidor)

Estes scripts são versionados aqui para auditoria, mas **rodam no host VPS** em
`/opt/ecomed/scripts/maintenance/`. O deploy via GitHub Actions sincroniza automaticamente.
Para sincronizar manualmente após mudanças:

```bash
# no servidor
cd /opt/ecomed/app
git pull origin master
install -m 0755 ops/maintenance/healthcheck.sh  /opt/ecomed/scripts/maintenance/healthcheck.sh
install -m 0755 ops/maintenance/cron-missoes.sh /opt/ecomed/scripts/maintenance/cron-missoes.sh
```

---

## healthcheck.sh

Cron instalado automaticamente pelo deploy (a cada 2 min):

```cron
*/2 * * * * /opt/ecomed/scripts/maintenance/healthcheck.sh
```

- Faz GET em `http://127.0.0.1:3010/api/health` (timeout 8s).
- Após 3 falhas consecutivas: `docker restart ecomed-web` + webhook opcional.
- Estado em `/var/lib/ecomed-health/fail_count`, log em `/var/log/ecomed-health.log`.
- Webhook: `HEALTH_WEBHOOK_URL="https://hooks.slack.com/..."` (opcional na env).

---

## cron-missoes.sh

Dispara endpoints de cron de missões. Uso: `cron-missoes.sh reset|ensure`

Crons instalados automaticamente pelo deploy:

```cron
0 3  * * * /opt/ecomed/scripts/maintenance/cron-missoes.sh reset
15 3 * * * /opt/ecomed/scripts/maintenance/cron-missoes.sh ensure
```

Log em `/var/log/ecomed-cron.log`.

---

## db-backup.sh

Já instalado em `/opt/ecomed/scripts/maintenance/db-backup.sh`.
Cron diário 03:30 → `pg_dump` para `/opt/ecomed/backups/ecomed_TIMESTAMP.sql.gz`,
retenção 14 dias.

---

## UptimeRobot — monitor externo

O UptimeRobot monitora o endpoint público e alerta por e-mail/Telegram se o site cair.

### 1. Criar conta

Acesse <https://uptimerobot.com> e crie uma conta gratuita (até 50 monitores, intervalo de 5 min).

### 2. Adicionar monitor HTTP(S)

| Campo              | Valor                                  |
|--------------------|----------------------------------------|
| Monitor Type       | **HTTP(S)**                            |
| Friendly Name      | EcoMed — Production                    |
| URL                | `https://ecomed.eco.br/api/health`     |
| Monitoring Interval| 5 minutos                              |
| HTTP Method        | GET                                    |
| Expected status    | 200                                    |
| Keyword (opcional) | `"ok":true`                            |

> O endpoint `/api/health` retorna `{"ok":true,"timestamp":"..."}` — use o campo
> **Keyword Monitor** com `"ok":true` para detectar degradações que ainda retornam 200.

### 3. Configurar alertas

- **E-mail**: adicione o e-mail do responsável técnico.
- **Telegram**: crie um bot via @BotFather, copie o `chat_id` e adicione a integração.
- **Webhook (Slack)**: Settings → Alert Contacts → Add Alert Contact → Slack.

### 4. Status Page pública (opcional)

UptimeRobot oferece uma status page em `https://stats.uptimerobot.com/XXXXXXXX`.  
Configure em **My Settings → Status Pages** e adicione o monitor EcoMed.

### 5. Variável de ambiente (futuro)

Se quiser expor o uptime real no dashboard de KPIs (`/admin/kpis`), crie um monitor
na aba **API** do UptimeRobot, gere a **Read-Only API Key** e adicione ao `.env`:

```env
UPTIMEROBOT_API_KEY=ur_readonly_xxxxx
UPTIMEROBOT_MONITOR_ID=12345678
```

O `getData.ts` pode então buscar `https://api.uptimerobot.com/v2/getMonitors` para
preencher `tech.uptime` com dados reais em vez do valor estático `99.9`.
