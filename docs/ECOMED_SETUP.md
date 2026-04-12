# EcoMed — Guia de Setup Completo

> **Para a IA que vai executar este guia:**
> Você é um assistente de desenvolvimento configurando o EcoMed do zero.
> Leia este documento inteiro antes de executar qualquer comando.
> Execute um bloco por vez, confirme o resultado, depois avance.
> Se aparecer um erro, PARE, explique o problema e aguarde instrução.
> Nunca tente contornar um erro silenciosamente.

---

## Visão Geral do Projeto

| Item | Detalhe |
|---|---|
| Repositório | https://github.com/ivonsmatos/ecomed |
| Estrutura | Monorepo — `app/` (Next.js) + `ia/` (FastAPI) |
| Domínio | ecomed.eco.br |
| Frontend deploy | Cloudflare Pages (pasta `app/`) |
| IA deploy | Oracle Cloud Free Tier VPS (pasta `ia/`) |
| Banco de dados | Supabase — PostgreSQL 16 + PostGIS + pgvector |
| Cache / Rate limit | Upstash Redis |
| CDN / WAF / Storage | Cloudflare (DNS, WAF, R2) |
| Package manager | pnpm |
| Dev | Windows local → servidor Linux |

---

## Parte 1 — Setup do Computador Windows

### 1.1 Instalar pré-requisitos (na ordem)

**Node.js 20 LTS**

Baixar em https://nodejs.org — escolher versão LTS. Marcar "Add to PATH".

```powershell
node --version    # deve mostrar v20.x.x ou superior
```

**pnpm**

```powershell
npm install -g pnpm
pnpm --version    # deve mostrar 9.x ou superior
```

**Git**

Baixar em https://git-scm.com/download/win

```powershell
git --version     # deve mostrar 2.40 ou superior

# Configurar identidade — obrigatório
git config --global user.name "Seu Nome Completo"
git config --global user.email "seu@email.com"
git config --global core.autocrlf false
```

> ⚠️ O `core.autocrlf false` é crítico no Windows. Sem ele, os arquivos ficam com quebras de linha erradas e quebram o servidor Linux.

**Python 3.11 ou 3.12**

Baixar em https://www.python.org/downloads/. Marcar **"Add Python to PATH"** — obrigatório.

```powershell
python --version  # deve mostrar Python 3.11.x ou 3.12.x
```

**Docker Desktop**

Baixar em https://www.docker.com/products/docker-desktop/. Após instalar, abrir e aguardar inicializar.

```powershell
docker --version          # deve mostrar 24.x ou superior
docker compose version    # deve mostrar 2.x
```

**VS Code**

Baixar em https://code.visualstudio.com. Instalar as extensões abaixo via menu Extensions:

- `Claude` — Anthropic
- `ESLint` — Microsoft
- `Prettier - Code formatter`
- `Prisma` — Prisma
- `Tailwind CSS IntelliSense`
- `Docker` — Microsoft
- `Python` — Microsoft
- `GitLens` — GitKraken

**Verificação final — todos de uma vez:**

```powershell
node --version && pnpm --version && git --version && python --version && docker --version
```

> ✅ Os 5 comandos devem retornar versões sem nenhum erro antes de continuar.

---

## Parte 2 — Criar as Contas dos Serviços

Criar nesta ordem — algumas dependem de outras.

### 2.1 Cloudflare (DNS + CDN + WAF + R2 + Pages)

1. Acessar https://cloudflare.com → criar conta gratuita
2. `Add a site` → digitar `ecomed.eco.br`
3. Seguir instruções para trocar os nameservers no Registro.br pelos que a Cloudflare indicar
4. Ativar **R2 Object Storage**:
   - Painel Cloudflare → `R2 Object Storage` → `Create bucket`
   - Nome: `ecomed-uploads`
5. Gerar token R2:
   - `R2` → `Manage R2 API Tokens` → `Create API Token`
   - Permissão: `Object Read & Write`
   - Salvar: `Access Key ID` e `Secret Access Key`
