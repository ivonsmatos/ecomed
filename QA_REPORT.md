# QA Completo — ivonsmatos/ecomed

> Relatório gerado em 2026-04-07. Branch analisada: padrão (`main`).

---

## 1. Visão Geral do Projeto

**Objetivo:** EcoMed é uma PWA (Progressive Web App) para incentivo ao descarte correto de medicamentos. Os cidadãos localizam pontos de coleta no mapa, fazem check-in presencial, ganham EcoCoins (gamificação), completam quizzes e missões, e resgatam recompensas. Parceiros (farmácias/drogarias) cadastram pontos de coleta e escaneiam QR codes. Admins aprovam pontos e gerenciam usuários.

**Stack:**

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16.2.2 (App Router, standalone output, React 19) |
| Linguagem | TypeScript 5 strict mode |
| API | Hono — catch-all `src/app/api/[[...route]]/` |
| ORM / DB | Prisma 7 + PostgreSQL (Supabase/pgbouncer, PostGIS) |
| Autenticação | NextAuth v5 (beta.30) — JWT, Google OAuth + Credentials |
| UI | Tailwind CSS v4 + shadcn/ui (@base-ui/react) |
| PWA | Serwist v9 (Workbox) |
| CMS | Sanity v5 — artigos do blog |
| Storage | Cloudflare R2 — imagens |
| Rate Limiting | Upstash Redis |
| E-mail | Resend + React Email |
| Push | web-push (VAPID) |
| Monitoramento | Sentry v10 (instalado, **não configurado**) |

**Estrutura de pastas:**

```
src/
├── app/
│   ├── (auth)/              # Rotas de autenticação (login, cadastro, reset)
│   ├── app/                 # Área do cidadão (autenticado)
│   ├── parceiro/            # Painel do parceiro
│   ├── admin/               # Painel de administração
│   ├── mapa/, blog/, ...    # Rotas públicas
│   └── api/[[...route]]/    # API Hono (catch-all)
│       └── routes/          # Roteadores individuais por domínio
├── components/              # Componentes React
├── lib/                     # Utilitários (db, auth, email, coins, push, r2)
├── hooks/                   # Custom hooks
└── generated/prisma/        # Prisma Client (auto-gerado, .gitignored)
```

---

## 2. Build, Execução e DX (Developer Experience)

### ✅ Pontos Positivos

- README bem estruturado com tabela de scripts, stack e estrutura de pastas.
- `pnpm` com `pnpm-lock.yaml` e `pnpm-workspace.yaml` — lockfile determinístico.
- Dockerfile multi-stage (base → deps → builder → runner) com usuário não-root (`nextjs:nodejs`).
- `prisma.config.ts` separado com `DIRECT_URL` para evitar conflito com pgbouncer.
- `vercel.json` configura o cron job corretamente.

### ❌ Problemas

#### 🔴 Crítico — `.env.example` ausente

> `README.md:9`

O README instrui `cp .env.example .env.local`, mas o arquivo `.env.example` **não existe** no repositório. Qualquer desenvolvedor novo que siga as instruções falhará imediatamente. As variáveis de ambiente necessárias não estão documentadas em lugar nenhum.

#### 🟡 Médio — `husky` e `lint-staged` declarados mas não configurados

> `package.json:89-90`

`husky` e `lint-staged` estão como devDependencies mas não há diretório `.husky/` nem configuração `"lint-staged"` no `package.json`. Os hooks de pré-commit não funcionam — código mal formatado ou com erros de lint pode entrar na base.

#### 🟡 Médio — README com boilerplate do `create-next-app`

> `README.md:82–114`

As seções "Getting Started", "Learn More" e "Deploy on Vercel" são o boilerplate gerado automaticamente, irrelevantes para o projeto. Poluem e confundem novos contribuidores.

#### 🟡 Médio — Conflito Turbopack (dev) vs Webpack (build)

> `package.json:6-7`, `Dockerfile:35`

```json
"dev": "next dev --turbopack",
"build": "next build --webpack"
```

