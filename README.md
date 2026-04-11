# EcoMed — App Next.js

PWA educativa que mapeia pontos de coleta de medicamentos no Brasil. Cidadãos localizam farmácias e UBS para descarte correto. Parceiros gerenciam seus pontos. Admins aprovam e moderam. Chatbot com IA (RAG) responde dúvidas sobre legislação e impacto ambiental.

**Produção:** [ecomed.eco.br](https://ecomed.eco.br)  
**Documentação completa do monorepo:** [../README.md](../README.md)

---

## Início Rápido

```bash
cd app
pnpm install
cp .env.example .env.local   # preencher credenciais (ver ../README.md#variáveis-de-ambiente)
pnpm db:generate             # gerar Prisma Client
pnpm db:migrate              # aplicar migrations
pnpm dev                     # http://localhost:3000 (Turbopack)
```

## Scripts

| Comando               | Descrição                                                  |
| --------------------- | ---------------------------------------------------------- |
| `pnpm dev`            | Dev server com Turbopack (sem PWA — usa --webpack em prod) |
| `pnpm build`          | Build de produção (`next build --webpack` — req. serwist)  |
| `pnpm lint`           | ESLint                                                     |
| `pnpm test`           | Vitest (unitários)                                         |
| `pnpm test:e2e`       | Playwright (E2E)                                           |
| `pnpm db:migrate`     | Criar migration Prisma e aplicar em dev                    |
| `pnpm db:generate`    | Regenerar Prisma Client (após mudanças no schema)          |
| `pnpm db:studio`      | Prisma Studio — UI gráfica para o banco                    |
| `pnpm db:seed`        | Popular banco com dados de dev                             |
| `pnpm db:seed:logmed` | Popular banco com pontos de coleta reais                   |

## Stack

- **Next.js 16** — App Router, Server Components, standalone output, `--webpack` em prod
- **Prisma 7** — ORM + migrations, PostgreSQL AWS Lightsail + PostGIS
- **NextAuth v5 (beta)** — autenticação JWT (Google OAuth + credenciais e-mail/senha)
- **Hono** — API Routes tipadas e validadas com Zod (`@hono/zod-validator`)
- **Serwist v9** — Service Worker PWA (Workbox-based) — requer webpack no build
- **Tailwind CSS v4** — estilização utility-first
- **shadcn/ui** — design system baseado em Radix UI / base-ui
- **Leaflet + react-leaflet** — mapas interativos com OpenStreetMap
- **Recharts** — gráficos do painel admin KPIs
- **Resend + React Email** — emails transacionais
- **Cloudflare R2** — storage de imagens (resize via Sharp → WebP)
- **Upstash Redis** — rate limiting (sliding window)
- **Sanity.io** — CMS headless para o blog

## Estrutura

```
src/
├── app/                    # App Router (rotas = pastas)
│   ├── layout.tsx          # root layout (fontes, providers)
│   ├── page.tsx            # landing page pública
│   ├── manifest.ts         # Web App Manifest (PWA)
│   ├── robots.ts           # robots.txt dinâmico
│   ├── sitemap.ts          # sitemap XML dinâmico
│   ├── sw.ts               # Service Worker (Serwist/Workbox)
│   ├── (auth)/             # login, cadastro, reset senha
│   ├── app/                # área cidadão (/app/*)
│   │   ├── conquistas/     # Conquistas estilo Apple Fitness (metas acumuladas)
│   │   ├── quiz/[id]/      # Quiz com alternativas embaralhadas por sessão
│   │   └── perfil/         # Perfil, EcoCoins, histórico e link p/ Conquistas
│   ├── parceiro/           # painel parceiro (/parceiro/*)
│   ├── admin/              # painel admin (/admin/*)
│   │   └── kpis/           # dashboard KPIs real-time (Server + Client)
│   ├── mapa/               # mapa público de pontos
│   ├── blog/               # artigos Sanity CMS
│   ├── ranking/            # ranking semanal de EcoCoins
│   ├── ai/                 # chat com IA (cidadão)
│   ├── offline/            # fallback PWA offline
│   └── api/[[...route]]/   # API catch-all (Hono)
├── components/
│   ├── admin/              # PartnerCandidateActions, KPI widgets
│   ├── app/                # componentes da área do cidadão
│   ├── chat/               # interface do chatbot (EcoBot)
│   ├── coins/              # CoinDisclaimer, RedeemButton
│   ├── layout/             # Header, Footer, BottomNav, Sidebar
│   ├── map/                # MapView, PointCard, MapFilters
│   ├── parceiro/           # PartnerRegistrationForm
│   ├── points/             # PointForm, PointList
│   ├── shared/             # componentes reutilizáveis
│   └── ui/                 # design system (shadcn)
├── lib/
│   ├── db/prisma.ts        # singleton Prisma Client (SSL AWS Lightsail)
│   ├── auth/session.ts     # requireSession, requireAdmin, requirePartner
│   ├── coins/index.ts      # creditCoins, debitCoins (operações atômicas)
│   ├── quiz/shuffle.ts     # Fisher-Yates + token HMAC-SHA256 (embaralhamento stateless)
│   ├── goals/milestones.ts # verificarMilestonesDescarte/Quiz + GRUPOS_METAS
│   ├── qr/token.ts         # gerarTokenQR, validarTokenQR (HMAC-SHA256)
│   ├── email/              # Resend + templates React Email
│   ├── push/               # web-push VAPID
│   ├── ratelimit/          # Upstash sliding window
│   ├── storage/r2.ts       # upload + resize Sharp → WebP → R2
│   ├── sanity/             # client, queries, image builder
│   └── schemas/            # Zod schemas compartilhados front+back
│       └── partner.ts      # inclui validação CNPJ Módulo 11
├── hooks/
│   ├── useGeolocation.ts
│   ├── useOffline.ts
│   └── usePushNotifications.ts
└── generated/prisma/       # Prisma Client gerado (não editar)
```

## Banco de Dados

**AWS Lightsail Managed PostgreSQL** + extensão PostGIS.

```bash
# Aplicar migrations em produção
pnpm exec prisma migrate deploy

# Inspecionar banco (GUI)
pnpm db:studio
```

> **SSL:** `src/lib/db/prisma.ts` usa `ssl: { rejectUnauthorized: false }` em `NODE_ENV=production` — necessário para conectar ao AWS Lightsail a partir do Alpine Linux (certificado CA da AWS não está no bundle padrão do Node.js).

## PWA

Build de produção usa `next build --webpack` — **não remover a flag** enquanto `@serwist/next` não suportar Turbopack (tracking: [serwist/serwist#54](https://github.com/serwist/serwist/issues/54)).

Em desenvolvimento o SW é desabilitado automaticamente (`disable: process.env.NODE_ENV === "development"`).

## Segurança

- Zod em todas as rotas de entrada (auth, parceiro, rewards, check-in, QR)
- CNPJ validado por Módulo 11 (dígitos verificadores) no schema do parceiro
- QR Code: HMAC-SHA256 32 chars + expiração 30 min — `QR_HMAC_SECRET` obrigatório
- Quiz: alternativas embaralhadas com Fisher-Yates por sessão; token HMAC-SHA256 assinado mapeia índices embaralhados → originais no server (stateless — adulteração do token é detectada via `timingSafeEqual`)
- `creditCoins`/`debitCoins`: operações atômicas Prisma (`{ increment }`/`{ decrement }`)
- Resgates de recompensas: `prisma.$transaction()` — valida estoque + saldo atomicamente
- CSP via `middleware.ts` — restritiva para todas as rotas, permissiva apenas para `/studio`
- `x-pathname` encaminhado como request header (`NextResponse.next({ request: { headers } })`) para leitura correta em Server Components
- Rate limiting Upstash em todas as rotas públicas