6. Anotar o `Account ID` (canto direito do painel)

### 2.2 Supabase (banco de dados)

1. Acessar https://supabase.com → criar conta com GitHub
2. `New project`:
   - Nome: `ecomed`
   - Password: criar senha forte e **salvar agora** — não tem recuperação
   - Region: `South America (São Paulo) — sa-east-1`
3. Após criar, ir em `Settings` → `Database` → copiar:
   - **Connection string pooler** (porta 6543) → vai ser o `DATABASE_URL`
   - **Direct connection** (porta 5432) → vai ser o `DIRECT_URL`
4. Abrir `SQL Editor` e executar:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS vector;
```

> ✅ Os 3 comandos devem executar sem erro.

### 2.3 Upstash (Redis)

1. Acessar https://upstash.com → criar conta com GitHub
2. `Create Database` → Nome: `ecomed-cache` | Type: `Redis` | Region: `São Paulo` | Plan: `Free`
3. Copiar: `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`

### 2.4 Resend (emails automáticos)

1. Acessar https://resend.com → criar conta
2. `Add Domain` → `ecomed.eco.br`
3. Adicionar os registros DNS que o Resend mostrar no painel da Cloudflare
4. `API Keys` → `Create API Key` → copiar — **aparece uma única vez**

### 2.5 Sentry (monitoramento de erros)

1. Acessar https://sentry.io → criar conta gratuita
2. `Create Project` → `Next.js` → Nome: `ecomed`
3. Copiar o `DSN` do projeto

### 2.6 Oracle Cloud Free Tier (servidor da IA)

> ⚠️ Iniciar agora — pode levar 1-2 dias para aprovação da conta.

1. Acessar https://cloud.oracle.com/free
2. Criar conta com cartão de crédito — **não é cobrado** no Free Tier permanente
3. Região: **Brazil East (São Paulo)**
4. Após aprovação, criar VM:
   - `Compute` → `Instances` → `Create Instance`
   - Shape: `VM.Standard.A1.Flex` (ARM — este é o gratuito)
   - OCPUs: **4** | Memory: **24 GB**
   - Image: `Ubuntu 22.04`
   - Baixar par de chaves SSH (`.pem`) e guardar em lugar seguro
5. Anotar o IP público da VM
6. Abrir portas em `Security List`: `22`, `80`, `443`, `8000`

---

## Parte 3 — Clonar e Criar a Estrutura do Monorepo

```powershell
cd C:\Projetos

git clone https://github.com/ivonsmatos/ecomed.git
cd ecomed

# Criar estrutura do monorepo
mkdir app
mkdir ia
mkdir docs

echo "# EcoMed — Descarte certo, planeta saudável 🌿" > README.md
```

Criar `.gitignore` na raiz:

```
# Ambientes
app/.env.local
app/.env.*.local
ia/.env
ia/.env.*

# Dependências
app/node_modules/
ia/venv/
ia/__pycache__/

# Build
app/.next/
app/out/

# Misc
.DS_Store
Thumbs.db
```

---

## Parte 4 — Setup da pasta `app/` (Next.js + Cloudflare Pages)

```powershell
cd app
```

### 4.1 Criar projeto Next.js

```powershell
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm
```

Responder:
- Turbopack for `next dev`? → **Yes**
- Customize import alias? → **No**

### 4.2 Instalar dependências

```powershell
pnpm add \
  hono \
  @prisma/client \
  next-auth@beta @auth/prisma-adapter \
  bcryptjs \
  zod @hookform/resolvers react-hook-form \
  @upstash/ratelimit @upstash/redis \
  web-push \
  @aws-sdk/client-s3 sharp \
  resend \
  leaflet react-leaflet \
  @sentry/nextjs \
  idb-keyval \
  recharts \
  serwist \
  next-mdx-remote \
  marked