O projeto é desenvolvido com Turbopack mas buildado com Webpack. Pode mascarar comportamentos diferentes entre ambientes (bundle splitting, transpilação).

#### 🟡 Médio — Ausência total de CI/CD

Não há diretório `.github/` — zero GitHub Actions. Nenhum pipeline de lint/test/build ao fazer PR ou push para `main`.

---

## 3. Qualidade de Código

### ✅ Pontos Positivos

- Código organizado com separação clara de responsabilidades.
- Validação de entrada consistente com Zod em todos os endpoints Hono.
- TypeScript strict mode (`tsconfig.json:8`).
- ESLint configurado com `eslint-config-next` (`eslint.config.mjs`).
- Schemas centralizados em `src/lib/schemas/`.

### ❌ Problemas

#### 🟡 Médio — `as never` para burlar o type system do Prisma

> `src/lib/coins/index.ts:232, 243, 276`  
> `src/app/api/[[...route]]/routes/missions.ts:161, 216`

```ts
level: novoNivel as never,
event: event as never,
```

Indica que o tipo gerado pelo Prisma e os enums do código não estão sincronizados. `event` é um `string` genérico em vez de `CoinEvent`. **Solução:** tipar corretamente usando os enums exportados pelo Prisma Client gerado.

#### 🟡 Médio — `requireAdminSession` com retorno ambíguo

> `src/app/api/[[...route]]/routes/admin.ts:10–16`

```ts
async function requireAdminSession(c) {
  const session = await auth();
  if (!session?.user?.id) return c.json({ error: "Não autenticado" }, 401);
  // ...
  return session; // ou resposta Hono
}
```

A função retorna a sessão OU uma resposta Hono — callers detectam qual caso é usando `"json" in r`. Frágil e não type-safe. **Solução:** lançar erro ou usar um Result type.

#### 🟡 Médio — Inconsistência de padrão entre `requireAdminSession` e `requirePartnerSession`

> `admin.ts:10-16` vs `parceiro.ts:55-64`

Duas funções com a mesma responsabilidade mas interfaces completamente diferentes. `src/lib/auth/session.ts` já exporta `requireAdmin` e `requirePartner` para Server Components — esses não são usados nas rotas Hono.

#### 🟡 Médio — KPI page usa mock data estático

> `src/app/admin/kpis/page.tsx:10`

```ts
// MOCK DATA — Substituir por queries reais ao banco
const DATA = { northStar: {...}, users: {...}, ... }
```

A página de KPIs do admin — crítica para tomada de decisão — exibe dados completamente fictícios.

#### 🔵 Baixo — Ranking exibe `totalEarned` mas se intitula "semanal"

> `src/app/ranking/page.tsx:7-9`

```ts
orderBy: { totalEarned: "desc" }  // lifetime, não semanal
```

O campo `weeklyCoins` existe no modelo `Wallet` exatamente para o ranking semanal e não é usado aqui.

#### 🔵 Baixo — Modelo `Article` no Prisma sem uso aparente

> `prisma/schema.prisma:242-254`

O blog é gerenciado pelo Sanity CMS (`src/lib/sanity/`). O modelo `Article` no Prisma parece dívida técnica não documentada.

---

## 4. Testes

### 🔴 Crítico — Zero cobertura de testes

`package.json` lista `vitest` e `@playwright/test` como devDependencies, e os scripts `test` e `test:e2e` existem. Porém:

- Não há nenhum arquivo `*.test.ts` / `*.spec.ts` no repositório.
- Não há `vitest.config.ts` ou `playwright.config.ts`.
- `pnpm test` executa o Vitest sem encontrar nada.

**Áreas críticas sem cobertura:**

| Módulo | Função | Risco |
|--------|--------|-------|
| `src/lib/coins/index.ts` | `creditCoins`, `debitCoins`, `calcularNivel`, `calcularStreak` | Regressão silenciosa na gamificação |
| `src/lib/qr/token.ts` | `gerarTokenQR`, `validarTokenQR` | Falha de segurança nos check-ins |
| `src/app/api/.../rewards.ts` | Fluxo de resgate | Race condition em produção |
| Fluxos de auth | Login, cadastro, reset de senha | Quebra de acesso |

