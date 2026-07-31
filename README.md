<div align="center">

# 🌿 EcoMed

**Descarte certo, planeta saudável**

PWA educativo com mapa inteligente, IA e gamificação para o descarte correto de medicamentos no Brasil.

[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org)
[![Groq](https://img.shields.io/badge/IA-RAG%20%2B%20Groq-1A736A.svg)](https://groq.com)

[Acessar o EcoMed](https://ecomed.eco.br) · [Reportar Bug](https://github.com/ivonsmatos/ecomed/issues/new) · [Sugerir Feature](https://github.com/ivonsmatos/ecomed/issues/new)

</div>

---

## 📋 Sobre o Projeto

O descarte de medicamentos no lixo comum ou no esgoto representa um risco ambiental
e de saúde pública. Ao mesmo tempo, informações sobre pontos de coleta e sobre a
forma correta de descarte ainda estão dispersas.

O EcoMed resolve isso com três pilares:

| Funcionalidade | Descrição |
|---|---|
| 🗺️ **Mapa Inteligente** | 58 mil+ pontos (farmácias LogMed + UBS DATASUS). Busca por cidade ou CEP, filtro por tipo de resíduo (medicamentos / agulhas e seringas), rotas e selo de validação comunitária. |
| 🤖 **EcoBot (Chat com IA)** | Tire dúvidas sobre descarte 24h. RAG com base de conhecimento local, guardrails de 5 camadas e LLM via Groq. |
| 🪙 **EcoCoins (Gamificação)** | Ganhe EcoCoins por cada ação sustentável. Suba de nível, complete missões e troque por recompensas. |

> Plataforma de código-fonte público para descarte correto de medicamentos no Brasil.

---

## 🚀 Funcionalidades

- ✅ **PWA** — instala direto do navegador, sem loja de aplicativos
- ✅ **Offline-first** — service worker com serwist, cache estratégico
- ✅ **Mapa de pontos de coleta** — 58.000+ pontos (LogMed + DATASUS) com OpenStreetMap + Leaflet
- ✅ **Busca por cidade ou CEP** — autocomplete de municípios + resolução de CEP via ViaCEP (server-side)
- ✅ **Filtro por tipo de resíduo** — medicamentos vs. agulhas/seringas (farmácia vs. UBS)
- ✅ **Selo de validação comunitária** — "descarte confirmado há X dias" + alerta de reportes em aberto
- ✅ **Chat com IA educativa** — Groq (`llama-3.1-8b-instant` por padrão) + RAG local, guardrails de 5 camadas
- ✅ **Sistema de EcoCoins** — ledger auditável e idempotente, 5 níveis (🌱→⭐), missões diárias, streaks e limites anti-fraude
- ✅ **Blog educativo** — CMS Sanity, busca de conteúdo, paginação, posts relacionados, prev/next com preview de imagem
- ✅ **Quizzes educativos** — perguntas com score server-side e EcoCoins
- ✅ **Indicações** — código pessoal ECOMED-XXXXX, +20 EcoCoins por amigo
- ✅ **Ranking semanal** — top usuários por EcoCoins ganhos na semana
- ✅ **Certificado Eco-Cidadão** — PDF gerado no servidor com QR Code de verificação
- ✅ **Dashboard de impacto pessoal** — litros protegidos, descartes, pessoas educadas
- ✅ **Página pública de impacto** (`/impacto`) — indicadores agregados da plataforma + cobertura por município
- ✅ **API pública para parceiros** (`/api/public/v1`) — pontos de coleta via REST com X-API-Key ([docs](https://ecomed.eco.br/desenvolvedores))
- ✅ **Widget embeddable** (`/embed/mapa`) — mapa via iframe para sites de terceiros, sem chave
- ✅ **SEO programático** — páginas `/descarte/[cidade]-[uf]` para municípios com pontos de coleta
- ✅ **Check-in por QR Code da loja** (`/checkin?token=`) — token HMAC com validade configurável, confirmação por GPS e crédito idempotente de EcoCoins
- ✅ **Relatório de impacto por parceiro** (`/parceiro/impacto`) — descartes e estimativas de impacto por loja, com QR gerado no painel (`/parceiro/qrcode`)
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
| **Cache / Rate Limit** | Upstash Redis | — | Rate limiting distribuído |
| **CMS** | Sanity | 5.x | Blog, artigos educativos |
| **Monitoramento** | Sentry | 10.x | Error tracking + performance |
| **Analytics** | Google Analytics + Plausible | — | Métricas de uso condicionadas ao consentimento |
| **Service Worker** | serwist | — | PWA offline, cache de assets |
| **PDF** | @react-pdf/renderer | — | Certificados gerados no servidor |
| **Push** | Web Push API | — | Notificações browser |

### Microserviço de IA (`ia/`)

| Camada | Tecnologia | Uso |
|---|---|---|
| **API** | FastAPI + uvicorn | Endpoint `/chat`, autenticação por token Bearer |
| **LLM** | Groq — `llama-3.1-8b-instant` por padrão | Inferência via API; modelo configurável por `GROQ_MODEL` |
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
│  LLM — Groq / modelo configurado             │
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
**Memória de sessão:** histórico recente por `session_id`, mantido em memória com TTL e limite LRU configuráveis.

---

## 📁 Estrutura do Projeto

```
ecomed/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (auth)/                 # Grupo de rotas de autenticação
│   │   ├── app/                    # Área autenticada: perfil, missões, quiz, chat...
│   │   ├── admin/                  # Painel administrativo e campanhas
│   │   ├── parceiro/               # Painel, QR, impacto e publicidade
│   │   ├── api/[[...route]]/       # API composta com Hono
│   │   ├── api/cron/               # Rotinas HTTP protegidas por CRON_SECRET
│   │   ├── blog/, mapa/, ranking/  # Rotas públicas
│   │   ├── checkin/                # Check-in por token QR assinado
│   │   ├── descarte/[slug]/        # SEO programático por cidade
│   │   ├── impacto/                # Indicadores públicos
│   │   ├── metodologia-impacto/    # Premissas e limites dos indicadores
│   │   ├── embed/mapa/             # Widget para terceiros
│   │   ├── layout.tsx              # Layout global e dados estruturados
│   │   ├── manifest.ts             # Manifesto PWA
│   │   ├── robots.ts               # Robots dinâmico
│   │   └── sitemap.ts              # Sitemap dinâmico
│   ├── components/                 # Componentes React por domínio + UI
│   └── lib/                        # Regras e integrações
│       ├── auth/, db/, sanity/     # Autenticação, Prisma e CMS
│       ├── coins/, goals/          # Gamificação
│       ├── ads/, geo/              # Publicidade e geolocalização
│       ├── consent/, lgpd/         # Consentimento e privacidade
│       ├── impacto/                # Cálculos e apresentação de impacto
│       ├── qr/                     # Assinatura e validação de tokens QR
│       └── ratelimit/              # Rate limiting com Upstash
│
├── ia/                             # Microserviço de IA (Python / FastAPI)
│   ├── app/
│   │   ├── routers/                # Chat, embeddings e healthcheck
│   │   └── services/               # RAG, guardrails e sessões TTL/LRU
│   ├── docs/                       # Base de conhecimento
│   └── tests/                      # Testes do serviço e guardrails
│
├── prisma/
│   ├── schema.prisma               # Modelo de dados
│   ├── migrations/                 # Histórico de migrações SQL
│   └── seed*.ts                    # Seeds da aplicação e pontos LogMed
│
├── tests/e2e/                      # Testes Playwright
├── public/                         # Assets, ícones PWA e llms.txt
├── scripts/                        # Seeds, geocodificação e utilitários
├── ops/
│   ├── maintenance/                # Healthcheck, crons e backup
│   └── security/                   # Auditoria e endurecimento operacional
├── .github/workflows/              # Deploy, CodeQL e automações
├── docs/                           # Documentação estratégica e de negócio
├── Dockerfile                      # Imagem multi-stage do Next.js
├── .env.example                    # Exemplo mínimo, sem segredos reais
└── README.md                       # Este arquivo
```

---

## ⚡ Início Rápido (Desenvolvimento)

### Pré-requisitos

- [Node.js](https://nodejs.org) 22.x
- [pnpm](https://pnpm.io) 10.15.0
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
AUTH_URL=http://localhost:3000

# Tokens assinados dos QR Codes (não reutilize AUTH_SECRET)
QR_HMAC_SECRET=<string aleatória exclusiva, mínimo 32 chars>
QR_POINT_TOKEN_TTL_SECONDS=2592000

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

# Crons HTTP internos
CRON_SECRET=<token secreto>
```

Use valores diferentes para `AUTH_SECRET`, `QR_HMAC_SECRET`, `IA_SERVICE_TOKEN` e
`CRON_SECRET`. Nunca envie arquivos `.env` ou credenciais reais ao Git.

### 3. Banco de dados

```bash
# Aplicar/criar migrações no ambiente de desenvolvimento
pnpm db:migrate

# Seed inicial (pontos de coleta + quizzes)
pnpm db:seed
```

`pnpm db:push` fica disponível para bancos locais descartáveis. Em produção, o
workflow usa `prisma migrate deploy`.

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

O deploy é feito via GitHub Actions e Docker em uma VPS Linux. O banco principal é
PostgreSQL gerenciado; o armazenamento vetorial do RAG pode permanecer em um
PostgreSQL com `pgvector` na rede privada `ia_default`.

### Containers em produção

| Container | Imagem | Porta interna | Função |
|---|---|---|---|
| `ecomed-web` | `ecomed-app:<commit-sha>` | 3010 | Next.js (build multi-stage) |
| `ecomed-ia` | `ia-api:latest` | 8000 (→ 8002 localhost) | FastAPI RAG microserviço |
| `ecomed-pgvector` | `pgvector/pgvector:pg16` | 5432 (interno) | Armazenamento vetorial do RAG, quando usado localmente |

### Caminhos de deploy

1. Um push de código em `master` dispara `.github/workflows/deploy.yml`; alterações
   apenas em Markdown ou `docs/` não fazem deploy.
2. O quality gate executa Vitest, ESLint, TypeScript, pytest, build e Gitleaks.
3. A VPS seleciona exatamente o commit do workflow, com trava contra deploys concorrentes.
4. Segredos de build entram via BuildKit secrets e as migrações usam `prisma migrate deploy`.
5. O container é substituído, verificado pelo healthcheck e revertido para a imagem anterior
   se não ficar saudável.

CodeQL e Dependabot complementam as verificações do pipeline. O script
`scripts/deploy.sh` existe como caminho operacional manual; o Actions é a referência.

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

Cada loja parceira gera um QR Code em `/parceiro/qrcode`. O endereço contém um
token assinado (`/checkin?token=`), com validade configurável. O cidadão confirma
o descarte com GPS; o processamento idempotente evita crédito duplicado e vincula
o registro à loja.

O painel `/parceiro/impacto` apresenta descartes e estimativas locais de impacto.
Essas estimativas não equivalem a medição ambiental direta; premissas e limitações
devem ser consultadas em `/metodologia-impacto`.

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
| `sitemap-llm` | `/sitemap-llm.xml` | Sitemap textual para crawlers de IA |
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

# Type check e build
pnpm typecheck
pnpm build
```

As suítes cobrem regras de gamificação, QR/check-in, consentimento, impacto,
guardrails, sessões e rotas críticas. O CI bloqueia o deploy se testes, lint,
typecheck, testes Python, build ou varredura de segredos falharem.

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
| **3** Saúde e Bem-Estar | Orienta sobre descarte seguro e evita exposição indevida |
| **4** Educação de Qualidade | Artigos + quizzes + IA educativa acessível |
| **6** Água Limpa | Apoia o descarte correto; estimativas de potencial seguem `/metodologia-impacto` |
| **9** Inovação e Infraestrutura | Assistente RAG + PWA de código-fonte público + arquitetura moderna |
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

Antes de iniciar uma alteração grande, abra uma issue para alinhar escopo e critérios
de aceite.

---

## 📄 Licença

O repositório ainda não contém um arquivo de licença. Até que uma licença seja
formalmente adicionada, o código permanece protegido pelos direitos autorais de
seus autores; tornar o repositório público não concede automaticamente permissão
de uso, cópia ou redistribuição.

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
