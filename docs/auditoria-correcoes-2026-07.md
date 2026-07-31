# Auditoria EcoMed — implementação de 2026-07

Branch: `fix/auditoria-seguranca-integridade`

## Implementado

- remoção de `.claude`, caches, relatórios, pacotes e service worker gerado do índice Git;
- callbacks de autenticação e rotas de recompensas centralizados;
- EcoCoins com transações serializáveis, débitos condicionais e chaves de idempotência;
- migração Prisma para idempotência, replay de QR, idade e retenção;
- QR de ponto assinado exclusivamente por `QR_HMAC_SECRET`, com versão e expiração;
- limite único de check-in por usuário/ponto/dia e bloqueio de reutilização do nonce;
- tokens de recuperação armazenados como SHA-256, uso único, expiração de 30 minutos e rate limit;
- analytics carregados somente após consentimento versionado, com revogação e limpeza de cookies;
- exportação e anonimização LGPD centralizadas;
- retenção técnica do EcoBot e cache de sessões TTL/LRU com limite de concorrência e timeout;
- feedback do EcoBot validado contra a mensagem armazenada no servidor;
- metodologia ambiental centralizada, CO₂/massa não publicados sem validação e página pública;
- sitemap migrado para Sanity e páginas legais adicionadas;
- importação UBS com staging, validação, dry-run, filtros e troca transacional;
- crédito administrativo com motivo, confirmação, dry-run, limite e idempotência;
- Node 22/pnpm fixados, quality gate, Gitleaks, CodeQL, Dependabot, lock e rollback de deploy.

## Migração

Aplicar `prisma/migrations/20260730120000_secure_qr_and_coin_idempotency/migration.sql`
com backup verificado antes do deploy. A migração adiciona restrições únicas; validar previamente
que não existam duplicidades históricas de check-in diário ou feedback por `messageId`.

## Configuração obrigatória

- definir `QR_HMAC_SECRET` exclusivo, com pelo menos 32 caracteres;
- definir `QR_POINT_TOKEN_TTL_SECONDS` conforme a política de rotação dos QR impressos;
- configurar `CRON_SECRET` e chamar `POST /api/cron/retencao-ecobot`;
- configurar limites `ECOBOT_SESSION_TTL_SECONDS`, `ECOBOT_MAX_SESSIONS`,
  `ECOBOT_MAX_CONCURRENCY` e `ECOBOT_REQUEST_TIMEOUT_SECONDS`;
- preencher os marcadores de controlador na Política de Privacidade após validação jurídica.

## Ações manuais pendentes

Estas ações exigem acesso operacional e não foram executadas pelo código:

- revogar a credencial exposta e verificar logs de autenticação;
- configurar usuário de deploy restrito, chave SSH e desativar login root/senha;
- limpar o histórico Git somente depois da revogação, coordenando a ressincronização dos clones;
- cadastrar `QR_HMAC_SECRET` no servidor/CI e rotacionar QR Codes já impressos;
- aplicar a migração após backup e validar restauração;
- configurar backup criptografado externo, retenção, alertas, RPO e RTO;
- exigir os workflows como checks de branch protection em `master`;
- revisão jurídica da Política de Privacidade, Termos e afirmações regulatórias.

## Riscos técnicos residuais

- check-in e lançamento financeiro possuem idempotência, unicidade e compensação automática, mas
  ainda não compartilham a mesma transação Prisma porque o serviço financeiro abre uma transação
  serializável própria;
- estatísticas públicas históricas da home/Sobre ainda precisam ser migradas para uma única fonte
  dinâmica, com revisão editorial das afirmações externas;
- quantidade, categoria, faixa de peso/volume e confirmação pelo parceiro ainda não foram incluídas
  na UX de check-in;
- consentimento de cookies fica no navegador e não integra a exportação JSON do servidor;
- a suíte crítica de E2E e testes reais de concorrência exige PostgreSQL/Redis e credenciais de
  teste; os testes locais adicionados cobrem unidades puras e contratos.

## Validação local

- Prisma schema: válido;
- TypeScript: aprovado;
- Vitest: 81 testes aprovados;
- Pytest: 53 testes aprovados;
- ESLint: aprovado, com quatro avisos preexistentes;
- Next.js 16.2.2 build: aprovado.