---

## 5. Segurança

### ✅ Pontos Positivos

- CSP configurado no middleware com políticas distintas para `/studio` (`middleware.ts:15-44`).
- Headers de segurança em `next.config.ts:44-53` (HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy).
- Rate limiting por IP com Upstash Redis (`src/lib/ratelimit/index.ts`).
- HMAC com `timingSafeEqual` no QR token (`src/lib/qr/token.ts:49`).
- Bcrypt com custo 12 para hashing de senhas.
- Proteção contra enumeração de e-mail no reset de senha (`src/app/api/auth/recuperar-senha/route.ts:16`).

### ❌ Problemas

#### 🔴 Crítico — Fallback de secret hardcoded no QR token

> `src/lib/qr/token.ts:3-6`

```ts
const SECRET =
  process.env.QR_HMAC_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  "fallback-dev-secret"   // ← HARDCODED
```

Em qualquer ambiente onde as variáveis não estejam definidas, o HMAC usa `"fallback-dev-secret"`. Um atacante que conheça esse valor pode forjar tokens QR e fazer check-ins em nome de qualquer usuário.

**Correção:**
```ts
const SECRET = process.env.QR_HMAC_SECRET ?? process.env.NEXTAUTH_SECRET;
if (!SECRET) throw new Error("QR_HMAC_SECRET ou NEXTAUTH_SECRET deve estar definido");
```

#### 🔴 Crítico — Race condition no resgate de recompensas

> `src/app/api/[[...route]]/routes/rewards.ts:102-158`

O fluxo verifica estoque → debita coins → cria registro → decrementa estoque em operações **separadas sem transação atômica**. Sob concorrência, dois usuários podem resgatar simultaneamente uma recompensa com `stock: 1`.

**Correção:** envolver toda a lógica em `prisma.$transaction`.

#### 🟠 Alto — HMAC truncado para 64 bits

> `src/lib/qr/token.ts:20, 44`

```ts
.digest("hex").slice(0, 16)  // apenas 64 bits
```

Usar apenas 16 caracteres hexadecimais (8 bytes = 64 bits) reduz a segurança do HMAC. **Recomendado:** usar `.slice(0, 32)` (128 bits).

#### 🟠 Alto — `rejectUnauthorized: false` em produção

> `src/lib/db/prisma.ts:11-13`

```ts
ssl: process.env.NODE_ENV === "production"
  ? { rejectUnauthorized: false }
  : undefined,
```

Em produção, o SSL aceita certificados inválidos/autoassinados, permitindo ataques MITM ao banco. A Supabase usa certificados CA válidos — este flag deveria ser removido ou configurado com o CA correto.

#### 🟠 Alto — `req.json()` sem validação de schema

> `src/app/api/auth/recuperar-senha/route.ts:7`  
> `src/app/api/auth/redefinir-senha/route.ts:6`

Essas rotas Next.js (fora do Hono) fazem `await req.json()` com validação manual básica. Deveriam usar Zod, como as demais rotas da aplicação.

#### 🟠 Alto — Sentry instalado mas não configurado

`@sentry/nextjs` está em `dependencies` (v10.47.0) mas não há `sentry.client.config.ts`, `sentry.server.config.ts` nem `sentry.edge.config.ts`. O pacote aumenta o bundle size sem capturar nenhum erro.

#### 🟡 Médio — CNPJ sem validação de dígitos verificadores

> `src/lib/schemas/partner.ts:4-6`

```ts
cnpj: z.string().regex(/^\d{14}$/, "CNPJ deve conter 14 dígitos")
```

Qualquer sequência de 14 dígitos é aceita (ex: `00000000000000`). A validação do algoritmo Módulo 11 não está implementada.

