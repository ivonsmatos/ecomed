<div align="center">

# 🌿 EcoMed

**Descarte certo, planeta saudável**

PWA educativo com mapa inteligente, IA e gamificação para o descarte correto de medicamentos no Brasil.

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org)
[![Groq](https://img.shields.io/badge/IA-Groq%20%2B%20Llama%204-1A736A.svg)](https://groq.com)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Acessar o EcoMed](https://ecomed.eco.br) · [Reportar Bug](https://github.com/ivonsmatos/ecomed/issues/new) · [Sugerir Feature](https://github.com/ivonsmatos/ecomed/issues/new)

</div>

---

## 📋 Sobre o Projeto

**91% dos brasileiros** descartam medicamentos de forma incorreta. **30 mil toneladas/ano** vão para o lixo comum ou esgoto. **1 comprimido** pode contaminar até **450 mil litros de água**. Existem **58 mil+ pontos de coleta** em farmácias credenciadas no sistema de logística reversa, mas quase ninguém sabe que eles existem.

O EcoMed resolve isso com três pilares:

| Funcionalidade | Descrição |
|---|---|
| 🗺️ **Mapa Inteligente** | 58 mil+ pontos (farmácias LogMed + UBS DATASUS). Busca por cidade ou CEP, filtro por tipo de resíduo (medicamentos / agulhas e seringas), rotas e selo de validação comunitária. |
| 🤖 **EcoBot (Chat com IA)** | Tire dúvidas sobre descarte 24h. RAG com base de conhecimento local (310 Q&As), guardrails de 5 camadas e LLM via Groq. |
| 🪙 **EcoCoins (Gamificação)** | Ganhe EcoCoins por cada ação sustentável. Suba de nível, complete missões e troque por recompensas. |

> Plataforma open source para descarte correto de medicamentos no Brasil.

---

## 🚀 Funcionalidades

- ✅ **PWA** — instala direto do navegador, sem loja de aplicativos
- ✅ **Offline-first** — service worker com serwist, cache estratégico
- ✅ **Mapa de pontos de coleta** — 58.000+ pontos (LogMed + DATASUS) com OpenStreetMap + Leaflet
- ✅ **Busca por cidade ou CEP** — autocomplete de municípios + resolução de CEP via ViaCEP (server-side)
- ✅ **Filtro por tipo de resíduo** — medicamentos vs. agulhas/seringas (farmácia vs. UBS)
- ✅ **Selo de validação comunitária** — "descarte confirmado há X dias" + alerta de reportes em aberto
- ✅ **Chat com IA educativa** — Groq (Llama 4 Scout) + RAG local, guardrails de 5 camadas
- ✅ **Sistema de EcoCoins** — ledger imutável, 5 níveis (🌱→⭐), missões diárias, streaks, anti-fraude
- ✅ **Blog educativo** — CMS Sanity, busca de conteúdo, paginação, posts relacionados, prev/next com preview de imagem
- ✅ **Quizzes educativos** — perguntas com score server-side e EcoCoins
- ✅ **Indicações** — código pessoal ECOMED-XXXXX, +20 EcoCoins por amigo
- ✅ **Ranking semanal** — top usuários por EcoCoins ganhos na semana
- ✅ **Certificado Eco-Cidadão** — PDF gerado no servidor com QR Code de verificação
- ✅ **Dashboard de impacto pessoal** — litros protegidos, descartes, pessoas educadas
- ✅ **Página pública de impacto** (`/impacto`) — números reais da plataforma + cobertura nacional por município
- ✅ **API pública para parceiros** (`/api/public/v1`) — pontos de coleta via REST com X-API-Key ([docs](https://ecomed.eco.br/desenvolvedores))
- ✅ **Widget embeddable** (`/embed/mapa`) — mapa via iframe para sites de terceiros, sem chave
- ✅ **SEO programático** — páginas `/descarte/[cidade]-[uf]` para municípios com pontos de coleta
- ✅ **Check-in por QR Code da loja** (`/checkin?p=`) — cidadão escaneia o QR no balcão, confirma com GPS e ganha EcoCoins na hora
- ✅ **Relatório de Impacto ESG por parceiro** (`/parceiro/impacto`) — descartes, litros protegidos e CO₂ evitado por loja, com QR gerado no painel (`/parceiro/qrcode`)
- ✅ **Publicidade de parceiros** (`/admin/ads`, `/parceiro/publicidade`) — banners segmentados por cidade, UF ou raio hiperlocal ao redor da loja, com selo de transparência e métricas de impressões/cliques/CTR
- ✅ **Notificações push (Web Push)** — engajamento e reativação
- ✅ **Acessibilidade** — VLibras (tradução para Libras), skip-links, componentes acessíveis
- ✅ **GEO / AI Discoverability** — schema.org completo, ai.txt, llms.txt, sitemap LLM

---

## 🛠️ Stack Tecnológica

### Frontend / Backend (monolito Next.js)

| Camada | Tecnologia | Versão | Uso |
|---|---|---|---|
| **Framework** | Next.js (App Router) | 16.2.2 | SSR, SSG, API Routes, PWA |
| **Linguagem** | TypeScript | 5.x | Type safety completo |
| **Estilização** | Tailwind CSS + shadcn/ui | 4.x | Design system, componentes acessíveis |
| **Roteamento API** | Hono | 4.x | Micro-routers compostos em `/api/[[...route]]` |
| **Autenticação** | Auth.js (NextAuth v5) | 5.x | Google OAuth + credentials |
| **ORM** | Prisma | 7.x | Queries tipadas, migrações, seed |
| **Banco de Dados** | PostgreSQL gerenciado | — | Dados principais; pgvector em container dedicado para o RAG |
| **Cache / Rate Limit** | Upstash Redis | — | Rate limiting, sessões |
| **CMS** | Sanity | v3 | Blog, artigos educativos |
| **Monitoramento** | Sentry | 10.x | Error tracking + performance |
| **Analytics** | Google Analytics + Plausible | — | Métricas de uso |
| **Service Worker** | serwist | — | PWA offline, cache de assets |
| **PDF** | @react-pdf/renderer | — | Certificados gerados no servidor |
| **Push** | Web Push API | — | Notificações browser |

### Microserviço de IA (`ia/`)

| Camada | Tecnologia | Uso |
|---|---|---|
| **API** | FastAPI + uvicorn | Endpoint `/chat`, autenticação por token Bearer |
| **LLM** | Groq — `meta-llama/llama-4-scout-17b-16e-instruct` | Inferência ultrarrápida (<2s) via API |
| **Embeddings** | FastEmbed — `paraphrase-multilingual-MiniLM-L12-v2` | Geração local, sem API externa, multilingual |
| **Vector Store** | PGVector (langchain-postgres) | Busca semântica nos documentos de treinamento |
| **Orquestração RAG** | LangChain | Chunking, indexação e pipeline de recuperação |
| **Container** | Docker (python:3.12-slim) | Modelo FastEmbed pré-baixado na imagem |

### Infraestrutura de Produção

| Serviço | Uso |
|---|---|
| **VPS (Linux)** | Hospeda todos os containers Docker |
| **Cloudflare** | DNS, SSL/TLS, WAF, CDN, cache |
| **Docker Network** `ia_default` | Comunicação interna entre web ↔ IA ↔ DB |
| **Nginx / Reverse Proxy** | Roteamento de portas externas |

**Custo operacional estimado: ~R$ 40–80/mês** (VPS + free tiers de serviços cloud).

---

## 🧠 Arquitetura de IA — EcoBot

O EcoBot é um assistente educativo que responde **exclusivamente** sobre descarte correto de medicamentos no Brasil. Ele **nunca** indica ou recomenda medicamentos.

```
Pergunta do usuário
       │
       ▼
┌─────────────────────────────────────────────┐
│  Guardrail de Entrada (5 camadas)           │
│  1. Emergência → redireciona p/ SAMU/CIT    │
│  2. Prompt Injection → bloqueia             │
│  3. Clínica (dosagem, diagnóstico) → bloqueia│
│  4. Automedicação (indicação) → bloqueia    │
│  5. Dados pessoais → bloqueia               │
└──────────────────────┬──────────────────────┘
                       │ pergunta permitida
                       ▼
┌──────────────────────────────────────────────┐
│  RAG — Recuperação de Contexto               │
│  FastEmbed (local) → embedding da pergunta   │
│  PGVector → similarity_search (k=4)          │
│  → chunks mais relevantes da base de conhecimento │
└──────────────────────┬───────────────────────┘
                       │ contexto + histórico de sessão
                       ▼
┌──────────────────────────────────────────────┐
│  LLM — Groq / Llama 4 Scout 17B             │
│  system prompt + contexto + histórico + pergunta │
│  max_tokens=512, temperature=0.2             │
└──────────────────────┬───────────────────────┘
                       │ resposta bruta
                       ▼
┌──────────────────────────────────────────────┐
│  Filtro de Saída                             │
│  - Conselho médico explícito → fallback      │
│  - Dosagem detectada → adiciona disclaimer   │
│  - Nome de medicamento + linguagem de uso    │
│    (tome X, use X) → fallback               │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
                  Resposta final
```

**Base de conhecimento:** documentos `.txt` em `ia/docs/` indexados via `python -m app.ingest --reset`.  
**Memória de sessão:** últimas 8 trocas (16 mensagens) por `session_id`, em memória.

---

## 📁 Estrutura do Projeto

```
ecomed/
├── src/
│   └── app/                        # Next.js App Router
│       ├── (app)/                  # Rotas autenticadas
│       │   ├── chat/               # Interface do EcoBot
│       │   ├── missoes/            # Missões diárias
│       │   ├── conquistas/         # Badges e conquistas
│       │   ├── impacto/            # Dashboard de impacto
│       │   ├── ranking/            # Ranking semanal
│       │   ├── recompensas/        # Catálogo de resgates
│       │   ├── quiz/               # Quizzes educativos
│       │   ├── perfil/             # Perfil + EcoCoins
│       │   ├── favoritos/          # Pontos favoritos
│       │   └── notificacoes/       # Push notifications
│       ├── (public)/               # Rotas públicas
│       │   ├── blog/               # Listagem e artigos do blog
│       │   ├── mapa/               # Mapa + detalhe de ponto
│       │   ├── sobre/, parceiros/  # Páginas institucionais
│       │   └── ...
│       ├── admin/                  # Painel administrativo
│       │   └── ads/                # Gestão de campanhas de publicidade
│       ├── parceiro/               # Dashboard de parceiros
│       │   ├── qrcode/             # Gerador de QR Code por loja
│       │   ├── impacto/            # Relatório ESG (descartes, litros, CO₂)
│       │   └── publicidade/        # Métricas das campanhas do parceiro
│       ├── checkin/                # Check-in do cidadão via QR da loja
│       ├── impacto/                # Página pública de impacto + cobertura
│       ├── desenvolvedores/        # Docs da API pública + widget
│       ├── descarte/[slug]/        # SEO programático por cidade
│       ├── embed/mapa/             # Widget iframe para terceiros
│       ├── api/[[...route]]/       # API routes (Hono)
│       │   └── routes/
│       │       ├── chat.ts         # Proxy para o microserviço IA
│       │       ├── pontos.ts       # Pontos de coleta (+ filtro ?tipo=)
│       │       ├── geo.ts          # Busca por cidade (autocomplete) e CEP
│       │       ├── public.ts       # API pública v1 (X-API-Key + CORS por origin)
│       │       ├── checkin.ts      # Check-in por QR (parceiro e cidadão)
│       │       ├── ads.ts          # Serving/impressão/clique de publicidade
│       │       ├── coins.ts        # Crédito de EcoCoins
│       │       ├── quiz.ts         # Score de quizzes
│       │       ├── user.ts         # Perfil e dados do usuário
│       │       └── ...
│       ├── api/cron/               # Crons HTTP (Bearer CRON_SECRET)
│       │   ├── reset-missoes/      # 03:00 UTC
│       │   ├── ensure-missoes/     # 03:15 UTC
│       │   └── aggregate-views/    # 03:45 UTC — agrega PointView em PointViewDaily
│       ├── layout.tsx              # Layout global + JSON-LD schemas
│       ├── manifest.ts             # PWA manifest
│       ├── sitemap.xml/            # Sitemap dinâmico
│       └── robots.txt/             # Robots + referência ao llms.txt
│
├── src/components/                 # Componentes React
│   ├── layout/                     # Header, Footer
│   ├── blog/                       # ArticleCard, FaqAccordion, ArticleReadTracker, BlogSearch
│   ├── ads/                        # AdSlot — banner com selo de transparência
│   ├── shared/                     # CookieBanner, etc.
│   └── ui/                         # shadcn/ui components
│
├── src/lib/                        # Lógica de negócio
│   ├── coins/                      # creditCoins, missions, limits, streak
│   ├── ads/                        # Serving de campanhas (segmentação geo/raio)
│   ├── geo/                        # haversine, autocomplete de cidades
│   ├── sanity/                     # Client, queries GROQ, urlFor
│   ├── db/                         # Prisma client
│   ├── ratelimit.ts                # Upstash Redis rate limiting
│   └── ...
│
├── ia/                             # Microserviço de IA (Python / FastAPI)
│   ├── app/
│   │   ├── main.py                 # App FastAPI + lifespan (RAGService)
│   │   ├── ingest.py               # CLI de indexação da base de conhecimento
│   │   ├── routers/
│   │   │   ├── chat.py             # POST /chat (Bearer token auth)
│   │   │   ├── embed.py            # POST /embed (debug)
│   │   │   └── health.py           # GET /health
│   │   └── services/
│   │       ├── rag.py              # RAGService: embeddings + PGVector + Groq
│   │       └── guardrails.py       # Filtros de entrada e saída
│   ├── docs/                       # Base de conhecimento (.txt)
│   │   └── treinamento_ecobot.txt  # Q&A sobre descarte de medicamentos
│   ├── Dockerfile                  # Python 3.12-slim + FastEmbed pré-baixado
│   ├── requirements.txt            # Dependências Python
│   └── .env.example                # Variáveis necessárias (sem valores)
│
├── prisma/
│   ├── schema.prisma               # Modelos: User, Point, Partner, CoinTransaction, Quiz, AdCampaign...
│   ├── migrations/                 # Histórico de migrações SQL
│   └── seed.ts                     # Seed: pontos de coleta + quizzes
│
├── public/
│   ├── icons/
│   │   ├── icon-192.png            # PWA icon (any)
│   │   ├── icon-512.png            # PWA icon (any)
│   │   └── icon-512-maskable.png   # PWA icon (maskable, safe zone)
│   ├── apple-touch-icon.png        # iOS home screen (180x180)
│   └── favicon.svg                 # Favicon vetorial
│
├── scripts/
│   ├── deploy.sh                   # Deploy completo (git pull → build → migrate → restart)
│   ├── geocode_cep_logmed.py       # Refina coordenadas LogMed por CEP (resumível, --apply)
│   └── generate-icons.mjs          # Gera PNGs de ícones PWA a partir do favicon.svg
│
├── ops/maintenance/                # Scripts instalados como cron no servidor
│   ├── healthcheck.sh              # */2 min — vigia o container web
│   ├── cron-missoes.sh             # Dispara crons HTTP (reset|ensure|views)
│   └── backup-db.sh                # 02:30 UTC — pg_dump diário, retenção 14 dias
│
├── docs/                           # Documentação estratégica e de negócio
├── Dockerfile                      # Build do ecomed-web (Next.js)
├── .env.example                    # Variáveis necessárias (sem valores)
├── AGENTS.md / CLAUDE.md           # Instruções para agentes de IA
└── README.md                       # Este arquivo
```

---

## ⚡ Início Rápido (Desenvolvimento)

### Pré-requisitos

- [Node.js](https://nodejs.org) 20+
- [pnpm](https://pnpm.io) 9+
- [Docker](https://docker.com) (para o microserviço de IA)
- Uma conta [Groq](https://console.groq.com) (gratuita, para o LLM)
- Uma conta [Sanity](https://sanity.io) (gratuita, para o blog)
- Um banco PostgreSQL (para o RAG, uma instância com extensão `pgvector` — pode ser um container local)

### 1. Clone e instale

```bash
git clone https://github.com/ivonsmatos/ecomed.git
cd ecomed
pnpm install
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Preencha `.env` com suas credenciais:

```env
# Banco de dados
DATABASE_URL=postgresql://user:senha@host:5432/ecomed

# Auth.js
AUTH_SECRET=<string aleatória, mínimo 32 chars>
AUTH_URL=http://localhost:3010

# Google OAuth (opcional, para login social)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Sanity (blog)
NEXT_PUBLIC_SANITY_PROJECT_ID=...
NEXT_PUBLIC_SANITY_DATASET=production

# Upstash Redis (rate limiting)
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# Microserviço de IA
IA_SERVICE_URL=http://localhost:8002
IA_SERVICE_TOKEN=<token secreto compartilhado>
```

### 3. Banco de dados

```bash
# Criar tabelas
pnpm db:push

# Seed inicial (pontos de coleta + quizzes)
pnpm db:seed
```

### 4. Microserviço de IA

```bash
cd ia

# Copiar variáveis
cp .env.example .env
# Editar ia/.env com GROQ_API_KEY, DATABASE_URL, IA_SERVICE_TOKEN

# Build e start
docker build -t ia-api .
docker run -d --name ecomed-ia -p 8002:8000 --env-file .env ia-api

# Indexar base de conhecimento (necessário na primeira vez e ao atualizar docs/)
docker stop ecomed-ia
docker run --rm --env-file .env ia-api python -m app.ingest --reset
docker start ecomed-ia
```

> **Importante:** o ingest deve rodar **com o servidor parado** para evitar conflito de recursos do modelo de embeddings.

### 5. Inicie o servidor de desenvolvimento

```bash
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000) 🎉

---

## 📦 Deploy em Produção

O deploy é feito via Docker em uma VPS Linux. Todos os containers compartilham a rede `ia_default`.

### Containers em produção

| Container | Imagem | Porta interna | Função |
|---|---|---|---|
| `ecomed-web` | `ecomed-web:latest` | 3010 | Next.js (build multi-stage) |
| `ecomed-ia` | `ia-api:latest` | 8000 (→ 8002 localhost) | FastAPI RAG microserviço |
| `ecomed-pgvector` | `pgvector/pgvector:pg16` | 5432 (interno) | Vetores para o RAG |
| `ecomed-ollama` | `ollama/ollama:latest` | 11434 | Reservado (embeddings migrados para FastEmbed) |

### Caminhos de deploy

1. **GitHub Actions (preferido):** push em `master` dispara `.github/workflows/deploy.yml`
   — vitest → build → `prisma migrate deploy` → restart → crons idempotentes
2. **Manual:** `bash scripts/deploy.sh` no servidor (espelha o Actions)

O `deploy.sh` executa:
1. `git fetch origin && git reset --hard origin/master` — atualiza o código
2. Build do estágio `builder` com **BuildKit secrets** (segredos nunca entram nas camadas da imagem)
3. `prisma migrate deploy` — aplica migrações pendentes antes do restart
4. Build da imagem final + re-indexação do EcoBot (`app.ingest --reset`)
5. Substitui o container `ecomed-web` (janela de ~20s) e registra crons de backup/agregação
6. Health check em loop até HTTP 200 em `/api/health`

### Rotinas automáticas no servidor (cron)

| Horário (UTC) | Rotina | Função |
|---|---|---|
| `*/2 min` | `healthcheck.sh` | Reinicia o container web se o health falhar |
| `02:30` | `backup-db.sh` | `pg_dump` comprimido em `/opt/ecomed/backups`, retenção 14 dias |
| `03:00` / `03:15` | `cron-missoes.sh reset\|ensure` | Ciclo de missões diárias/semanais |
| `03:45` | `cron-missoes.sh views` | Agrega `PointView` → `PointViewDaily` e expurga brutos > 90 dias |

### Rebuild da IA (ao atualizar `ia/`)

```bash
# No servidor, na pasta /opt/ecomed/ia
docker stop ecomed-ia && docker rm ecomed-ia

docker build -t ia-api:latest .

docker run --rm --network ia_default \
  --env-file /opt/ecomed/ia/.env \
  ia-api:latest python -m app.ingest --reset

docker run -d --name ecomed-ia --restart unless-stopped \
  --network ia_default \
  -p 127.0.0.1:8002:8000 \
  --env-file /opt/ecomed/ia/.env \
  ia-api:latest
```

---

## 🪙 Sistema de EcoCoins

| Ação | EcoCoins | Limite |
|---|---|---|
| Criar conta | +20 | Única vez |
| Completar perfil | +10 | Única vez |
| Registrar descarte (com GPS) | +15 | 3/dia |
| Registrar descarte (sem GPS) | +10 | 3/dia |
| Completar quiz (100%) | +10 | 3/dia |
| Completar quiz (<100%) | +5 | 3/dia |
| Ler artigo completo (2 min + scroll 90%) | +2 | 5/dia |
| Perguntar ao EcoBot (≥10 chars) | +1 | 10/dia |
| Avaliar resposta do EcoBot (👍/👎) | +1 | — |
| Indicar amigo | +20 | 5/mês |
| Streak 7 dias | +15 | 1/semana |
| Streak 30 dias | +50 | 1/mês |
| **Teto diário** | **120** | — |

### Níveis

| Nível | Total EcoCoins | Ícone |
|---|---|---|
| Semente | 0–100 | 🌱 |
| Broto | 101–500 | 🌿 |
| Árvore | 501–2.000 | 🌳 |
| Guardião | 2.001–5.000 | 🌍 |
| Lenda Eco | 5.001+ | ⭐ |

---

## 🏪 Check-in por QR Code e Publicidade de Parceiros

Cada loja parceira recebe um **QR Code fixo** (`/parceiro/qrcode`) para o balcão. O cidadão escaneia,
confirma o descarte com GPS (`/checkin?p=`) e ganha EcoCoins na hora — o registro fica vinculado à loja
e alimenta o **relatório de impacto ESG** do parceiro (`/parceiro/impacto`): descartes, litros de água
protegidos e CO₂ evitado por período.

Parceiros também podem anunciar dentro da plataforma: banners segmentados por **cidade, UF ou raio
hiperlocal** ao redor da loja, geridos em `/admin/ads` e com métricas próprias em `/parceiro/publicidade`
(impressões, cliques, CTR). Toda campanha exibe selo "Publicidade" e segue a RDC 96/2008 da ANVISA —
apenas marca, loja e serviços, nunca medicamento de prescrição.

---

## ✍️ Blog — Arquitetura de Conteúdo

O blog é alimentado pelo **Sanity CMS** e renderizado em Next.js com `force-dynamic` (dados cacheados 1h via `revalidate`).

**Cada artigo possui:**
- Título, corpo (Portable Text), imagem de capa
- Metadados SEO (`seoTitle`, `metaDescription`)
- Campos GEO/IA (`aiSummary`, `entities`, `faqs[]`)
- Categoria, autor, data de publicação
- **3 posts relacionados** (mesma categoria, fallback para recentes)
- **Prev/next** — card com imagem de fundo + gradiente + hover zoom

**Schema.org por artigo:** `Article` + `FAQPage` (quando há FAQs) + `BreadcrumbList`.

---

## 🔍 GEO / Visibilidade para IAs

O EcoMed é otimizado para ser citado e indexado por assistentes de IA (Google AI Overviews, ChatGPT, Perplexity):

| Arquivo | Rota | Conteúdo |
|---|---|---|
| `ai.txt` | `/.well-known/ai.txt` | Declaração de uso aceitável para IAs |
| `faq.json` | `/ai/faq.json` | FAQs em JSON estruturado |
| `service.json` | `/ai/service.json` | Descrição do serviço para LLMs |
| `summary.json` | `/ai/summary.json` | Resumo executivo do projeto |
| `sitemap-llm` | `/sitemap-llm` | Sitemap textual para crawlers de IA |
| JSON-LD global | `layout.tsx` | `Organization` + `WebSite` + `SearchAction` |
| JSON-LD artigos | `blog/[slug]/page.tsx` | `Article` + `FAQPage` + `BreadcrumbList` |

---

## 🧪 Testes

```bash
# Testes unitários (Vitest) — quiz, regras de coins/níveis/streaks
pnpm test

# Testes do microserviço de IA (pytest) — guardrails de entrada e saída
pip install -r ia/requirements-dev.txt
pytest ia/tests/ -v

# Testes E2E (Playwright)
pnpm test:e2e

# Lint
pnpm lint

# Type check
pnpm build  # o build do Next.js faz type check automaticamente
```

Cobertura atual: **71 testes vitest** (quiz + gamificação) e **51 testes pytest**
(guardrails: emergência, injection, automedicação, falsos positivos e filtro de saída).
O CI bloqueia o deploy se os testes vitest falharem.

---

## 🔌 API Pública (v1)

API REST somente-leitura para parceiros integrarem os pontos de coleta —
gratuita para projetos educativos, ONGs e órgãos públicos.

| Endpoint | Descrição |
|---|---|
| `GET /api/public/v1/pontos/proximos?lat=&lng=&raio=` | Até 30 pontos ordenados por distância |
| `GET /api/public/v1/pontos/:id` | Detalhes + horários de funcionamento |

- Autenticação via header `X-API-Key` · rate limit 60 req/min · CORS por origin registrado
- Widget iframe sem chave: `https://ecomed.eco.br/embed/mapa?lat=&lng=&zoom=`
- Documentação completa e solicitação de chave: [ecomed.eco.br/desenvolvedores](https://ecomed.eco.br/desenvolvedores)

---

## 🌍 Impacto e ODS

O EcoMed está alinhado com **6 Objetivos de Desenvolvimento Sustentável** da ONU:

| ODS | Contribuição |
|---|---|
| **3** Saúde e Bem-Estar | Reduz contaminação farmacêutica na água → menos doenças |
| **4** Educação de Qualidade | Artigos + quizzes + IA educativa acessível |
| **6** Água Limpa | Cada descarte correto evita a contaminação de até 450.000L |
| **9** Inovação e Infraestrutura | IA local + PWA open source + arquitetura moderna |
| **12** Consumo Responsável | Logística reversa de resíduos farmacêuticos |
| **17** Parcerias | Farmácias + UBS + escolas + governo + ONGs |

---

## 👥 Equipe

Construído por uma equipe multidisciplinar apaixonada por tecnologia e meio ambiente.

---

## 🤝 Como Contribuir

1. Faça fork do projeto
2. Crie sua branch (`git checkout -b feat/minha-feature`)
3. Commit usando Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`)
4. Push e abra um Pull Request

Leia o [Guia de Contribuição](CONTRIBUTING.md) para mais detalhes.

---

## 📄 Licença

Distribuído sob a licença MIT. Veja [LICENSE](LICENSE) para mais informações.

---

## 📬 Contato

- **Site:** [ecomed.eco.br](https://ecomed.eco.br)
- **E-mail:** contato@ecomed.eco.br
- **Parcerias:** parcerias@ecomed.eco.br
- **Instagram:** [@ecomed.eco](https://instagram.com/ecomed.eco)
- **GitHub:** [github.com/ivonsmatos/ecomed](https://github.com/ivonsmatos/ecomed)

---

<div align="center">

**Feito com 🌿 por pessoas que acreditam que tecnologia pode salvar o planeta.**

Desenvolvido por [3TC - 3TB - 3TA]

</div>
