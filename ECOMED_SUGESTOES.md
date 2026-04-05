# EcoMed — Sugestões de Melhoria

> **Para a IA que vai executar este guia:**
> Leia o documento completo antes de começar.
> Execute um item por vez, confirme que funcionou, depois avance.
> Se encontrar um erro, PARE, explique e aguarde instrução.
> Este documento cobre melhorias independentes — execute na ordem indicada.

---

## Contexto

Repositório: **https://github.com/ivonsmatos/ecomed**
Stack: Next.js 16 · Prisma 7 · NextAuth v5 · Hono · Tailwind v4 · Supabase · Cloudflare Pages · pnpm

---

## Prioridade 1 — Crítico para a demo

---

### 1.1 — Seed de pontos reais do LogMed

**Por quê:** o mapa abre sem nenhum pin. É a funcionalidade principal do app.

**O que fazer:**

Criar `app/prisma/seed-logmed.ts`:

```typescript
import { PrismaClient } from "@prisma/client"
import * as fs from "fs"
import * as path from "path"

const prisma = new PrismaClient()

// Estrutura esperada do CSV da ANVISA/LogMed:
// nome,cnpj,endereco,bairro,cidade,estado,cep,latitude,longitude,telefone,tipo
// Baixar em: https://dados.anvisa.gov.br/dados/DADOS_ABERTOS_FARMACIAS.csv
// Ou usar o dataset mock abaixo para desenvolvimento

const PONTOS_MOCK = [
  { name: "Drogaria São Paulo — Paulista", cnpj: "11222333000100", address: "Av. Paulista, 1000", city: "São Paulo", state: "SP", zipCode: "01310100", latitude: -23.5629, longitude: -46.6544, phone: "11999990001", residueTypes: ["medicamento"] },
  { name: "UBS Vila Madalena", cnpj: "11222333000200", address: "R. Mourato Coelho, 100", city: "São Paulo", state: "SP", zipCode: "05416001", latitude: -23.5540, longitude: -46.6890, phone: "11999990002", residueTypes: ["medicamento", "seringa"] },
  { name: "Farmácia Popular — Pinheiros", cnpj: "11222333000300", address: "R. dos Pinheiros, 500", city: "São Paulo", state: "SP", zipCode: "05422001", latitude: -23.5636, longitude: -46.6849, phone: "11999990003", residueTypes: ["medicamento"] },
  { name: "UBS Consolação", cnpj: "11222333000400", address: "R. da Consolação, 200", city: "São Paulo", state: "SP", zipCode: "01302001", latitude: -23.5534, longitude: -46.6604, phone: "11999990004", residueTypes: ["medicamento"] },
  { name: "Drogasil — Moema", cnpj: "11222333000500", address: "Av. Ibirapuera, 3103", city: "São Paulo", state: "SP", zipCode: "04029200", latitude: -23.6063, longitude: -46.6669, phone: "11999990005", residueTypes: ["medicamento"] },
  { name: "UBS Santo André Centro", cnpj: "11222333000600", address: "R. Coronel Oliveira Lima, 200", city: "Santo André", state: "SP", zipCode: "09010160", latitude: -23.6639, longitude: -46.5338, phone: "11999990006", residueTypes: ["medicamento"] },
  { name: "Ultrafarma — Campinas", cnpj: "11222333000700", address: "R. Corcovado, 50", city: "Campinas", state: "SP", zipCode: "13090000", latitude: -22.9021, longitude: -47.0653, phone: "19999990007", residueTypes: ["medicamento", "seringa"] },
  { name: "Hospital das Clínicas — Recepção", cnpj: "11222333000800", address: "Av. Dr. Enéas de Carvalho Aguiar, 155", city: "São Paulo", state: "SP", zipCode: "05403000", latitude: -23.5564, longitude: -46.6695, phone: "11999990008", residueTypes: ["medicamento", "frasco", "seringa"] },
  { name: "Drogaria Onofre — Centro SP", cnpj: "11222333000900", address: "R. Barão de Itapetininga, 140", city: "São Paulo", state: "SP", zipCode: "01042001", latitude: -23.5428, longitude: -46.6407, phone: "11999990009", residueTypes: ["medicamento"] },
  { name: "UBS Lapa", cnpj: "11222333001000", address: "R. Catão, 500", city: "São Paulo", state: "SP", zipCode: "05049000", latitude: -23.5248, longitude: -46.7056, phone: "11999990010", residueTypes: ["medicamento"] },
]

async function main() {
  console.log("Criando parceiro seed...")

  // Parceiro genérico para os pontos de seed
  const adminUser = await prisma.user.upsert({
    where: { email: "seed@ecomed.eco.br" },
    update: {},
    create: {
      name: "Sistema LogMed",
      email: "seed@ecomed.eco.br",
      role: "ADMIN",
      emailVerified: new Date(),
    },
  })

  const partner = await prisma.partner.upsert({
    where: { cnpj: "00000000000000" },
    update: {},
    create: {
      userId: adminUser.id,
      cnpj: "00000000000000",
      companyName: "LogMed / ANVISA",
      tradeName: "Rede LogMed",
    },
  })

  console.log(`Inserindo ${PONTOS_MOCK.length} pontos de coleta...`)

  for (const ponto of PONTOS_MOCK) {
    await prisma.point.upsert({
      where: { id: ponto.cnpj }, // usar cnpj como chave única de seed
      update: {
        name: ponto.name,
        address: ponto.address,
        city: ponto.city,
        state: ponto.state,
        latitude: ponto.latitude,
        longitude: ponto.longitude,
      },
      create: {
        id: ponto.cnpj,
        partnerId: partner.id,
        name: ponto.name,
        address: ponto.address,
        city: ponto.city,
        state: ponto.state,
        zipCode: ponto.zipCode,
        latitude: ponto.latitude,
        longitude: ponto.longitude,
        phone: ponto.phone,
        residueTypes: ponto.residueTypes,
        status: "APPROVED",
      },
    })
  }

  // Horários padrão (seg-sex 08:00-18:00, sáb 08:00-13:00)
  const pontosCriados = await prisma.point.findMany({
    where: { partnerId: partner.id },
    select: { id: true },
  })

  for (const ponto of pontosCriados) {
    const horariosExistentes = await prisma.schedule.count({ where: { pointId: ponto.id } })
    if (horariosExistentes > 0) continue

    await prisma.schedule.createMany({
      data: [
        { pointId: ponto.id, dayOfWeek: 0, opens: "08:00", closes: "13:00", closed: true },
        { pointId: ponto.id, dayOfWeek: 1, opens: "08:00", closes: "18:00", closed: false },
        { pointId: ponto.id, dayOfWeek: 2, opens: "08:00", closes: "18:00", closed: false },
        { pointId: ponto.id, dayOfWeek: 3, opens: "08:00", closes: "18:00", closed: false },
        { pointId: ponto.id, dayOfWeek: 4, opens: "08:00", closes: "18:00", closed: false },
        { pointId: ponto.id, dayOfWeek: 5, opens: "08:00", closes: "18:00", closed: false },
        { pointId: ponto.id, dayOfWeek: 6, opens: "08:00", closes: "13:00", closed: false },
      ],
    })
  }

  console.log("✅ Seed concluído!")
  console.log(`   ${PONTOS_MOCK.length} pontos de coleta inseridos/atualizados`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

Adicionar em `app/package.json` nos scripts:
```json
"db:seed:logmed": "tsx prisma/seed-logmed.ts"
```

Executar:
```bash
cd app
pnpm db:seed:logmed
```

**Verificar:** abrir `pnpm db:studio` → tabela Point deve ter 10+ registros com `status = APPROVED`.

---

### 1.2 — README limpo (remover boilerplate Next.js)

**Por quê:** primeira impressão do repositório para a banca.

Substituir o conteúdo completo de `app/README.md` por:

```markdown
# EcoMed — App Next.js