#### 🟡 Médio — `'unsafe-inline'` na Content-Security-Policy

> `middleware.ts:17`

```
script-src 'self' 'unsafe-inline' ...
```

`'unsafe-inline'` anula grande parte da proteção XSS da CSP. **Alternativa:** usar nonces via `next/headers`.

#### 🟡 Médio — Senhas hardcoded no seed de desenvolvimento

> `prisma/seed.ts:15-16, 31-32`

```ts
const adminHash = await bcrypt.hash("Admin@123", 12);
const partnerHash = await bcrypt.hash("Parceiro@123", 12);
```

Senhas em texto claro no código-fonte — podem ser reutilizadas por descuido em produção.

#### 🟡 Médio — Endpoint de cron protegido apenas por Bearer token

> `src/app/api/cron/reset-missoes/route.ts:7`

A rota é pública e qualquer um que descubra o `CRON_SECRET` pode resetar missões de todos os usuários. Considerar verificação adicional de IP de origem da Vercel.

#### 🔵 Baixo — Tokens de reset de senha sem cleanup

> `prisma/schema.prisma:263-270`

Não há job para deletar tokens expirados — eles acumulam indefinidamente na tabela `PasswordResetToken`.

---

## 6. Performance e Confiabilidade

### ✅ Pontos Positivos

- Query geoespacial com PostGIS `ST_DWithin` nativa e parametrizada (`src/app/api/.../pontos.ts:39-56`).
- `Promise.all` para queries paralelas (`admin.ts:23-28`).
- `prisma.pointView.create().catch(() => {})` fire-and-forget para não bloquear resposta (`pontos.ts:78`).
- Paginação nas listagens admin e parceiro.
- Service Worker com estratégias diferenciadas: NetworkFirst para API, CacheFirst para tiles OSM e imagens R2.
- Imagens processadas com sharp (resize + WebP) antes do upload no R2.

### ❌ Problemas

#### 🟠 Alto — Race condition na lógica de crédito de EcoCoins

> `src/lib/coins/index.ts:181-258`

`creditCoins` busca a wallet, verifica limites, calcula novo balance e atualiza — tudo em operações separadas. Duas chamadas concorrentes pelo mesmo usuário podem:

1. Ler o mesmo balance inicial.
2. Ambas passarem pela verificação de limite.
3. Ambas gravarem o mesmo balance final, perdendo um crédito.

**Correção:** usar `balance: { increment: amount }` (atômico no Prisma) em vez de `balance: novoBalance`.

#### 🟡 Médio — Múltiplas queries sequenciais em `GET /api/missions`

> `src/app/api/[[...route]]/routes/missions.ts:125-240`

No pior caso, a rota faz 8+ round trips ao banco em sequência (findMany → upsert em loop → findMany novamente → findUnique wallet → findMany semanais → upsert em loop → findMany). **Solução:** batch upserts e reutilização dos dados já carregados.

#### 🟡 Médio — Ranking público sem cache

> `src/app/ranking/page.tsx`

Página pública com `force-dynamic` consulta o banco a cada requisição. **Solução:**
```ts
export const revalidate = 60; // cache por 60 segundos
```

#### 🔵 Baixo — `auth()` chamado repetidamente por requisição

Em cada endpoint Hono, `auth()` é chamado diretamente dentro do handler e também dentro dos helpers `requireAdminSession`/`requirePartnerSession`. Sem memoization por request, gera múltiplas verificações de JWT por requisição.

---

## 7. Arquitetura e Manutenibilidade

### ✅ Pontos Positivos

- Separação clara de camadas: routes (Hono) → lib → db (Prisma).
- Schemas Zod centralizados e reutilizados entre API e frontend.
- Middleware Next.js responsável por auth guard + CSP de forma centralizada.
- Naming em português consistente com o domínio.

### ❌ Problemas

#### 🟠 Alto — Lógica de negócio de missões no route handler

> `src/app/api/[[...route]]/routes/missions.ts` (347 linhas)