pnpm add -D \
  prisma \
  @serwist/next \
  @cloudflare/next-on-pages \
  wrangler \
  @types/bcryptjs \
  @types/leaflet \
  @types/web-push \
  vitest @vitejs/plugin-react \
  @playwright/test \
  axe-playwright \
  prettier prettier-plugin-tailwindcss \
  husky lint-staged \
  @tailwindcss/typography \
  tsx
```

### 4.3 Instalar shadcn/ui

```powershell
pnpm dlx shadcn@latest init
```

Responder: Style → **Default** | Base color → **Zinc** | CSS variables → **Yes**

```powershell
pnpm dlx shadcn@latest add \
  button card input label form toast badge \
  dialog drawer sheet popover tooltip \
  table avatar skeleton tabs separator \
  navigation-menu
```

### 4.4 Inicializar Prisma

```powershell
pnpm prisma init
```

Substituir todo o conteúdo de `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

enum Role        { CITIZEN PARTNER ADMIN }
enum PointStatus { PENDING APPROVED REJECTED }
enum ReportType  { CLOSED WRONG_ADDRESS NOT_ACCEPTING OTHER }

model User {
  id                String             @id @default(cuid())
  name              String?
  email             String             @unique
  emailVerified     DateTime?
  image             String?
  password          String?
  role              Role               @default(CITIZEN)
  active            Boolean            @default(true)
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  accounts          Account[]
  sessions          Session[]
  favorites         Favorite[]
  reports           Report[]
  partner           Partner?
  pushSubscriptions PushSubscription[]
  notifications     Notification[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}

model Partner {
  id          String   @id @default(cuid())
  userId      String   @unique
  cnpj        String   @unique
  companyName String
  tradeName   String?
  phone       String?
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  points      Point[]
}

model Point {
  id             String      @id @default(cuid())
  partnerId      String
  name           String
  address        String
  city           String
  state          String
  zipCode        String
  latitude       Float
  longitude      Float
  phone          String?
  email          String?
  photoUrl       String?
  status         PointStatus @default(PENDING)
  rejectedReason String?
  residueTypes   String[]
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
  partner        Partner     @relation(fields: [partnerId], references: [id], onDelete: Cascade)
  favorites      Favorite[]
  reports        Report[]
  schedules      Schedule[]
  views          PointView[]
}

model Schedule {
  id        String  @id @default(cuid())
  pointId   String
  dayOfWeek Int
  opens     String
  closes    String
  closed    Boolean @default(false)
  point     Point   @relation(fields: [pointId], references: [id], onDelete: Cascade)
}

model Favorite {
  id        String   @id @default(cuid())
  userId    String
  pointId   String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  point     Point    @relation(fields: [pointId], references: [id], onDelete: Cascade)
  @@unique([userId, pointId])
}

model Report {
  id          String     @id @default(cuid())
  userId      String?
  pointId     String
  type        ReportType
  description String?
  resolved    Boolean    @default(false)
  createdAt   DateTime   @default(now())
  user        User?      @relation(fields: [userId], references: [id])
  point       Point      @relation(fields: [pointId], references: [id], onDelete: Cascade)
}

model PushSubscription {
  id        String   @id @default(cuid())
  userId    String
  endpoint  String   @unique
  p256dh    String
  auth      String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  title     String
  body      String
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Article {
  id          String    @id @default(cuid())
  slug        String    @unique
  title       String
  content     String    @db.Text
  excerpt     String?
  category    String?
  coverUrl    String?
  published   Boolean   @default(false)
  publishedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model PointView {
  id       String   @id @default(cuid())
  pointId  String
  viewedAt DateTime @default(now())
  point    Point    @relation(fields: [pointId], references: [id], onDelete: Cascade)
}
```

### 4.5 Criar `.env.local`

Criar o arquivo `app/.env.local` e preencher com os valores coletados nas etapas anteriores:

```env
# ============================================================
# ECOMED — Variáveis de Ambiente
# NÃO commitar este arquivo no Git
# ============================================================

# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=              # gerar: openssl rand -base64 32

# Supabase
DATABASE_URL=                 # URI pooler, porta 6543
DIRECT_URL=                   # URI direta, porta 5432

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Cloudflare R2
CLOUDFLARE_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=ecomed-uploads
R2_PUBLIC_URL=                # ex: https://pub-SEU_HASH.r2.dev

# Web Push VAPID (gerar com: pnpm dlx web-push generate-vapid-keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=noreply@ecomed.eco.br

# Resend (email)
RESEND_API_KEY=
EMAIL_FROM=EcoMed <noreply@ecomed.eco.br>

# Sentry
NEXT_PUBLIC_SENTRY_DSN=

# Microserviço de IA
# Dev: http://localhost:8000  |  Produção: https://ia.ecomed.eco.br
IA_SERVICE_URL=http://localhost:8000
IA_SERVICE_TOKEN=             # qualquer string aleatória longa
```

Gerar as chaves VAPID:

```powershell
pnpm dlx web-push generate-vapid-keys
```

Copiar as chaves geradas para `app/.env.local`.

Criar `app/.env.example` (versão sem valores para commitar):

```powershell
copy app\.env.local app\.env.example
# Abrir app/.env.example e apagar os valores — manter só as chaves
```

### 4.6 Rodar migrations no Supabase

```powershell
# Dentro da pasta app/
pnpm prisma migrate dev --name init
```

> ✅ Verificar no Supabase → `Table Editor` — as tabelas devem aparecer.

### 4.7 Scripts do `package.json`

Adicionar dentro de `"scripts"` em `app/package.json`:

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write .",
    "test": "vitest",
    "test:e2e": "playwright test",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "db:generate": "prisma generate"
  }
}
```

### 4.8 Configurar Cloudflare Pages

Criar `app/wrangler.toml`:

```toml
name = "ecomed-app"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = ".vercel/output/static"
```

Atualizar `app/next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "pub-*.r2.dev" },
    ],
  },
};

export default nextConfig;
```

**Conectar ao Cloudflare Pages:**

1. https://dash.cloudflare.com → `Workers & Pages` → `Create` → `Pages` → `Connect to Git`
2. Selecionar repositório `ivonsmatos/ecomed`
3. Configurações de build:
   - **Build command:** `cd app && pnpm install && pnpm build`
   - **Build output directory:** `app/.vercel/output/static`
   - **Root directory:** deixar vazio
4. Em `Environment variables` → adicionar todas as variáveis do `.env.local`
5. `Save and Deploy`

**Domínio customizado:**
- `Custom domains` → `Set up a custom domain` → `ecomed.eco.br`
- O CNAME é criado automaticamente pois o DNS já está na Cloudflare

### 4.9 Testar

```powershell
pnpm dev
```

Abrir http://localhost:3000. Deve abrir a página inicial.

---

## Parte 5 — Setup da pasta `ia/` (FastAPI + Ollama)

```powershell
cd ..\ia
```

### 5.1 Ambiente virtual Python

```powershell
python -m venv venv
venv\Scripts\activate
```

> ✅ O prompt deve mostrar `(venv)` na frente.

### 5.2 `requirements.txt`

```text
fastapi==0.115.0
uvicorn[standard]==0.30.0
langchain==0.3.0
langchain-community==0.3.0
langchain-ollama==0.2.0
langchain-postgres==0.0.12
psycopg[binary]==3.2.0
python-dotenv==1.0.1
pydantic==2.9.0
pydantic-settings==2.5.0
httpx==0.27.0
sse-starlette==2.1.0
ruff
```

```powershell
pip install -r requirements.txt
```

### 5.3 Estrutura de arquivos

```powershell
mkdir app app\routers app\services tests
echo. > app\__init__.py
echo. > app\routers\__init__.py
echo. > app\services\__init__.py
```

### 5.4 `ia/.env`

```env
DATABASE_URL=           # URL direta Supabase (porta 5432) — mesmo DIRECT_URL do app
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3:8b-instruct-q4_0
IA_SERVICE_TOKEN=       # Mesmo valor de IA_SERVICE_TOKEN do app/.env.local
```

### 5.5 `ia/app/main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.routers import chat, health

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("EcoMed IA iniciando...")
    yield

app = FastAPI(
    title="EcoMed IA",
    description="Microserviço RAG — chatbot educativo sobre descarte de medicamentos",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://ecomed.eco.br",
        "https://staging.ecomed.eco.br",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])
```

### 5.6 `ia/app/routers/health.py`

```python
from fastapi import APIRouter

router = APIRouter()

@router.get("")
async def health():
    return {"status": "ok", "service": "ecomed-ia", "version": "1.0.0"}
```

### 5.7 `ia/app/services/rag.py` — RAG com guardrails

```python
import os
from langchain_ollama import OllamaLLM, OllamaEmbeddings
from langchain_postgres import PGVector
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from dotenv import load_dotenv

load_dotenv()

SYSTEM_PROMPT = """Você é o assistente educativo do EcoMed, uma plataforma brasileira
dedicada ao descarte correto de medicamentos.

VOCÊ PODE ajudar com:
- Como e onde descartar medicamentos vencidos ou sem uso
- Localização de pontos de coleta no Brasil (farmácias, UBS, ecopontos)
- Impacto ambiental do descarte incorreto de medicamentos
- Legislação brasileira: PNRS (Lei 12.305/2010), Decreto 10.388/2020, RDC 222/2018 ANVISA
- Educação ambiental relacionada a medicamentos

VOCÊ NUNCA DEVE:
- Sugerir doses ou posologia de qualquer medicamento
- Recomendar medicamentos para doenças ou sintomas
- Fornecer diagnósticos médicos
- Responder sobre automedicação
- Discutir interações medicamentosas

Se a pergunta estiver fora do escopo, responda:
"Posso ajudar apenas com informações sobre descarte correto de medicamentos.
Para questões médicas, consulte um farmacêutico ou médico."

SEMPRE adicione ao final de respostas sobre saúde:
"⚠️ Este conteúdo é educativo. Para dúvidas médicas, consulte um profissional de saúde."

Responda em português brasileiro claro e acessível.
Use apenas o contexto fornecido. Se não souber, diga que não tem essa informação.

Contexto:
{context}

Pergunta: {question}
Resposta:"""

PALAVRAS_BLOQUEADAS = [
    "dose", "dosagem", "posologia", "quantos comprimidos",
    "receita médica", "prescrição", "diagnóstico",
    "tratamento de", "sintoma", "overdose", "superdosagem",
    "intoxicação", "comprar medicamento",
]

RESPOSTA_FORA_ESCOPO = (
    "Posso ajudar apenas com informações sobre descarte correto de medicamentos no Brasil. 🌿\n"
    "Para questões médicas, consulte um farmacêutico ou médico."
)


def verificar_escopo(pergunta: str) -> bool:
    return not any(p in pergunta.lower() for p in PALAVRAS_BLOQUEADAS)


class RAGService:
    def __init__(self):
        self.chain = None

    async def initialize(self):
        base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        model = os.getenv("OLLAMA_MODEL", "llama3:8b-instruct-q4_0")
        db_url = os.getenv("DATABASE_URL")

        embeddings = OllamaEmbeddings(model="nomic-embed-text", base_url=base_url)
        llm = OllamaLLM(model=model, base_url=base_url, temperature=0.1, num_predict=512)

        vectorstore = PGVector(
            embeddings=embeddings,
            collection_name="ecomed_docs",
            connection=db_url,
        )

        prompt = PromptTemplate(
            input_variables=["context", "question"],
            template=SYSTEM_PROMPT,
        )

        self.chain = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            retriever=vectorstore.as_retriever(search_kwargs={"k": 4}),
            chain_type_kwargs={"prompt": prompt},
        )
        print(f"RAG pronto — modelo: {model}")

    async def perguntar(self, pergunta: str) -> str:
        if not verificar_escopo(pergunta):
            return RESPOSTA_FORA_ESCOPO
        if not self.chain:
            return "Serviço iniciando. Tente em alguns instantes."
        resultado = await self.chain.ainvoke({"query": pergunta})
        return resultado.get("result", "Não foi possível gerar resposta.")
```

### 5.8 `ia/app/routers/chat.py`

```python
import os
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from app.services.rag import RAGService

router = APIRouter()
rag = RAGService()
TOKEN = os.getenv("IA_SERVICE_TOKEN", "")


def checar_token(authorization: str | None):
    if TOKEN and authorization != f"Bearer {TOKEN}":
        raise HTTPException(status_code=401, detail="Token inválido.")


class ChatRequest(BaseModel):
    question: str


@router.on_event("startup")
async def startup():
    await rag.initialize()


@router.post("")
async def chat(body: ChatRequest, authorization: str | None = Header(default=None)):
    checar_token(authorization)
    q = body.question.strip()
    if len(q) < 3:
        raise HTTPException(status_code=400, detail="Pergunta muito curta.")
    if len(q) > 1000:
        raise HTTPException(status_code=400, detail="Máximo 1000 caracteres.")
    return {"answer": await rag.perguntar(q)}
```

### 5.9 `ia/docker-compose.yml`

```yaml
services:
  ollama:
    image: ollama/ollama:latest
    container_name: ecomed-ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    restart: unless-stopped

  api:
    build: .
    container_name: ecomed-ia
    ports:
      - "8000:8000"
    env_file: .env
    depends_on:
      - ollama
    volumes:
      - .:/app
    restart: unless-stopped

volumes:
  ollama_data:
```

### 5.10 `ia/Dockerfile`

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

### 5.11 Subir e baixar os modelos

```powershell
docker compose up -d ollama

# Baixar modelos (~4 GB — pode demorar)
docker exec ecomed-ollama ollama pull llama3:8b-instruct-q4_0
docker exec ecomed-ollama ollama pull nomic-embed-text

# Confirmar que baixou
docker exec ecomed-ollama ollama list

# Subir a API
docker compose up -d api

# Testar
curl http://localhost:8000/health
# Deve retornar: {"status":"ok","service":"ecomed-ia","version":"1.0.0"}
```

---

## Parte 6 — GitHub Actions (CI automático)

Criar `.github/workflows/ci.yml` na raiz do monorepo:

```yaml
name: CI — EcoMed

on:
  push:
    branches: [main, staging, develop]
  pull_request:
    branches: [main, staging]

jobs:
  app:
    name: app/ — lint, types, build
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: app

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
          cache-dependency-path: app/pnpm-lock.yaml

      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm tsc --noEmit
      - run: pnpm build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          DIRECT_URL: ${{ secrets.DIRECT_URL }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
          NEXTAUTH_URL: https://staging.ecomed.eco.br

  ia:
    name: ia/ — lint Python
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ia

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
          cache: pip
          cache-dependency-path: ia/requirements.txt

      - run: pip install ruff
      - run: ruff check app/
```

Adicionar secrets no GitHub: `Settings > Secrets > Actions`:
- `DATABASE_URL`
- `DIRECT_URL`
- `NEXTAUTH_SECRET`

---

## Parte 7 — Workflow de Desenvolvimento

### Estrutura de branches

```
main       → produção (ecomed.eco.br) — deploy manual
  staging  → homologação — deploy automático ao dar push
    develop → integração geral
      feat/setup-auth
      feat/endpoint-pontos
      feat/pagina-mapa
      feat/indexacao-rag
```

### Comandos diários

```powershell
# Início da sessão
git checkout develop
git pull origin develop
git checkout -b feat/[descricao-da-tarefa]

# Desenvolvimento
cd app && pnpm dev          # localhost:3000
cd ia && docker compose up  # localhost:8000
cd app && pnpm db:studio    # localhost:5555 — visualizar banco

# Antes de commitar
pnpm lint:fix && pnpm format

# Enviar
git add .
git commit -m "feat(mapa): busca por CEP via ViaCEP"
git push origin feat/[descricao-da-tarefa]
# Abrir Pull Request: sua branch → develop
```

### Convenção de commits

```
feat:     nova funcionalidade
fix:      correção de bug
docs:     documentação
style:    formatação sem mudança de lógica
refactor: melhoria interna sem nova feature
test:     testes
chore:    dependências, configurações

Exemplos:
feat(auth): login com Google OAuth
fix(mapa): geolocalização no Safari iOS
feat(parceiro): formulário cadastro com validação CNPJ
test(e2e): cenário aprovação de ponto pelo admin
```

---

## Parte 8 — Checklist Final

```
INSTALAÇÃO
☐ node --version → v20+
☐ pnpm --version → 9+
☐ git --version  → 2.40+
☐ python --version → 3.11+ ou 3.12+
☐ docker --version → 24+

CONTAS
☐ Cloudflare com ecomed.eco.br configurado e nameservers apontados
☐ Supabase criado — extensões postgis, pg_trgm, vector ativas
☐ Upstash Redis criado e credenciais salvas
☐ Resend com domínio verificado e API key salva
☐ Sentry com projeto criado e DSN salvo
☐ Oracle Cloud VPS criado (ou aguardando aprovação)

APP (NEXT.JS)
☐ pnpm dev sobe em localhost:3000 sem erros
☐ /api/health retorna {"status":"ok"}
☐ pnpm db:studio abre com todas as tabelas do schema
☐ .env.local preenchido com credenciais reais
☐ .env.example commitado no GitHub (sem valores)

IA (FASTAPI)
☐ docker compose up sobe sem erros
☐ localhost:8000/health retorna {"status":"ok"}
☐ ollama list mostra llama3 e nomic-embed-text
☐ POST localhost:8000/chat retorna resposta

DEPLOY
☐ Cloudflare Pages conectado ao repositório
☐ Build passando no painel Cloudflare
☐ ecomed.eco.br abrindo com HTTPS
☐ GitHub Actions verde no push
```

---

## Parte 9 — Problemas Comuns

| Problema | Solução |
|---|---|
| `pnpm install` falha no Windows | Abrir PowerShell como Administrador |
| `prisma migrate dev` falha | Verificar `DATABASE_URL` e `DIRECT_URL` no `.env.local` |
| Supabase connection timeout | Adicionar `?pgbouncer=true&connection_limit=1` no `DATABASE_URL` |
| Ollama não responde | `docker compose restart ollama` e aguardar 30s |
| Login Google não funciona | No Google Console, adicionar `http://localhost:3000/api/auth/callback/google` nos URIs autorizados |
| Cloudflare Pages build falha | Verificar variáveis de ambiente no painel Cloudflare → Settings → Environment variables |
| Push notification não chega no iOS | PWA precisa estar instalada ("Adicionar à tela inicial") |
| Rate limit bloqueando todas as requests | Verificar `UPSTASH_REDIS_REST_URL` e `TOKEN` no `.env.local` |
| `.env.local` commitado por acidente | `git rm --cached app/.env.local` → `git commit -m "fix: remover .env do git"` |
| Modelo Ollama muito lento | Usar `llama3:8b-instruct-q4_0` (versão quantizada) — mais rápido com menos RAM |

---

*EcoMed — Descarte certo, planeta saudável 🌿*
*Repositório: https://github.com/ivonsmatos/ecomed*
*Monorepo: pasta `app/` (Next.js) + pasta `ia/` (FastAPI)*