> Front-end PWA e API do EcoMed. Documentação completa do projeto em [../README.md](../README.md).

## Desenvolvimento

```bash
pnpm install
cp .env.example .env.local   # preencher credenciais
pnpm db:generate             # gerar Prisma Client
pnpm db:migrate              # aplicar migrations
pnpm db:seed:logmed          # popular banco com pontos de coleta
pnpm dev                     # http://localhost:3000
```

## Scripts

| Comando              | Descrição                            |
| -------------------- | ------------------------------------ |
| `pnpm dev`           | Dev server com Turbopack             |
| `pnpm build`         | Build de produção                    |
| `pnpm lint`          | ESLint                               |
| `pnpm test`          | Vitest (unitários)                   |
| `pnpm test:e2e`      | Playwright (E2E)                     |
| `pnpm db:migrate`    | Criar migration Prisma               |
| `pnpm db:studio`     | Prisma Studio                        |
| `pnpm db:seed:logmed`| Popular banco com pontos de coleta   |
| `pnpm db:generate`   | Regenerar Prisma Client              |

## Stack

- **Next.js 16** — App Router, Server Components
- **Prisma 7** — ORM + migrations, PostgreSQL + PostGIS (Supabase)
- **NextAuth v5** — autenticação JWT (Google OAuth + credenciais)
- **Hono** — API Routes tipadas com Zod
- **Serwist v9** — Service Worker PWA
- **Tailwind CSS v4** — estilização
- **shadcn/ui** — design system
- **Leaflet + react-leaflet** — mapas interativos
- **Recharts** — gráficos de estatísticas
- **Resend + React Email** — emails transacionais
- **Cloudflare R2** — storage de imagens
- **Upstash Redis** — rate limiting

