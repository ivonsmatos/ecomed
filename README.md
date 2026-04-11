# EcoMed — Descarte certo, planeta saudável

> PWA educativa que mapeia pontos de coleta de medicamentos no Brasil. Cidadãos encontram farmácias e UBS para descarte correto. Parceiros se cadastram. Admins aprovam. Um chatbot com RAG responde dúvidas sobre legislação e impacto ambiental.

**Produção:** [ecomed.eco.br](https://ecomed.eco.br)  
**Repositório:** [github.com/ivonsmatos/ecomed](https://github.com/ivonsmatos/ecomed)  
**Stack:** Next.js 16 · Prisma 7 · PostgreSQL (AWS Lightsail) · FastAPI · Docker · Cloudflare

---

## Índice

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Infraestrutura e Deploy](#infraestrutura-e-deploy)
- [Estrutura do Monorepo](#estrutura-do-monorepo)
- [App — Next.js](#app--nextjs)
  - [Rotas e Páginas](#rotas-e-páginas)
  - [API Routes (Hono)](#api-routes-hono)
  - [Autenticação e RBAC](#autenticação-e-rbac)
  - [Banco de Dados (Prisma + PostgreSQL)](#banco-de-dados-prisma--postgresql)
  - [PWA e Service Worker](#pwa-e-service-worker)
  - [Upload de Imagens (R2)](#upload-de-imagens-r2)
  - [Notificações Push](#notificações-push)
  - [Rate Limiting](#rate-limiting)
  - [Emails](#emails)
  - [Gamificação EcoCoins](#gamificação-ecocoins)
  - [QR Code e Check-in Presencial](#qr-code-e-check-in-presencial)
  - [Painel Admin KPIs](#painel-admin-kpis)
- [IA — FastAPI + RAG](#ia--fastapi--rag)
  - [Pipeline RAG](#pipeline-rag)
  - [Guardrails](#guardrails)
  - [Base de Conhecimento](#base-de-conhecimento)
  - [Indexação de Documentos](#indexação-de-documentos)
- [Schema do Banco](#schema-do-banco)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Desenvolvimento Local](#desenvolvimento-local)
- [Deploy em Produção](#deploy-em-produção)
- [CI/CD](#cicd)
- [Segurança](#segurança)
- [Convenções](#convenções)

---

## Visão Geral

O EcoMed resolve um problema ambiental concreto: medicamentos descartados incorrectamente no lixo comum ou ralo contaminam rios, lençóis freáticos e solos. A plataforma conecta cidadãos a pontos de coleta verificados (farmácias, UBS, ecopontos) e educa sobre legislação e impacto ambiental por meio de um chatbot com inteligência artificial.

### Perfis de Usuário

| Role      | Descrição                                                          | Rotas             |
| --------- | ------------------------------------------------------------------ | ----------------- |
| `CITIZEN` | Cidadão padrão — consulta mapa, salva favoritos, reporta problemas | `/mapa`, `/app/*` |
| `PARTNER` | Farmácia/UBS parceira — gerencia seus pontos de coleta             | `/parceiro/*`     |
| `ADMIN`   | Administrador — aprova parceiros/pontos, modera reportes           | `/admin/*`        |

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        USUÁRIO FINAL                            │
│                   Browser / PWA instalada                       │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE (Edge)                            │
│              WAF · CDN · DDoS Protection · DNS                  │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS (proxy para VPS)
                             ▼
┌─────────────────┐  ┌──────────────────────────────────────────┐
│  Static Assets  │  │  VPS Oracle Cloud — Next.js standalone   │
│  (CDN Cache)    │  │  Nginx :443 → Docker :3010               │
│  _next/static   │  │  App Router · Server Components · Hono   │
└─────────────────┘  └─────────────────────────┬────────────────┘
                                                │
                        ┌───────────────────────┼────────────────┐
                        │                       │                │
                        ▼                       ▼                ▼
              ┌─────────────────┐  ┌────────────────┐  ┌────────────────┐
              │  Supabase DB    │  │  Upstash Redis │  │  Cloudflare R2 │
              │  PostgreSQL +   │  │  Rate Limiting │  │  Imagens/Fotos │
              │  PostGIS        │  │  (slidingWindow│  │  + CDN custom  │
              └─────────────────┘  └────────────────┘  └────────────────┘
                        │
                        ▼
              ┌─────────────────────────────────────────────┐
              │          VPS Oracle Cloud (Ubuntu 22.04)    │
              │                                             │
              │  ┌────────────┐  ┌──────────┐  ┌────────┐  │
              │  │ FastAPI IA │  │  Ollama  │  │PGVector│  │
              │  │  :8002     │  │  :11434  │  │:5432   │  │
              │  │  RAG chain │  │ llama3.2 │  │pgvector│  │
              │  │  guardrails│  │ nomic-   │  │ docker │  │
              │  └────────────┘  │ embed    │  └────────┘  │
              │                  └──────────┘               │
              │  ┌────────────────────────────────────────┐  │
              │  │     ecomed-app (Next.js standalone)    │  │
              │  │     Docker :3010 + Nginx :443          │  │
              │  └────────────────────────────────────────┘  │
              └─────────────────────────────────────────────┘

Serviços Externos:
  ├── Resend          → Emails transacionais
  ├── Sanity CMS      → Blog / artigos educativos
  ├── Google OAuth    → Login social
  └── Sentry          → Monitoramento de erros
```

### Fluxo: Cidadão busca um ponto

```
1. Browser abre /mapa
2. Cloudflare WAF/CDN → Nginx no VPS → Next.js Docker :3010
3. Leaflet carrega → geolocalização do usuário
4. GET /api/pontos/proximos?lat=&lng=&raio=
5. Hono → checkRateLimit("map", ip) → Prisma $queryRaw PostGIS ST_DWithin
6. Retorna JSON com pontos ordenados por distância
7. Service Worker (Serwist) armazena resposta → disponível offline
8. Leaflet renderiza os pins no mapa
```

### Fluxo: Chat com IA

```
1. Usuário digita pergunta no chat
2. POST /api/chat { pergunta }
3. Next.js → checkRateLimit("chat", ip)
4. fetch → FastAPI VPS /chat { Authorization: Bearer TOKEN }
5. FastAPI → guardrails (regex, sem custo de tokens)
   ├── Bloqueado? → resposta específica por categoria
   └── Permitido? → RAGService.perguntar()
6. RAG → pgvector similarity search (k=4 chunks) → Ollama llama3.2
7. LLM gera resposta em pt-BR com contexto dos docs
8. Resposta volta para o browser
```

### Fluxo: Cadastro de Parceiro

```
1. Usuário CITIZEN acessa /app/seja-parceiro
2. Preenche formulário (CNPJ, razão social, telefone)
3. POST /api/parceiro/cadastro → cria registro Partner (role ainda = CITIZEN)
4. Email "solicitação recebida" → usuário
5. Admin acessa /admin/parceiros → vê candidatos em análise
6. POST /api/admin/parceiros/:id/aprovar → role = PARTNER + email aprovação
   ou POST /api/admin/parceiros/:id/rejeitar → deleta Partner + email rejeição
7. Usuário aprovado acessa /parceiro/dashboard
```

---

## Infraestrutura e Deploy

| Componente             | Serviço                                      | URL                   |
| ---------------------- | -------------------------------------------- | --------------------- |
| Frontend / App Next.js | VPS Oracle Cloud — Docker :3010 + Nginx :443 | ecomed.eco.br         |
| DNS / WAF / CDN        | Cloudflare (proxy reverso)                   | ecomed.eco.br         |
| Banco principal        | AWS Lightsail Managed PostgreSQL + PostGIS   | :5432                 |
| Rate limiting          | Upstash Redis                                | REST API              |
| Imagens                | Cloudflare R2                                | uploads.ecomed.eco.br |
| Blog / CMS             | Sanity.io                                    | sanity.io/manage      |
| Emails                 | Resend                                       | resend.com            |
| IA API                 | VPS Oracle Cloud Ubuntu 22.04                | :8002                 |
| Embeddings / LLM       | Ollama (Docker) — Groq API (produção)        | :11434                |
| Vetores                | PGVector (Docker)                            | :5432                 |
| Monitoramento          | Beszel (agent + hub)                         | VPS :8080             |

**VPS Oracle Cloud** (`45.151.122.234`) — containers Docker ativos:

| Container         | Imagem                   | Porta | Função                      |
| ----------------- | ------------------------ | ----- | --------------------------- |
| `ecomed-web`      | `ecomed-app`             | 3010  | Next.js standalone (app)    |
| `ecomed-ia`       | `ia-api`                 | 8002  | FastAPI RAG                 |
| `ecomed-ollama`   | `ollama/ollama:latest`   | 11434 | LLM local (fallback)        |
| `ecomed-pgvector` | `pgvector/pgvector:pg16` | —     | Banco vetorial da IA        |
| `beszel-agent`    | `henrygd/beszel-agent`   | —     | Agente de monitoramento VPS |
| `beszel-hub`      | `henrygd/beszel`         | —     | Hub de monitoramento        |

> **Importante:** o banco de dados principal é o **AWS Lightsail Managed PostgreSQL** — não o pgvector acima. O pgvector é exclusivo para embeddings da IA.

> **SSL no Prisma:** a conexão com o AWS Lightsail usa `ssl: { rejectUnauthorized: false }` em produção porque o certificado CA da AWS não está no bundle padrão do Node.js/Alpine. A criptografia TLS permanece ativa.

---

## Estrutura do Monorepo

```
ecomed/
├── README.md                    ← este arquivo
├── app/                         ← Next.js 16 (PWA)
│   ├── Dockerfile               ← build multi-stage para VPS
│   ├── next.config.ts           ← Serwist PWA + imagens R2
│   ├── middleware.ts            ← RBAC por role
│   ├── auth.ts                  ← NextAuth v5 (Google + Credentials)
│   ├── wrangler.toml            ← config Wrangler (não usado em produção)
│   ├── prisma/
│   │   ├── schema.prisma        ← fonte da verdade do banco
│   │   ├── seed.ts              ← dados iniciais de dev
│   │   └── migrations/          ← histórico de migrações
│   └── src/
│       ├── app/                 ← App Router
│       │   ├── layout.tsx       ← root layout (Inter, ThemeProvider, Toaster)
│       │   ├── page.tsx         ← landing page pública
│       │   ├── manifest.ts      ← Web App Manifest
│       │   ├── robots.ts        ← robots.txt
│       │   ├── sitemap.ts       ← sitemap dinâmico
│       │   ├── sw.ts            ← Service Worker (Serwist)
│       │   ├── offline/         ← página fallback offline (PWA)
│       │   ├── (auth)/          ← login, cadastro, recuperar senha
│       │   ├── mapa/            ← mapa público (SSG)
│       │   ├── blog/            ← artigos (Sanity CMS)
│       │   ├── app/             ← área cidadão autenticado
│       │   ├── parceiro/        ← painel do parceiro
│       │   ├── admin/           ← painel administrativo
│       │   └── api/[[...route]]/← API catch-all (Hono)
│       ├── components/
│       │   ├── admin/           ← PartnerCandidateActions, etc.
│       │   ├── app/             ← componentes da área do cidadão
│       │   ├── chat/            ← interface do chatbot
│       │   ├── layout/          ← Header, Footer, Sidebar
│       │   ├── map/             ← MapView, PointCard, MapFilters
│       │   ├── parceiro/        ← PartnerRegistrationForm, etc.
│       │   ├── points/          ← PointForm, PointList
│       │   ├── shared/          ← componentes reutilizáveis
│       │   └── ui/              ← design system (shadcn)
│       ├── lib/
│       │   ├── db/prisma.ts     ← singleton do Prisma Client
│       │   ├── auth/session.ts  ← requireSession, requireAdmin, requirePartner
│       │   ├── email/           ← Resend + templates React Email
│       │   ├── push/            ← web-push VAPID
│       │   ├── ratelimit/       ← Upstash sliding window
│       │   ├── storage/r2.ts    ← upload + resize Sharp → R2
│       │   ├── sanity/          ← client, queries, image builder
│       │   └── schemas/         ← Zod schemas compartilhados
│       ├── hooks/
│       │   ├── useGeolocation.ts
│       │   ├── useOffline.ts
│       │   └── usePushNotifications.ts
│       └── generated/prisma/    ← Prisma Client gerado (não editar)
│
└── ia/                          ← FastAPI + RAG
    ├── Dockerfile
    ├── docker-compose.yml       ← api + pgvector + ollama
    ├── requirements.txt
    ├── pyproject.toml           ← ruff + pytest config
    ├── docs/                    ← base de conhecimento (.txt)
    │   ├── lei-12305-2010-pnrs.txt
    │   ├── decreto-10388-2020.txt
    │   ├── legislacao-anvisa-rss.txt
    │   ├── guia-cidadao-descarte.txt
    │   ├── impacto-ambiental.txt
    │   ├── tipos-residuos-farmaceuticos.txt
    │   └── faq-ecomed.txt
    ├── app/
    │   ├── main.py              ← FastAPI app + lifespan
    │   ├── ingest.py            ← CLI indexação docs no PGVector
    │   ├── routers/
    │   │   ├── chat.py          ← POST /chat (Bearer token auth)
    │   │   ├── embed.py         ← POST /embed (indexação manual)
    │   │   └── health.py        ← GET /health
    │   └── services/
    │       ├── rag.py           ← LangChain RAG chain
    │       └── guardrails.py    ← bloqueio por regex (sem tokens)
    └── tests/
        ├── test_chat.py
        └── test_guardrails.py
```

---

## App — Next.js

### Rotas e Páginas

#### Públicas (sem autenticação)

| Rota               | Tipo    | Descrição                           |
| ------------------ | ------- | ----------------------------------- |
| `/`                | SSG     | Landing page                        |
| `/mapa`            | SSG     | Mapa interativo de pontos de coleta |
| `/mapa/ponto/[id]` | Dynamic | Detalhe de um ponto                 |
| `/blog`            | SSG     | Listagem de artigos (Sanity)        |
| `/blog/[slug]`     | SSG     | Artigo individual                   |
| `/offline`         | SSG     | Fallback offline do Service Worker  |
| `/entrar`          | Dynamic | Login (Google OAuth + e-mail/senha) |
| `/cadastrar`       | Dynamic | Cadastro com e-mail/senha           |
| `/recuperar-senha` | Dynamic | Solicitação de reset de senha       |
| `/redefinir-senha` | Dynamic | Redefinição com token               |

#### Área do Cidadão (`/app/*` — role: CITIZEN+)

| Rota                 | Descrição                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------ |
| `/app`               | Dashboard do cidadão                                                                       |
| `/app/perfil`        | Perfil, EcoCoins e histórico de coins                                                      |
| `/app/favoritos`     | Pontos salvos como favoritos                                                               |
| `/app/notificacoes`  | Notificações do sistema                                                                    |
| `/app/chat`          | Chat com assistente de IA                                                                  |
| `/app/missoes`       | Missões diárias e semanais (EcoCoins)                                                      |
| `/app/recompensas`   | Catálogo de recompensas + resgate                                                          |
| `/app/conquistas`    | Conquistas estilo Apple Fitness — metas acumuladas de descarte, quizzes e pontos distintos |
| `/app/ranking`       | Ranking semanal de EcoCoins (Top 10 + posição do usuário)                                  |
| `/app/quiz/[id]`     | Quiz educativo — alternativas embaralhadas por sessão (Fisher-Yates + HMAC-SHA256)         |
| `/app/seja-parceiro` | Formulário de candidatura como parceiro                                                    |

#### Painel do Parceiro (`/parceiro/*` — role: PARTNER+)

| Rota                     | Descrição                               |
| ------------------------ | --------------------------------------- |
| `/parceiro/dashboard`    | Visão geral (pontos, visitas, reportes) |
| `/parceiro/pontos`       | Gerenciar pontos de coleta              |
| `/parceiro/estatisticas` | Métricas de visitas e favoritos         |

#### Painel Admin (`/admin/*` — role: ADMIN)

| Rota               | Descrição                                   |
| ------------------ | ------------------------------------------- |
| `/admin`           | Dashboard com estatísticas gerais           |
| `/admin/parceiros` | Candidatos em análise + parceiros aprovados |
| `/admin/pontos`    | Aprovar/rejeitar pontos de coleta           |
| `/admin/reportes`  | Reportes abertos de cidadãos                |
| `/admin/usuarios`  | Gerenciar usuários                          |
| `/admin/conteudo`  | Gerenciar artigos e conteúdo                |

#### Sanity Studio

| Rota        | Descrição                             |
| ----------- | ------------------------------------- |
| `/studio/*` | CMS Sanity embutido (acesso restrito) |

---

### API Routes (Hono)

Todas as rotas de API ficam em `src/app/api/[[...route]]/route.ts`, roteadas via **Hono**, e exportadas como handlers HTTP do Next.js.

#### Pontos de Coleta

| Método   | Endpoint               | Auth    | Descrição                                               |
| -------- | ---------------------- | ------- | ------------------------------------------------------- |
| `GET`    | `/api/pontos/proximos` | Não     | Busca geoespacial por lat/lng/raio (ST_DWithin PostGIS) |
| `GET`    | `/api/pontos/:id`      | Não     | Detalhes de um ponto                                    |
| `POST`   | `/api/pontos`          | PARTNER | Criar novo ponto                                        |
| `PUT`    | `/api/pontos/:id`      | PARTNER | Atualizar ponto próprio                                 |
| `DELETE` | `/api/pontos/:id`      | PARTNER | Remover ponto próprio                                   |

#### Chat / IA

| Método | Endpoint    | Auth             | Descrição             |
| ------ | ----------- | ---------------- | --------------------- |
| `POST` | `/api/chat` | Não (rate limit) | Proxy para FastAPI IA |

#### Favoritos

| Método   | Endpoint             | Auth    | Descrição                   |
| -------- | -------------------- | ------- | --------------------------- |
| `GET`    | `/api/favoritos`     | CITIZEN | Listar favoritos do usuário |
| `POST`   | `/api/favoritos`     | CITIZEN | Adicionar favorito          |
| `DELETE` | `/api/favoritos/:id` | CITIZEN | Remover favorito            |

#### Reportes

| Método | Endpoint        | Auth | Descrição                  |
| ------ | --------------- | ---- | -------------------------- |
| `POST` | `/api/reportes` | Opt. | Enviar reporte de problema |

#### Notificações Push

| Método   | Endpoint                | Auth    | Descrição                 |
| -------- | ----------------------- | ------- | ------------------------- |
| `POST`   | `/api/push/subscribe`   | CITIZEN | Salvar subscription VAPID |
| `DELETE` | `/api/push/unsubscribe` | CITIZEN | Remover subscription      |

#### Parceiro

| Método | Endpoint                 | Auth    | Descrição                 |
| ------ | ------------------------ | ------- | ------------------------- |
| `POST` | `/api/parceiro/cadastro` | CITIZEN | Candidatura como parceiro |

#### Gamificação — EcoCoins

| Método | Endpoint                     | Auth    | Descrição                                                                                                                      |
| ------ | ---------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `GET`  | `/api/coins`                 | CITIZEN | Saldo, nível, streak e histórico de transações                                                                                 |
| `POST` | `/api/coins/article-read`    | CITIZEN | Credita ARTICLE_READ (≥120s lido + ≥90% scroll)                                                                                |
| `POST` | `/api/coins/ecobot-question` | CITIZEN | Credita ECOBOT_QUESTION (pergunta ≥10 chars)                                                                                   |
| `POST` | `/api/coins/ecobot-rating`   | CITIZEN | Credita ECOBOT_RATING após avaliação da resposta                                                                               |
| `POST` | `/api/coins/share`           | CITIZEN | Credita SHARE_ARTICLE ou SHARE_BADGE                                                                                           |
| `GET`  | `/api/missions`              | CITIZEN | Lista missões do dia e da semana (auto-gera se não existirem)                                                                  |
| `POST` | `/api/missions/:id/progress` | CITIZEN | Avança progresso; credita bônus ao completar todas as missões                                                                  |
| `GET`  | `/api/rewards`               | CITIZEN | Catálogo com flags `podeResgatar` e `emCooldown`                                                                               |
| `GET`  | `/api/rewards/my`            | CITIZEN | Histórico de resgates do usuário                                                                                               |
| `POST` | `/api/rewards/:id/redeem`    | CITIZEN | Resgata recompensa (valida nível, saldo, estoque e cooldown)                                                                   |
| `POST` | `/api/checkin`               | PARTNER | Registra check-in via QR (+15 GPS / +10 sem GPS) — verifica milestones de descarte                                             |
| `POST` | `/api/quiz/:id/submit`       | CITIZEN | Submete respostas do quiz — limite hard 3/dia (HTTP 429), apenas score perfeito gera QUIZ_PERFECT; verifica milestones de quiz |

#### Admin

| Método | Endpoint                            | Auth  | Descrição                             |
| ------ | ----------------------------------- | ----- | ------------------------------------- |
| `GET`  | `/api/admin/stats`                  | ADMIN | Estatísticas gerais do sistema        |
| `GET`  | `/api/admin/pontos`                 | ADMIN | Listar pontos (filtro por status)     |
| `POST` | `/api/admin/pontos/:id/aprovar`     | ADMIN | Aprovar ponto                         |
| `POST` | `/api/admin/pontos/:id/rejeitar`    | ADMIN | Rejeitar ponto com motivo             |
| `GET`  | `/api/admin/parceiros`              | ADMIN | Candidatos (role=CITIZEN com Partner) |
| `POST` | `/api/admin/parceiros/:id/aprovar`  | ADMIN | Promover para PARTNER                 |
| `POST` | `/api/admin/parceiros/:id/rejeitar` | ADMIN | Rejeitar candidatura                  |
| `GET`  | `/api/admin/reportes`               | ADMIN | Listar reportes abertos               |
| `POST` | `/api/admin/reportes/:id/resolver`  | ADMIN | Marcar reporte como resolvido         |
| `GET`  | `/api/admin/usuarios`               | ADMIN | Listar usuários                       |
| `POST` | `/api/admin/usuarios/:id/desativar` | ADMIN | Desativar usuário                     |

---

### Autenticação e RBAC

**NextAuth v5** configurado em `auth.ts` na raiz do monorepo.

**Provedores:**

- **Google OAuth** — login social
- **Credentials** — e-mail + senha, hash bcrypt

**Estratégia de sessão:** JWT (stateless, compatível com Edge)

**RBAC** via `middleware.ts`:

```
/app/*       → requer autenticação (qualquer role)
/parceiro/*  → requer role PARTNER ou ADMIN
/admin/*     → requer role ADMIN
```

**Helpers de sessão** em `src/lib/auth/session.ts`:

```typescript
await requireSession(); // redireciona para /entrar se não autenticado
await requireAdmin(); // redireciona para /app se não for ADMIN
await requirePartner(); // redireciona para /app se não for PARTNER/ADMIN
```

---

### Banco de Dados (Prisma + PostgreSQL)

**Prisma Client** gerado em `src/generated/prisma/`, importado via singleton em `src/lib/db/prisma.ts`.

**Conexão:**

- **Runtime:** AWS Lightsail Managed PostgreSQL (`DATABASE_URL`, porta 5432)
- **SSL em produção:** `ssl: { rejectUnauthorized: false }` — necessário porque o certificado CA da AWS não está no bundle do Alpine Linux. A criptografia TLS continua ativa.
- **Migrations:** mesma string de conexão, via `prisma migrate deploy`

**Adapter:** `@prisma/adapter-pg` (PrismaPg) — driver nativo para compatibilidade com Cloudflare Workers/Edge (não usado em prod, mas mantido para portabilidade).

**Operações atômicas:** `creditCoins` e `debitCoins` usam `{ increment }` / `{ decrement }` do Prisma para evitar race conditions. Resgates de recompensas são envolvidos em `prisma.$transaction()`.

**Busca geoespacial** via raw SQL com PostGIS:

```sql
SELECT id, name, address, latitude, longitude,
  ROUND(ST_Distance(
    ST_MakePoint($lng, $lat)::geography,
    ST_MakePoint(longitude, latitude)::geography
  )) AS distancia_metros
FROM "Point"
WHERE status = 'APPROVED'
  AND ST_DWithin(
    ST_MakePoint($lng, $lat)::geography,
    ST_MakePoint(longitude, latitude)::geography,
    $raio  -- metros
  )
ORDER BY distancia_metros
LIMIT 30
```

**Migrations:**

```bash
# Desenvolvimento — cria migration e aplica
pnpm db:migrate --name descricao

# Produção (VPS / CI)
pnpm prisma migrate deploy
```

---

### PWA e Service Worker

**Biblioteca:** [Serwist](https://serwist.pages.dev/) v9 — wrapper moderno do Workbox.

**Configurado em** `src/app/sw.ts` e `next.config.ts`:

| Recurso             | Estratégia       | Detalhes                                 |
| ------------------- | ---------------- | ---------------------------------------- |
| Tiles OpenStreetMap | CacheFirst       | `[a-c].tile.openstreetmap.org`           |
| API pontos próximos | NetworkFirst     | timeout 5s, cacheName `api-pontos`       |
| Imagens R2          | CacheFirst       | `*.r2.dev` e `uploads.ecomed.eco.br`     |
| Assets estáticos    | CacheFirst       | `_next/static/*`                         |
| Navegação offline   | navigateFallback | `/offline` (página estática precacheada) |

**Configurações:**

- `skipWaiting: true` — atualiza SW imediatamente
- `clientsClaim: true` — assume controle de todas as abas
- `navigationPreload: false` — evita `no-response` em redes instáveis
- `Cache-Control: no-store` no header do `sw.js` — garante que CDN nunca cacheia o SW
- Analytics externas (`cloudflareinsights.com`, GA4 via `/fslp/`) → `NetworkOnly` com `handlerDidError` silencioso (retorna 204)
- Rotas protegidas `/app/*` → `NetworkOnly` no SW — evita interceptação de redirects de auth (opaqueredirect)

**`x-pathname` no middleware:** `middleware.ts` usa `NextResponse.next({ request: { headers } })` para encaminhar o pathname como request header — necessário para Server Components lerem `headers().get('x-pathname')` e detectarem rotas especiais (ex: `/app/onboarding`).

**Web App Manifest** (`/manifest.webmanifest`):

- `display: "standalone"` — abre sem barra do navegador
- `start_url: "/mapa"` — abre no mapa ao iniciar
- `theme_color: "#16a34a"` — verde EcoMed
- Ícones: 192×192 e 512×512 PNG + maskable

---

### Upload de Imagens (R2)

**`src/lib/storage/r2.ts`** — upload com validação e redimensionamento:

1. Valida MIME type (jpeg, png, webp, gif) e tamanho (máx 5 MB)
2. Redimensiona para 800×600 via **Sharp** (fit: inside, sem ampliação)
3. Converte para WebP (qualidade 85)
4. Envia para bucket `ecomed-uploads` com `CacheControl: public, max-age=31536000`
5. Retorna URL pública via `R2_PUBLIC_URL` (custom domain: `uploads.ecomed.eco.br`)

---

### Notificações Push

**`src/lib/push/index.ts`** — via `web-push` com VAPID:

```typescript
sendPushToUser(userId, { title, body, url? })
// Busca todas as PushSubscription do usuário
// Envia em paralelo com Promise.allSettled
```

Subscriptions salvas na tabela `PushSubscription` (endpoint único por dispositivo).

---

### Rate Limiting

**Upstash Redis** — sliding window via `@upstash/ratelimit`:

| Limiter | Limite  | Janela | Usado em                                           |
| ------- | ------- | ------ | -------------------------------------------------- |
| `auth`  | 10 req  | 1 min  | Login, cadastro, reset senha, candidatura parceiro |
| `chat`  | 20 req  | 1 min  | `/api/chat`                                        |
| `map`   | 100 req | 1 min  | `/api/pontos/proximos`                             |

Identificador: `CF-Connecting-IP` (Cloudflare) → `x-forwarded-for` → `"unknown"`.

---

### Emails

**Resend** com templates **React Email** em `src/lib/email/templates/`:

| Template           | Quando enviado                   |
| ------------------ | -------------------------------- |
| `welcome`          | Após cadastro                    |
| `password-reset`   | Solicitação de reset de senha    |
| `partner-pending`  | Candidatura recebida             |
| `partner-approved` | Parceiro aprovado pelo admin     |
| `partner-rejected` | Candidatura rejeitada com motivo |
| `report-received`  | Reporte de problema recebido     |

```typescript
import { sendEmail } from "@/lib/email";
await sendEmail("partner-approved", email, { partnerName, dashboardUrl });
```

---

### QR Code e Check-in Presencial

**`src/lib/qr/token.ts`** — tokens HMAC-SHA256 para check-ins presenciais em pontos de coleta.

**Funcionamento:**

1. Admin/Parceiro gera um QR Code para um ponto específico via `/admin` ou `/parceiro`
2. Token: `pointId.timestamp.hmac(32 chars)` — assinado com `QR_HMAC_SECRET` (ou `AUTH_SECRET` como fallback)
3. Cidadão escaneia o QR → `POST /api/checkin { token }` → server valida HMAC + janela de 30 min
4. Cria registro `Checkin` e credita EcoCoins (+15 com GPS, +10 sem GPS)
5. Bônus automáticos: `CHECKIN_FIRST_MONTH` (primeiro mês de uso do ponto) e `CHECKIN_NEW_POINT` (primeiro check-in do usuário naquele ponto)

**Segurança do QR:**

- HMAC com 32 caracteres hex (128 bits de entropia) — resistente a força bruta
- Tokens expiram em 30 minutos
- `QR_HMAC_SECRET` obrigatório em produção — app lança erro explícito se não configurado

---

### Painel Admin KPIs

**`src/app/admin/kpis/`** — dashboard de métricas em tempo real (revalidação a cada 5 min).

**Arquitetura Server/Client:**

- `page.tsx` — Server Component que chama `getKpiData()` e injeta dados no client
- `getData.ts` — queries Prisma paralelas (`Promise.all`) sem bloquear renderização
- `kpis-client.tsx` — Client Component com abas, gráficos Recharts e animações

**Métricas disponíveis:**

| Categoria   | Métricas                                                                          |
| ----------- | --------------------------------------------------------------------------------- |
| Usuários    | Total, novos (7d/30d), distribuição por nível, taxa de conversão cidadão→parceiro |
| Engajamento | DAU/WAU, check-ins totais (7d/30d), pontos novos, média de streak, best streak    |
| EcoCoins    | Total emitido, total resgatado, average por usuário, saldo em circulação          |
| Quiz        | Total de tentativas, taxa de acerto (%), média de score                           |
| Sparkline   | Histórico semanal de EcoCoins (últimas 6 semanas)                                 |

---

### Gamificação EcoCoins

Sistema de engajamento gamificado implementado em `src/lib/coins/index.ts`.

**Função principal:**

```typescript
import { creditCoins } from "@/lib/coins";

// Credita coins ao usuário — retorna {ok, newBalance, levelUp?, streakBonus?}
await creditCoins(userId, "CHECKIN", pointId, 15); // 15 coins com GPS
await creditCoins(userId, "ARTICLE_READ", articleSlug);
```

**Regras de negócio:**

- **Teto global:** 120 EcoCoins/dia por usuário (exceto eventos isentos: onboarding, admin, redemption, streaks)
- **Teto por categoria:** ex. `CHECKIN` = 3/dia, `ARTICLE_READ` = 5/dia (via `DailyLimitTracker`)
- **Quiz:** limite hard de 3 tentativas/dia por quiz (HTTP 429); apenas score perfeito (100%) gera evento `QUIZ_PERFECT`; badge de nível concedido ao completar todos os quizzes do nível
- **Embaralhamento de quiz (`src/lib/quiz/shuffle.ts`):** Fisher-Yates gera nova ordem a cada carregamento; token HMAC-SHA256 assinado com `AUTH_SECRET` mapeia índices embaralhados → originais no server (stateless, resistente a adulteração)
- **Milestones de metas (`src/lib/goals/milestones.ts`):** verifica automaticamente após check-in e submit de quiz — concede badges acumulativos para marcos de descarte [1, 5, 10, 25, 50, 100, 365, 500, 1000], pontos distintos [5, 10, 25], quizzes feitos [10, 25, 50] e quizzes perfeitos [10, 25]
- **Operações atômicas:** `{ increment: amount }` / `{ decrement: amount }` — sem race conditions em atualizações concorrentes de saldo
- **Multiplicadores de nível:** `GUARDIAO` × 1.2, `LENDA_ECO` × 1.5
- **Streak:** detecta sequência de dias consecutivos — bônus milestone aos 3, 7 e 30 dias
- **Ranking semanal:** ordenado por `weeklyCoins` (reset toda segunda-feira), não por total histórico
- **Check-in GPS:** +15 coins (com GPS) vs +10 (sem GPS) + bônus `CHECKIN_NEW_POINT` e `CHECKIN_FIRST_MONTH`

**Resgates de recompensas (`/api/rewards/:id/redeem`):**

- Toda operação de resgate é envolvida em `prisma.$transaction()` — verifica saldo, estoque e cooldown atomicamente
- Status do resgate: enum `RewardStatus` (`PENDING` → `DELIVERED` / `CANCELLED`)

**Componentes UI:**

| Componente       | Localização          | Função                                  |
| ---------------- | -------------------- | --------------------------------------- |
| `CoinDisclaimer` | `components/coins/`  | Disclaimer legal (EcoCoins ≠ moeda)     |
| `RedeemButton`   | `components/coins/`  | Botão de resgate com feedback de estado |
| BottomNav        | `components/layout/` | Link "Missões" com ícone Trophy         |

---

## IA — FastAPI + RAG

Microserviço Python em `ia/`, rodando em VPS Oracle na porta 8002.

### Stack da IA

| Componente        | Biblioteca            | Versão     |
| ----------------- | --------------------- | ---------- |
| Framework         | FastAPI               | 0.115.0    |
| Servidor          | Uvicorn               | 0.30.0     |
| LLM               | Ollama (llama3.2)     | via Docker |
| Embeddings        | nomic-embed-text      | via Ollama |
| Orquestração RAG  | LangChain Core        | ≥0.3.0     |
| Banco vetorial    | PGVector (PostgreSQL) | pg16       |
| Driver PostgreSQL | psycopg3              | ≥3.1       |
| Validação         | Pydantic v2           | 2.9.0      |

### Pipeline RAG

```
Pergunta do usuário
       │
       ▼
[Guardrails] ── bloqueada ──► resposta específica por categoria
       │ permitida
       ▼
[Embeddings] nomic-embed-text (768 dim)
       │
       ▼
[PGVector] similarity search → k=4 chunks mais relevantes
       │
       ▼
[PromptTemplate] contexto + pergunta + system prompt
       │
       ▼
[Ollama LLM] llama3.2 · temperature=0.1 · max_tokens=512
       │
       ▼
Resposta em pt-BR
```

**Autenticação:** Bearer token estático (`IA_SERVICE_TOKEN`) — verificado em todo request.

**System Prompt** inclui:

- Escopo explícito (descarte de medicamentos, legislação, localização)
- Lista de proibições (dosagem, diagnóstico, automedicação)
- Resposta padrão para perguntas clínicas
- Instrução de anti-jailbreak

### Guardrails

`ia/app/services/guardrails.py` — verificação por regex **antes** do LLM (zero custo de tokens):

| Categoria          | Exemplos                                 | Resposta                             |
| ------------------ | ---------------------------------------- | ------------------------------------ |
| `EMERGENCIA`       | "ingeri", "meu filho tomou", "overdose"  | Orienta SAMU (192)                   |
| `CLINICA`          | "dose", "diagnóstico", "sintomas de"     | Redireciona para médico/farmacêutico |
| `AUTOMEDICACAO`    | "qual remédio", "posso tomar", "bula do" | Orienta buscar profissional          |
| `DADOS_PESSOAIS`   | "meu CPF", "meu endereço"                | Nega processamento                   |
| `PROMPT_INJECTION` | "ignore instructions", "novo papel"      | Resposta de escopo                   |
| `FORA_ESCOPO`      | Qualquer tema não relacionado            | Redireciona ao EcoMed                |

### Base de Conhecimento

Documentos em `ia/docs/` indexados no PGVector, collection `ecomed_docs`:

| Arquivo                            | Conteúdo                                                  |
| ---------------------------------- | --------------------------------------------------------- |
| `lei-12305-2010-pnrs.txt`          | Lei da Política Nacional de Resíduos Sólidos              |
| `decreto-10388-2020.txt`           | Decreto que regulamenta logística reversa de medicamentos |
| `legislacao-anvisa-rss.txt`        | RDC 222/2018 ANVISA — resíduos de serviços de saúde       |
| `guia-cidadao-descarte.txt`        | Guia prático para o cidadão sobre descarte                |
| `impacto-ambiental.txt`            | Dados sobre contaminação por medicamentos                 |
| `tipos-residuos-farmaceuticos.txt` | Categorias e exemplos de resíduos                         |
| `faq-ecomed.txt`                   | Perguntas frequentes da plataforma                        |

### Indexação de Documentos

```bash
# Na pasta ia/
python -m app.ingest          # indexa documentos novos
python -m app.ingest --reset  # apaga collection e re-indexa tudo
```

**Chunking:** `RecursiveCharacterTextSplitter` — chunk_size=1000, overlap=200.

---

## Schema do Banco

### Entidades Principais

```
User ──< Account          (OAuth accounts)
User ──< Session          (JWT sessions)
User ──< Favorite ──> Point
User ──< Report ──> Point
User ──< PushSubscription
User ──< Notification
User ──< Checkin ──> Point       (descarte com QR)
User ──1 Partner ──< Point
                    Point ──< Schedule   (horários por dia da semana)
                    Point ──< Report
                    Point ──< PointView  (analytics de visitas)
                    Point ──< Favorite

# Gamificação EcoCoins
User ──1 Wallet ──< CoinTransaction
User ──< UserBadge ──> Badge
User ──< UserMission ──> Mission
User ──< UserReward ──> RewardCatalog
User ──< DailyLimitTracker    (teto diário por categoria de evento)
```

### Modelos

| Model                | Campos principais                                                                    | Relações                                                                    |
| -------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| `User`               | id, name, email, passwordHash, role, active                                          | Account, Session, Partner, Favorite, Report, PushSubscription, Notification |
| `Partner`            | id, userId, cnpj, companyName, tradeName, phone                                      | User (1:1), Point (1:N)                                                     |
| `Point`              | id, partnerId, name, address, city, state, zipCode, lat, lng, status, residueTypes[] | Partner, Favorite, Report, Schedule, PointView                              |
| `Schedule`           | id, pointId, dayOfWeek (0-6), opens, closes, closed                                  | Point                                                                       |
| `Favorite`           | id, userId, pointId                                                                  | User, Point (unique constraint)                                             |
| `Report`             | id, userId?, pointId, type, description, resolved                                    | User, Point                                                                 |
| `PushSubscription`   | id, userId, endpoint (unique), p256dh, auth                                          | User                                                                        |
| `Notification`       | id, userId, title, body, read                                                        | User                                                                        |
| `Article`            | id, slug (unique), title, content, published, publishedAt                            | —                                                                           |
| `PointView`          | id, pointId, viewedAt                                                                | Point                                                                       |
| `PasswordResetToken` | id, token (unique), userId, expiresAt, used                                          | —                                                                           |

### Modelos de Gamificação

| Model               | Campos principais                                                           | Descrição                                       |
| ------------------- | --------------------------------------------------------------------------- | ----------------------------------------------- |
| `Wallet`            | userId, balance, totalEarned, level, streakCurrent, streakBest, weeklyCoins | Carteira de EcoCoins por usuário                |
| `CoinTransaction`   | walletId, amount (+/-), event (CoinEvent), note, reference                  | Histórico de créditos e débitos                 |
| `Badge`             | slug, name, description, coinReward                                         | Conquistas / troféus                            |
| `UserBadge`         | userId, badgeId, earnedAt                                                   | Conquistas do usuário (idempotente por slug)    |
| `Mission`           | slug, title, type (DAILY/WEEKLY), event, targetCount, coinReward            | Definição de missão                             |
| `UserMission`       | userId, missionId, date, progress, completed, completedAt                   | Progresso do usuário na missão no dia/semana    |
| `Checkin`           | userId, pointId, coinsEarned, hasGps                                        | Registro de descarte via QR Code                |
| `DailyLimitTracker` | userId, date, category, count, coins `@@unique([userId, date, category])`   | Controle de teto diário por categoria de evento |
| `RewardCatalog`     | slug, name, tier, cost, minLevel, stock?, cooldownDays, active              | Catálogo de recompensas resgatáveis             |
| `UserReward`        | userId, rewardId, status (RewardStatus)                                     | Histórico de resgates do usuário                |

### Níveis (Level)

| Nível       | Total Ganho | Bônus              |
| ----------- | ----------- | ------------------ |
| `SEMENTE`   | 0–100 coins | —                  |
| `BROTO`     | 101–500     | Missões semanais   |
| `ARVORE`    | 501–2.000   | —                  |
| `GUARDIAO`  | 2.001–5.000 | ×1.2 multiplicador |
| `LENDA_ECO` | 5.001+      | ×1.5 multiplicador |

**Teto diário global:** 120 EcoCoins/dia (exceto onboarding, admin, redemption e bônus de streak).

### Enums

```sql
Role:         CITIZEN | PARTNER | ADMIN
PointStatus:  PENDING | APPROVED | REJECTED
ReportType:   CLOSED | WRONG_ADDRESS | NOT_ACCEPTING | OTHER
MissionType:  DAILY | WEEKLY
RewardStatus: PENDING | DELIVERED | CANCELLED   -- enum nativo PostgreSQL
CoinEvent:    SIGNUP | ONBOARDING_PROFILE | ONBOARDING_SCREENS | ONBOARDING_GEO
              ONBOARDING_PUSH | CHECKIN | CHECKIN_FIRST_MONTH | CHECKIN_NEW_POINT
              ARTICLE_READ | QUIZ | QUIZ_PERFECT | ECOBOT_QUESTION | ECOBOT_RATING
              REFERRAL | SHARE_ARTICLE | SHARE_BADGE | STREAK_3_DAYS | STREAK_7_DAYS
              STREAK_30_DAYS | DAILY_STREAK | MISSION_COMPLETE | MISSION_DAILY_BONUS
              MISSION_WEEKLY_BONUS | REPORT_SUBMITTED | BADGE_EARNED
              ADMIN_GRANT | ADJUSTMENT | REDEMPTION
```

---

## Variáveis de Ambiente

Copie `app/.env.example` para `app/.env.local` e preencha todos os valores marcados como obrigatórios.

### `app/.env.local` / `app/.env.production`

```env
# ── Banco de Dados (AWS Lightsail Managed PostgreSQL) ─────────────────────────
DATABASE_URL=postgresql://usuario:senha@ls-xxx.rds.amazonaws.com:5432/ecomed
# DIRECT_URL é alias de DATABASE_URL (não há pooler separado no Lightsail)

# ── Autenticação (NextAuth v5) ─────────────────────────────────────────────────
# OBRIGATÓRIO: usar prefixo AUTH_* (não NEXTAUTH_*)
AUTH_URL=https://ecomed.eco.br        # localhost:3000 em dev
AUTH_SECRET=...                       # openssl rand -base64 32
AUTH_TRUST_HOST=true                  # obrigatório em produção atrás de proxy

# ── Google OAuth ────────────────────────────────────────────────────────────────
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
# Redirect URI no Google Console: https://ecomed.eco.br/api/auth/callback/google

# ── QR Code / Check-in ─────────────────────────────────────────────────────────
QR_HMAC_SECRET=...  # OBRIGATÓRIO — app lança erro se não configurado
                    # gerar: openssl rand -base64 32

# ── Cloudflare R2 (storage de imagens) ─────────────────────────────────────────
CLOUDFLARE_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=ecomed-uploads
R2_PUBLIC_URL=https://uploads.ecomed.eco.br

# ── Upstash Redis (rate limiting) ──────────────────────────────────────────────
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...

# ── Resend (emails transacionais) ──────────────────────────────────────────────
RESEND_API_KEY=re_...
EMAIL_FROM=EcoMed <noreply@ecomed.eco.br>

# ── Web Push VAPID ─────────────────────────────────────────────────────────────
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...      # exposto ao browser (prefixo NEXT_PUBLIC_)
VAPID_PRIVATE_KEY=...                 # somente servidor
VAPID_SUBJECT=mailto:noreply@ecomed.eco.br

# ── Microserviço de IA ─────────────────────────────────────────────────────────
IA_BASE_URL=http://45.151.122.234:8002
IA_API_KEY=...         # mesmo valor que IA_SERVICE_TOKEN no ia/.env

# ── Sanity CMS (Blog) ──────────────────────────────────────────────────────────
NEXT_PUBLIC_SANITY_PROJECT_ID=...
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=...

# ── CRON Jobs ──────────────────────────────────────────────────────────────────
CRON_SECRET=...        # token para autenticar chamadas cron internas
```

### `ia/.env`

```env
DATABASE_URL=postgresql://ecomed:senha@ecomed-pgvector:5432/ecomed_vectors
OLLAMA_BASE_URL=http://ecomed-ollama:11434
OLLAMA_MODEL=llama3.2:latest
IA_SERVICE_TOKEN=...              # deve coincidir com IA_API_KEY no app
PGVECTOR_PASSWORD=...
```

VAPID_PRIVATE_KEY=... # privado, só no servidor

# Microserviço de IA

IA_SERVICE_URL=http://45.151.122.234:8002
IA_SERVICE_TOKEN=...

# Sanity CMS

NEXT_PUBLIC_SANITY_PROJECT_ID=...
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=...

# Sentry

NEXT_PUBLIC_SENTRY_DSN=...

````

### `ia/.env`

```env
DATABASE_URL=postgresql://ecomed:senha@ecomed-pgvector:5432/ecomed_vectors
OLLAMA_BASE_URL=http://ecomed-ollama:11434
OLLAMA_MODEL=llama3.2:latest
IA_SERVICE_TOKEN=...              # deve coincidir com o app
PGVECTOR_PASSWORD=...
````

---

## Desenvolvimento Local

### Pré-requisitos

- Node.js 20+
- pnpm 9+
- Docker Desktop
- Python 3.12+

### Setup do App (Next.js)

```bash
# 1. Clonar
git clone https://github.com/ivonsmatos/ecomed
cd ecomed/app

# 2. Instalar dependências
pnpm install

# 3. Copiar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com as credenciais

# 4. Gerar Prisma Client
pnpm db:generate

# 5. Rodar migrations
pnpm db:migrate

# 6. Seed inicial (opcional)
pnpm db:seed

# 7. Iniciar em dev (Turbopack)
pnpm dev
```

Acesso: http://localhost:3000

### Setup da IA (FastAPI)

```bash
cd ecomed/ia

# 1. Criar ambiente virtual
python -m venv .venv
source .venv/bin/activate   # Linux/Mac
# .venv\Scripts\activate    # Windows

# 2. Instalar dependências
pip install -r requirements.txt

# 3. Copiar variáveis de ambiente
cp .env.example .env
# Editar .env

# 4. Subir PGVector + Ollama via Docker
docker compose up -d pgvector ollama

# 5. Baixar modelos (aguardar ~alguns minutos)
docker exec ecomed-ollama ollama pull llama3.2
docker exec ecomed-ollama ollama pull nomic-embed-text

# 6. Indexar documentos da base de conhecimento
python -m app.ingest

# 7. Iniciar API
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Acesso: http://localhost:8000/docs

### Comandos Úteis

```bash
# App
pnpm dev             # dev server (Turbopack)
pnpm build           # build produção
pnpm lint            # ESLint
pnpm test            # Vitest
pnpm test:e2e        # Playwright
pnpm db:studio       # Prisma Studio
pnpm db:migrate      # criar migration

# IA
pytest               # testes unitários
python -m app.ingest --reset   # re-indexar documentos
```

---

## Deploy em Produção

### App Next.js — VPS Docker

O app roda como container Docker na porta 3010. O Nginx/Cloudflare faz o proxy reverso.

**Processo de deploy manual:**

```bash
# 1. Enviar arquivos modificados para o VPS (via pscp ou git)
# Método 1 — git archive + pscp (repo privado sem credenciais no VPS):
git archive --format=tar.gz HEAD -- <arquivos> > /tmp/deploy.tar.gz
pscp -pw SENHA /tmp/deploy.tar.gz root@45.151.122.234:/tmp/
ssh root@45.151.122.234 "tar -xzf /tmp/deploy.tar.gz -C /opt/ecomed-app"

# 2. Aplicar migrations (se houver mudanças no schema)
# Em container temporário com DATABASE_URL do .env
docker run --rm -e DATABASE_URL="$(grep '^DATABASE_URL=' .env | cut -d= -f2-)" \
  -v /opt/ecomed-app:/app -w /app -e CI=true \
  node:20-alpine sh -c "pnpm install --frozen-lockfile --ignore-scripts && pnpm exec prisma migrate deploy"

# 3. Rebuild da imagem
docker build -t ecomed-app .

# 4. Restart do container
docker stop ecomed-web && docker rm ecomed-web
docker run -d --name ecomed-web --restart unless-stopped \
  -p 3010:3010 --env-file /opt/ecomed-app/.env ecomed-app
```

> **Nota `--webpack`:** o build usa `next build --webpack` (não Turbopack) porque o `@serwist/next` (PWA) depende de internals do webpack e ainda não suporta Turbopack. Remover a flag só será possível após migrar para `@serwist/turbopack`.

### IA — VPS Docker

```bash
# No VPS
cd /opt/ecomed/ia
git pull origin master
docker compose build api
docker compose up -d
```

### Verificar status

```bash
# App
curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:3010/

# IA
curl -s http://localhost:8002/health/

# Containers
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

---

## CI/CD

**GitHub Actions** (`.github/workflows/ci.yml`) — dispara em push/PR para `main`.

**Jobs:**

| Job             | Steps                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------ |
| `app` (Next.js) | checkout → pnpm setup → Node 22 → install → `db:generate` → lint → typecheck (`tsc --noEmit`) → test → build |
| `ia` (FastAPI)  | checkout → Python 3.12 → pip install ruff pytest → `ruff check` → `pytest test_guardrails.py`                |

**Secrets necessários no GitHub** (Settings → Secrets):

`DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `QR_HMAC_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `RESEND_API_KEY`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_TOKEN`, `IA_BASE_URL`, `IA_API_KEY`

---

## Segurança

- **Autenticação:** JWT via NextAuth v5, sem sessões no banco para maior performance
- **RBAC:** middleware Next.js + helpers `requireAdmin()` / `requirePartner()` em cada Server Component e rota
- **Rate Limiting:** Upstash sliding window em todas as rotas públicas
- **Uploads:** validação de MIME type + tamanho (5 MB), conversão forçada para WebP via Sharp
- **SQL Injection:** queries raw usam `prisma.$queryRaw` com template literals parametrizados
- **Atomic operations:** `creditCoins`/`debitCoins` usam `{ increment }`/`{ decrement }` Prisma; resgates em `$transaction()`
- **Passwords:** bcrypt com salt automático (bcryptjs)
- **Validação de inputs:** Zod em todas as rotas de API (auth, parceiro, rewards, check-in) — `safeParse` com mensagens de erro estruturadas
- **CNPJ:** validação Módulo 11 (dígitos verificadores) no schema Zod do parceiro — rejeita sequências inválidas e CNPJs fictícios
- **QR Code:** HMAC-SHA256 com 32 chars hex (128 bits) + expiração em 30 min + secret obrigatório (`QR_HMAC_SECRET`)
- **CORS:** FastAPI restringe origins a `ecomed.eco.br` e `localhost:3000`
- **IA Token:** Bearer token estático entre Next.js e FastAPI — nunca exposto ao cliente
- **CSP:** Content Security Policy aplicada pelo middleware — restritiva para todas as rotas, permissiva apenas para `/studio`
- **robots.txt:** bloqueia `/app/`, `/parceiro/`, `/admin/`, `/api/` do rastreamento
- **Guardrails:** bloqueio por regex antes do LLM — sem vazamento de dados sensíveis, bloqueia prompt injection
- **Cloudflare WAF:** na frente de toda requisição — DDoS protection, bot management

---

## Convenções

### Commits (Conventional Commits)

```
feat: nova funcionalidade
fix: correção de bug
docs: documentação
chore: manutenção (deps, config)
refactor: refatoração sem mudança de comportamento
test: testes
```

### Nomenclatura

- **Arquivos de componentes:** PascalCase (`PointCard.tsx`)
- **Arquivos de utilitários:** camelCase (`prisma.ts`, `r2.ts`)
- **Rotas de API:** kebab-case (`/api/pontos/proximos`)
- **Variáveis de ambiente:** SCREAMING_SNAKE_CASE
- **Branches:** `feat/nome-da-feature`, `fix/nome-do-bug`

### Padrões de Código

- Toda rota de API nova: **rate limit + validação Zod + verificação de sessão**
- Componentes server-first: preferir RSC, usar `"use client"` só quando necessário
- Schemas Zod **compartilhados** entre front e back (`src/lib/schemas/`)
- Nunca instanciar Prisma fora do singleton em `src/lib/db/prisma.ts`
- `export const dynamic = "force-dynamic"` em toda página que usa `auth()` ou Prisma com dados de usuário

---

## Licença

Projeto proprietário — todos os direitos reservados.