Pools de missões hardcoded, algoritmos de shuffle, cálculo de datas e múltiplas queries ao banco — tudo no route handler. Deveria ser extraído para `src/lib/missions/service.ts`.

#### 🟡 Médio — Dois sistemas de auth guard paralelos e duplicados

`src/lib/auth/session.ts` exporta `requireAdmin`, `requirePartner` (usados em Server Components). As rotas Hono implementam suas próprias versões (`requireAdminSession`, `requirePartnerSession`) com interfaces diferentes. Lógica duplicada e inconsistente.

#### 🟡 Médio — `UserReward.status` como String livre

> `prisma/schema.prisma:400`

```prisma
status  String  @default("PENDING") // PENDING | DELIVERED | CANCELLED
```

Sem enum Prisma, qualquer string é aceita. **Solução:** criar enum `RewardStatus`.

#### 🔵 Baixo — Deploy dual não documentado

O projeto tem `wrangler.toml` (Cloudflare Pages), `Dockerfile` (Docker/VPS) e `vercel.json` (cron via Vercel). Três estratégias conflitantes: `wrangler.toml` aponta para `.vercel/output/static`, mas `next.config.ts` usa `output: "standalone"` (incompatível). Precisa ser documentado e o arquivo desatualizado removido.

---

## 8. CI/CD e Observabilidade

### ❌ Problemas

#### 🔴 Crítico — Ausência total de CI/CD

Não existe diretório `.github/` nem nenhum workflow. Nenhuma automação de:

- Lint (ESLint + Prettier)
- Type checking (`tsc --noEmit`)
- Testes (Vitest + Playwright)
- Build
- Deploy

Qualquer push para `main` pode quebrar o projeto em produção sem aviso.

#### 🟠 Alto — Sentry instalado mas não inicializado

Erros de produção não são capturados. O pacote `@sentry/nextjs` está no bundle sem efeito.

#### 🟡 Médio — Logging via `console.error` apenas

Erros de email são silenciados com `.catch(console.error)` (`admin.ts:80, 109, 236, 264`; `parceiro.ts:49`). Em serverless/edge, logs do console podem não persistir. Com Sentry configurado, esses erros deveriam ser capturados via `Sentry.captureException`.

#### 🔵 Baixo — `maxDuration = 60` sem timeouts explícitos nos endpoints

> `src/app/api/[[...route]]/route.ts:21`

Apenas o endpoint de chat tem `AbortSignal.timeout`. Endpoints com múltiplas queries (ex: `/api/missions`) podem bloquear por até 60 segundos sem controle.

---

## 9. Checklist Final e Plano de Ação

### 🔴 Crítico — Ação Imediata

| # | Achado | Arquivo | Sugestão |
|---|--------|---------|----------|
| C1 | `.env.example` ausente | — | Criar com todas as variáveis necessárias documentadas |
| C2 | Fallback hardcoded `"fallback-dev-secret"` no QR HMAC | `src/lib/qr/token.ts:3-6` | Lançar erro se os secrets não estiverem definidos |
| C3 | Race condition no resgate de recompensas | `src/app/api/.../rewards.ts:102-158` | Envolver verificação + débito + criação em `prisma.$transaction` |
| C4 | Zero testes | — | Criar testes unitários para `creditCoins`, `validarTokenQR`, `calcularNivel` |
| C5 | Ausência de CI/CD | — | Adicionar GitHub Actions: lint → typecheck → test → build |

### 🟠 Alto — Sprint 1

| # | Achado | Arquivo | Sugestão |
|---|--------|---------|----------|
| A1 | `rejectUnauthorized: false` em produção | `src/lib/db/prisma.ts:11-13` | Remover ou usar o CA correto da Supabase |
| A2 | HMAC truncado (64 bits) | `src/lib/qr/token.ts:20, 44` | Aumentar para `.slice(0, 32)` (128 bits) |
| A3 | Race condition em `creditCoins` | `src/lib/coins/index.ts:215-248` | Usar `balance: { increment: amount }` atômico |
| A4 | `req.json()` sem validação Zod nas rotas de auth | `src/app/api/auth/recuperar-senha/route.ts`, `redefinir-senha/route.ts` | Migrar para Zod schema |
| A5 | Sentry instalado mas não configurado | `package.json:33` | Configurar os arquivos `sentry.*.config.ts` ou remover |