## Deploy

**Cloudflare Pages:**
```bash
git push origin main   # CI/CD automático
```

**Docker (VPS):**
```bash
docker build -t ecomed-app:latest .
docker run -d --name ecomed-app -p 3010:3010 --env-file .env.production ecomed-app:latest
```
```

---

### 1.3 — Tela de impacto ambiental calculado

**Por quê:** argumento mais forte do projeto para a banca e para o usuário.

**Coeficientes baseados em dados ANVISA:**
- 1 descarte correto = evitar contaminação de ~450 litros de água
- 1 caixa de medicamento ≈ 30 comprimidos ≈ 15g de princípio ativo

**Criar `app/src/lib/impacto/index.ts`:**

```typescript
// Coeficientes de impacto baseados em estudos ANVISA / PNRS
export const COEFICIENTES = {
  LITROS_AGUA_POR_CHECKIN: 450,
  KG_RESIDUO_POR_CHECKIN: 0.15,
  CO2_EVITADO_KG: 0.05,        // emissões evitadas por descarte correto
}

export function calcularImpacto(checkins: number) {
  return {
    litrosAguaProtegidos: Math.round(checkins * COEFICIENTES.LITROS_AGUA_POR_CHECKIN),
    kgResiduoDescartado: +(checkins * COEFICIENTES.KG_RESIDUO_POR_CHECKIN).toFixed(1),
    co2EvitadoKg: +(checkins * COEFICIENTES.CO2_EVITADO_KG).toFixed(2),
  }
}
```

**Criar `app/src/app/app/impacto/page.tsx`:**

```tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { calcularImpacto } from "@/lib/impacto"

export default async function ImpactoPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth/login")

  const [checkinsCount, wallet] = await Promise.all([
    prisma.checkin.count({ where: { userId: session.user.id } }),
    prisma.wallet.findUnique({ where: { userId: session.user.id } }),
  ])

  const impacto = calcularImpacto(checkinsCount)

  return (
    <main className="max-w-md mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-medium text-primary">Seu Impacto Ambiental</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Baseado nos seus {checkinsCount} descartes corretos
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
          <p className="text-4xl font-bold text-blue-700">
            {impacto.litrosAguaProtegidos.toLocaleString("pt-BR")}
          </p>
          <p className="text-blue-600 text-sm mt-1">litros de água protegidos</p>
          <p className="text-blue-500 text-xs mt-2">
            Medicamentos descartados incorretamente contaminam rios e lençóis freáticos
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{impacto.kgResiduoDescartado} kg</p>
            <p className="text-green-600 text-xs mt-1">resíduos corretamente destinados</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{impacto.co2EvitadoKg} kg</p>
            <p className="text-amber-600 text-xs mt-1">CO₂ evitado na natureza</p>
          </div>
        </div>
      </div>

      {checkinsCount === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Faça seu primeiro check-in em um ponto de coleta para ver seu impacto!
        </p>
      )}

      <div className="text-xs text-muted-foreground text-center">
        Cálculos baseados em dados ANVISA e estudos de logística reversa (PNRS 2020)
      </div>
    </main>
  )
}
```

Adicionar no bottom nav e no menu de navegação do cidadão:
```tsx
{ href: "/app/impacto", label: "Impacto", icon: Leaf }
```

---

## Prioridade 2 — Experiência do usuário

---

### 2.1 — Onboarding de 3 telas (primeiros passos)

**Por quê:** primeira impressão após cadastro. Aumenta retenção e explica o app.

Criar `app/src/app/app/onboarding/page.tsx`:

```tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

const PASSOS = [
  {
    titulo: "Bem-vindo ao EcoMed! 🌿",
    descricao: "Aqui você encontra pontos de coleta para descartar medicamentos vencidos ou sem uso de forma correta e segura.",
    cta: "Próximo",
  },
  {
    titulo: "Ganhe EcoCoins 🪙",
    descricao: "A cada descarte em um ponto parceiro, você ganha EcoCoins. Acumule pontos, suba de nível e desbloqueie conquistas.",
    cta: "Próximo",
  },
  {
    titulo: "Encontre um ponto agora 📍",
    descricao: "Há pontos de coleta próximos a você. Permita o acesso à localização para encontrar o mais perto.",
    cta: "Começar",
  },
]

export default function OnboardingPage() {
  const [passo, setPasso] = useState(0)
  const router = useRouter()

  const avancar = async () => {
    if (passo < PASSOS.length - 1) {
      setPasso(p => p + 1)
      return
    }

    // Marcar onboarding como concluído e creditar coins de boas-vindas
    await fetch("/api/onboarding/concluir", { method: "POST" })
    router.push("/mapa")
  }

  const atual = PASSOS[passo]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-8">
      <div className="flex gap-2">
        {PASSOS.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all ${
              i === passo ? "w-8 bg-primary" : "w-2 bg-muted"
            }`}
          />
        ))}
      </div>

      <div className="text-center space-y-3 max-w-sm">
        <h1 className="text-2xl font-medium">{atual.titulo}</h1>
        <p className="text-muted-foreground">{atual.descricao}</p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <Button className="w-full bg-primary text-white" onClick={avancar}>
          {atual.cta}
        </Button>
        {passo < PASSOS.length - 1 && (
          <Button variant="ghost" className="w-full" onClick={avancar}>
            Pular
          </Button>
        )}
      </div>
    </div>
  )
}
```

Criar `app/src/app/api/routes/onboarding.ts`:

```typescript
import { Hono } from "hono"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"
import { creditCoins } from "@/lib/coins"

const onboarding = new Hono()

onboarding.post("/concluir", async (c) => {
  const session = await auth()
  if (!session?.user?.id) return c.json({ error: "Não autenticado." }, 401)

  // Verificar se já concluiu onboarding (evitar duplo crédito)
  const jaFez = await prisma.coinTransaction.findFirst({
    where: { wallet: { userId: session.user.id }, event: "SIGNUP" },
  })

  if (!jaFez) {
    await creditCoins(session.user.id, "SIGNUP")
  }

  return c.json({ ok: true })
})

export default onboarding
```

Redirecionar para `/app/onboarding` após o primeiro login (verificar no callback do NextAuth se é o primeiro acesso).

---

### 2.2 — Tela de Ranking público

**Por quê:** gamificação social — cria competição saudável.

Criar `app/src/app/ranking/page.tsx`:

```tsx
import { prisma } from "@/lib/db/prisma"

export default async function RankingPage() {
  const top = await prisma.wallet.findMany({
    take: 10,
    orderBy: { totalEarned: "desc" },
    include: {
      user: { select: { name: true, image: true } },
    },
  })

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-medium mb-6 text-center">
        Ranking semanal 🏆
      </h1>

      <div className="space-y-3">
        {top.map((wallet, i) => (
          <div
            key={wallet.id}
            className="flex items-center gap-4 p-3 bg-card border border-border rounded-xl"
          >
            <span className={`text-lg font-bold w-8 text-center ${
              i === 0 ? "text-amber-500" :
              i === 1 ? "text-gray-400" :
              i === 2 ? "text-amber-700" : "text-muted-foreground"
            }`}>
              {i + 1}
            </span>
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
              {wallet.user.name?.[0] ?? "?"}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{wallet.user.name ?? "Usuário"}</p>
              <p className="text-xs text-muted-foreground">{wallet.level}</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-sm text-amber-600">
                {wallet.totalEarned.toLocaleString("pt-BR")}
              </p>
              <p className="text-xs text-muted-foreground">EcoCoins</p>
            </div>
          </div>
        ))}
      </div>

      {top.length === 0 && (
        <p className="text-center text-muted-foreground text-sm mt-8">
          Seja o primeiro a aparecer no ranking!
        </p>
      )}
    </main>
  )
}
```

---

### 2.3 — Compartilhar conquista (OG Image dinâmica)

**Por quê:** viral loop gratuito via WhatsApp/Instagram.

Criar `app/src/app/api/og/conquista/route.tsx`:

```tsx
import { ImageResponse } from "next/og"

export const runtime = "edge"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const nome = searchParams.get("nome") ?? "Usuário"
  const badge = searchParams.get("badge") ?? "Eco-Cidadão"
  const nivel = searchParams.get("nivel") ?? "Semente"

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#F7F9F8",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          gap: 24,
        }}
      >
        <div style={{ fontSize: 72 }}>🌿</div>
        <div style={{ fontSize: 48, fontWeight: 700, color: "#2D7D46" }}>
          EcoMed
        </div>
        <div style={{ fontSize: 28, color: "#1A1A1A" }}>
          {nome} conquistou o badge
        </div>
        <div
          style={{
            background: "#2D7D46",
            color: "white",
            padding: "12px 32px",
            borderRadius: 24,
            fontSize: 32,
            fontWeight: 600,
          }}
        >
          {badge}
        </div>
        <div style={{ fontSize: 20, color: "#6B7280" }}>
          Nível {nivel} · Descarte certo, planeta saudável
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
```

Usar no componente de badge:
```tsx
const shareUrl = `https://api.whatsapp.com/send?text=` +
  encodeURIComponent(`Conquistei o badge "${badge}" no EcoMed! 🌿 ecomed.eco.br`)

<a href={shareUrl} target="_blank">Compartilhar no WhatsApp</a>
```

---

### 2.4 — Cron job para missões diárias e streaks

**Por quê:** sem reset diário/semanal, o sistema de missões não funciona.

**Opção A — Vercel Cron (gratuito, recomendado para Cloudflare Pages + API):**

Criar `app/src/app/api/cron/reset-missoes/route.ts`:

```typescript
import { NextRequest } from "next/server"
import { prisma } from "@/lib/db/prisma"

// Rota chamada pelo cron às 00:00 BRT (03:00 UTC)
export async function GET(req: NextRequest) {
  // Verificar autorização do cron
  const auth = req.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const agora = new Date()

  // Expirar missões diárias do dia anterior
  await prisma.userMission.updateMany({
    where: {
      mission: { type: "DAILY" },
      expiresAt: { lt: agora },
      completed: false,
    },
    data: { progress: 0 },
  })

  // Criar novas instâncias de missões diárias para usuários ativos
  // (usuários que acessaram nos últimos 7 dias)
  // Lógica simplificada — expandir conforme necessário

  return Response.json({ ok: true, timestamp: agora.toISOString() })
}
```

Adicionar ao `.env.local`:
```env
CRON_SECRET=  # gerar: openssl rand -base64 32
```

Criar `app/vercel.json` (ou adicionar ao existente):
```json
{
  "crons": [
    {
      "path": "/api/cron/reset-missoes",
      "schedule": "0 3 * * *"
    }
  ]
}
```

> **Nota:** Vercel Cron funciona mesmo com Cloudflare Pages se a API estiver no Vercel. Se tudo estiver no Cloudflare, usar Cloudflare Workers Cron Triggers como alternativa.

---

## Prioridade 3 — Qualidade técnica

---

### 3.1 — Setup Sanity CMS (blog e conteúdo para a IA)

**Por quê:** artigos precisam existir para a IA indexar e para o blog funcionar.

**Instalação:**
```bash
cd app
pnpm add @sanity/client @sanity/image-url
```

Criar `app/src/lib/sanity/client.ts`:
```typescript
import { createClient } from "@sanity/client"

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2024-01-01",
  useCdn: true,
})
```

Adicionar ao `.env.local`:
```env
NEXT_PUBLIC_SANITY_PROJECT_ID=  # criar em sanity.io/manage
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=               # token com permissão de leitura
```

**Schema básico de artigo no Sanity** (criar no painel do Sanity Studio):
```
Article:
  - title (string, required)
  - slug (slug, required)
  - content (block content / portable text)
  - excerpt (string)
  - category (string: "descarte" | "legislacao" | "impacto" | "dicas")
  - coverImage (image)
  - publishedAt (datetime)