### 🟡 Médio — Sprint 2

| # | Achado | Arquivo | Sugestão |
|---|--------|---------|----------|
| M1 | Husky/lint-staged sem configuração | `package.json` | Adicionar `.husky/pre-commit` + config `"lint-staged"` |
| M2 | KPI page com mock data | `src/app/admin/kpis/page.tsx:10` | Implementar queries reais ao banco |
| M3 | Ranking exibe `totalEarned` como "semanal" | `src/app/ranking/page.tsx:7-9` | Usar `weeklyCoins` + `export const revalidate = 60` |
| M4 | CNPJ sem validação de dígitos verificadores | `src/lib/schemas/partner.ts:4-6` | Implementar algoritmo Módulo 11 no Zod `.refine()` |
| M5 | `'unsafe-inline'` na CSP | `middleware.ts:17` | Implementar nonces via `next/headers` |
| M6 | Lógica de missões no route handler (347 linhas) | `missions.ts` | Extrair para `src/lib/missions/service.ts` |
| M7 | `UserReward.status` como String livre | `prisma/schema.prisma:400` | Criar enum `RewardStatus` no Prisma |
| M8 | Múltiplas queries sequenciais em `/api/missions` | `missions.ts:125-240` | Reduzir round trips com batch upsert |
| M9 | `auth()` chamado redundantemente | Vários routes | Passar sessão como parâmetro para helpers |

### 🔵 Baixo — Backlog

| # | Achado | Arquivo | Sugestão |
|---|--------|---------|----------|
| B1 | README com boilerplate `create-next-app` | `README.md:82-114` | Remover seções irrelevantes |
| B2 | Senhas hardcoded no seed | `prisma/seed.ts:15-16, 31-32` | Ler de variáveis de ambiente com fallback aleatório |
| B3 | Modelo `Article` no Prisma sem uso | `prisma/schema.prisma:242-254` | Documentar intenção ou remover |
| B4 | Conflito Turbopack (dev) vs Webpack (build) | `package.json:6-7` | Padronizar para um bundler nos dois ambientes |
| B5 | Tokens de reset sem job de limpeza | `prisma/schema.prisma:263-270` | Adicionar cron para deletar tokens expirados |
| B6 | Ranking sem cache | `src/app/ranking/page.tsx` | `export const revalidate = 60` |
| B7 | Deploy dual não documentado | `wrangler.toml`, `Dockerfile`, `vercel.json` | Documentar qual strategy está ativa e remover as obsoletas |

---

### ⚡ Quick Wins (< 1 hora cada)

1. Criar `.env.example` com todas as variáveis necessárias.
2. Corrigir o ranking para usar `weeklyCoins` + cache.
3. Remover o fallback hardcoded em `src/lib/qr/token.ts` — falhar com erro explícito.
4. Aumentar HMAC de 16 para 32 chars em `src/lib/qr/token.ts`.
5. Remover boilerplate do README.
6. Adicionar `export const revalidate = 60` na página de ranking.

### 🏗️ Mudanças Estruturais

1. **CI/CD**: GitHub Actions com pipeline lint → typecheck → test → build por PR e push.
2. **Testes**: Vitest para toda lógica de coins/gamificação; Playwright para fluxos críticos (login, check-in, resgate).
3. **Transações atômicas**: `creditCoins` e `rewards/redeem` com operações atômicas do Prisma.
4. **Serviços**: Extrair lógica de missões para `src/lib/missions/service.ts` e consolidar os helpers de auth.
5. **Sentry**: Configurar monitoramento de erros em produção.
6. **`UserReward.status`**: Migrar de `String` para enum Prisma `RewardStatus`.