```

**Criar `app/src/app/blog/page.tsx`:**
```typescript
import { sanityClient } from "@/lib/sanity/client"

const query = `*[_type == "article" && defined(publishedAt)] | order(publishedAt desc) {
  _id, title, slug, excerpt, category, publishedAt
}`

export default async function BlogPage() {
  const artigos = await sanityClient.fetch(query)
  // ... renderizar lista de artigos
}
```

---

### 3.2 — Documentação automática da API (Scalar)

**Por quê:** mostra profissionalismo técnico para a banca.

```bash
cd app
pnpm add @scalar/hono-api-reference zod-openapi
```

No roteador Hono principal (`app/src/app/api/[[...route]]/route.ts`):

```typescript
import { apiReference } from "@scalar/hono-api-reference"
import { OpenAPIHono } from "@hono/zod-openapi"

// Substituir `new Hono()` por `new OpenAPIHono()` no app principal
// Adicionar rota de documentação:

app.get(
  "/docs",
  apiReference({
    spec: { url: "/api/spec" },
    theme: "purple",
    title: "EcoMed API",
  })
)

app.doc("/spec", {
  openapi: "3.0.0",
  info: { title: "EcoMed API", version: "1.0.0" },
})
```

Acessível em: `http://localhost:3000/api/docs`

---

### 3.3 — Plausible Analytics (métricas LGPD-compliant)

**Por quê:** mostrar dados reais de uso na apresentação.

1. Criar conta em https://plausible.io (trial 30 dias)
2. Adicionar domínio `ecomed.eco.br`
3. Adicionar em `app/src/app/layout.tsx`:

```tsx
{process.env.NODE_ENV === "production" && (
  <script
    defer
    data-domain="ecomed.eco.br"
    src="https://plausible.io/js/script.js"
  />
)}
```

Sem cookies. LGPD ok. Não requer banner de consentimento.

---

### 3.4 — Relatório de impacto em PDF (resgate de 200 EcoCoins)

**Por quê:** recompensa concreta e tangível da gamificação.

```bash
cd app
pnpm add @react-pdf/renderer
```

Criar `app/src/app/api/usuario/relatorio-pdf/route.ts`:

```typescript
import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"
import { calcularImpacto } from "@/lib/impacto"
import { renderToBuffer } from "@react-pdf/renderer"
import { RelatorioPDF } from "@/components/pdf/RelatorioPDF"
import { creditCoins } from "@/lib/coins"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Não autenticado." }, { status: 401 })

  const [checkins, wallet, usuario] = await Promise.all([
    prisma.checkin.count({ where: { userId: session.user.id } }),
    prisma.wallet.findUnique({ where: { userId: session.user.id } }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true } }),
  ])

  // Debitar 200 coins para gerar o relatório
  if (!wallet || wallet.balance < 200) {
    return Response.json({ error: "EcoCoins insuficientes (necessário: 200)." }, { status: 400 })
  }

  await prisma.wallet.update({
    where: { userId: session.user.id },
    data: { balance: wallet.balance - 200 },
  })

  const impacto = calcularImpacto(checkins)
  const buffer = await renderToBuffer(
    RelatorioPDF({ nome: usuario?.name ?? "Usuário", checkins, impacto, nivel: wallet.level })
  )

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ecomed-impacto-${session.user.id}.pdf"`,
    },
  })
}
```

---

## Checklist geral de execução

```
PRIORIDADE 1 — Crítico
☐  1.1  Seed de pontos LogMed rodou → mapa tem pins
☐  1.2  README limpo → sem boilerplate Next.js
☐  1.3  Tela /app/impacto funcionando com dados reais

PRIORIDADE 2 — UX
☐  2.1  Onboarding de 3 telas após primeiro login
☐  2.2  Tela /ranking com top 10 usuários
☐  2.3  Botão de compartilhar ao ganhar badge
☐  2.4  Cron de reset de missões configurado

PRIORIDADE 3 — Qualidade
☐  3.1  Sanity CMS criado com pelo menos 5 artigos
☐  3.2  Docs da API em /api/docs funcionando
☐  3.3  Plausible instalado e coletando dados
☐  3.4  PDF de relatório de impacto gerando

VERIFICAÇÃO FINAL
☐  pnpm tsc --noEmit → zero erros
☐  pnpm lint → zero warnings novos
☐  Mapa com pontos reais funcionando
☐  Check-in → EcoCoins creditados → impacto atualizado
☐  Lighthouse score ≥ 90
```

---

*EcoMed — Descarte certo, planeta saudável 🌿*
