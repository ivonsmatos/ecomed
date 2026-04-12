# Prompt para IA — Implementar QR Check-in no EcoMed

## Contexto do projeto

Você está trabalhando no repositório **https://github.com/ivonsmatos/ecomed** — monorepo com:
- `app/` → Next.js 16, App Router, Prisma 7, NextAuth v5, Hono, Tailwind v4, shadcn/ui, pnpm
- `ia/` → FastAPI + Ollama (não tocar nesta sessão)

O projeto é uma PWA de descarte correto de medicamentos com sistema de gamificação (EcoCoins).

## Sua tarefa nesta sessão

Implementar o sistema de **QR Check-in** — quando um cidadão descarta medicamentos num ponto de coleta parceiro, o parceiro escaneia o QR Code do cidadão e EcoCoins são creditados automaticamente.

Esta implementação é **100% aditiva**: nenhum arquivo existente será removido ou alterado de forma destrutiva. Apenas adições.

---

## Regras de execução — LEIA ANTES DE COMEÇAR

1. **Execute um passo por vez.** Confirme que funcionou antes de avançar.
2. **Se um comando falhar**, PARE, explique o erro e aguarde instrução. Não tente contornar silenciosamente.
3. **Nunca altere** `auth.ts`, `middleware.ts`, arquivos de rotas existentes (só adicionar a eles), ou qualquer página já funcionando.
4. **Trabalhe sempre dentro da pasta `app/`** salvo quando indicado.
5. Ao criar arquivos, use os caminhos exatos indicados. Não invente alternativas.
6. Após cada passo de código, rode `pnpm tsc --noEmit` para verificar tipos antes de avançar.

---

## Passo 1 — Instalar dependências

```bash
cd app
pnpm add react-qr-code html5-qrcode canvas-confetti react-circular-progressbar
pnpm add -D @types/canvas-confetti
```

**Verificar:** `cat app/package.json | grep -E "react-qr-code|html5-qrcode|canvas-confetti"` deve retornar as 3 linhas.

---

## Passo 2 — Adicionar variável de ambiente

No arquivo `app/.env.local`, adicionar:

```env
QR_HMAC_SECRET=  # gerar com: openssl rand -base64 32
```

Gerar o valor:
```bash
openssl rand -base64 32
```

Colar o resultado gerado no `.env.local`.

**Também adicionar no `app/.env.example`** (sem o valor real):
```env
QR_HMAC_SECRET=  # chave para assinar tokens QR — gerar: openssl rand -base64 32
```

---

## Passo 3 — Atualizar o schema Prisma

Abrir `app/prisma/schema.prisma`.

### 3a. Adicionar o model Checkin

Colar **no final do arquivo**, antes do fechamento (se houver):

```prisma
model Checkin {
  id          String   @id @default(cuid())
  userId      String
  pointId     String
  coinsEarned Int      @default(10)
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  point       Point    @relation(fields: [pointId], references: [id], onDelete: Cascade)

  @@unique([userId, pointId, createdAt])
}
```

### 3b. Adicionar relação no model User

Dentro do `model User`, na lista de relações, adicionar:
```prisma
  checkins     Checkin[]
```

### 3c. Adicionar relação no model Point

Dentro do `model Point`, na lista de relações, adicionar:
```prisma
  checkins     Checkin[]
```

### 3d. Rodar a migration

```bash
cd app
pnpm prisma migrate dev --name add-checkin
```

**Verificar:** o comando deve terminar com "Your database is now in sync with your schema." Se pedir nome da migration, usar `add-checkin`.

---

## Passo 4 — Criar lib de coins

Criar o arquivo `app/src/lib/coins/index.ts` com o conteúdo exato:

```typescript
import { prisma } from "@/lib/db/prisma"

export function calcularNivel(totalEarned: number): "SEMENTE" | "BROTO" | "ARVORE" | "GUARDIAO" {
  if (totalEarned <= 100) return "SEMENTE"
  if (totalEarned <= 500) return "BROTO"
  if (totalEarned <= 2000) return "ARVORE"
  return "GUARDIAO"
}

const LIMITES_DIARIOS: Record<string, number> = {
  ARTICLE_READ: 5,
  REPORT_SUBMITTED: 3,
  CHECKIN: 3,
}

export async function verificarLimiteDiario(
  userId: string,
  event: string
): Promise<boolean> {
  const limite = LIMITES_DIARIOS[event]
  if (!limite) return true

  const inicio = new Date()
  inicio.setHours(0, 0, 0, 0)

  const count = await prisma.coinTransaction.count({
    where: {
      wallet: { userId },
      event: event as any,
      createdAt: { gte: inicio },
    },
  })

  return count < limite
}

const COIN_VALUES: Record<string, number> = {
  SIGNUP: 20,
  ARTICLE_READ: 2,
  REPORT_SUBMITTED: 5,
  STREAK_7_DAYS: 15,
  REFERRAL: 20,
  CHECKIN: 10,
}

export async function creditCoins(
  userId: string,
  event: string,
  reference?: string,
  customAmount?: number
): Promise<{ ok: boolean; newBalance: number; levelUp?: string }> {
  const amount = customAmount ?? COIN_VALUES[event] ?? 0
  if (amount <= 0) return { ok: false, newBalance: 0 }

  const dentroDoLimite = await verificarLimiteDiario(userId, event)
  if (!dentroDoLimite) return { ok: false, newBalance: 0 }

  let wallet = await prisma.wallet.findUnique({ where: { userId } })
  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: { userId, balance: 0, totalEarned: 0, level: "SEMENTE" },
    })
  }

  const novoBalance = wallet.balance + amount
  const novoTotal = wallet.totalEarned + amount
  const novoNivel = calcularNivel(novoTotal)
  const levelUp = novoNivel !== wallet.level ? novoNivel : undefined

  await Promise.all([
    prisma.wallet.update({
      where: { userId },
      data: {
        balance: novoBalance,
        totalEarned: novoTotal,
        level: novoNivel as any,
      },
    }),
    prisma.coinTransaction.create({
      data: {
        walletId: wallet.id,
        amount,
        event: event as any,
        reference,
        note: `${event}${reference ? ` · ${reference}` : ""}`,
      },
    }),
  ])

  return { ok: true, newBalance: novoBalance, levelUp }
}
```

**Verificar:** `pnpm tsc --noEmit` sem erros.

---

## Passo 5 — Criar lib de token QR (HMAC)

Criar o arquivo `app/src/lib/qr/token.ts`:

```typescript
import crypto from "crypto"

const SECRET = process.env.QR_HMAC_SECRET ?? process.env.NEXTAUTH_SECRET ?? "dev-fallback"

export function gerarTokenQR(userId: string): string {
  const ts = Math.floor(Date.now() / 1000)
  const payload = `${userId}:${ts}`
  const hmac = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("hex")
    .slice(0, 16)
  return `${payload}:${hmac}`
}

// Retorna { userId } se válido, null se inválido ou expirado
export function validarTokenQR(token: string): { userId: string } | null {
  const parts = token.split(":")
  if (parts.length !== 3) return null

  const [userId, tsStr, hmacRecebido] = parts
  const ts = parseInt(tsStr, 10)
  if (isNaN(ts)) return null

  const agora = Math.floor(Date.now() / 1000)
  if (agora - ts > 300) return null // expira em 5 minutos

  const payload = `${userId}:${tsStr}`
  const hmacEsperado = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("hex")
    .slice(0, 16)

  if (hmacRecebido !== hmacEsperado) return null
  return { userId }
}
```

**Verificar:** `pnpm tsc --noEmit` sem erros.

---

## Passo 6 — Criar API route: GET /api/qr/meu-codigo

Criar o arquivo `app/src/app/api/routes/qr.ts`:

```typescript
import { Hono } from "hono"
import { auth } from "@/auth"
import { gerarTokenQR } from "@/lib/qr/token"

const qr = new Hono()

qr.get("/meu-codigo", async (c) => {
  const session = await auth()
  if (!session?.user?.id) return c.json({ error: "Não autenticado." }, 401)
  const token = gerarTokenQR(session.user.id)
  return c.json({ token })
})

export default qr
```

---

## Passo 7 — Criar API route: POST /api/checkin

Criar o arquivo `app/src/app/api/routes/checkin.ts`:

```typescript
import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"
import { validarTokenQR } from "@/lib/qr/token"
import { creditCoins } from "@/lib/coins"
import { checkRateLimit } from "@/lib/ratelimit"

const checkin = new Hono()

const checkinSchema = z.object({
  token: z.string().min(10),
  pointId: z.string().cuid(),
})

checkin.post("/", zValidator("json", checkinSchema), async (c) => {
  const ip = c.req.header("CF-Connecting-IP") ?? "anon"
  const { success } = await checkRateLimit("map", ip)
  if (!success) return c.json({ error: "Muitas requisições." }, 429)

  const session = await auth()
  if (!session?.user?.id) return c.json({ error: "Não autenticado." }, 401)
  if (session.user.role !== "PARTNER" && session.user.role !== "ADMIN") {
    return c.json({ error: "Apenas parceiros podem registrar check-ins." }, 403)
  }

  const { token, pointId } = c.req.valid("json")

  const parsed = validarTokenQR(token)
  if (!parsed) {
    return c.json(
      { error: "QR Code inválido ou expirado. Peça ao usuário gerar um novo." },
      400
    )
  }
  const { userId } = parsed

  // Parceiro só pode usar pontos aprovados da sua conta (admin passa direto)
  let point = await prisma.point.findFirst({
    where: {
      id: pointId,
      status: "APPROVED",
      partner: { userId: session.user.id },
    },
  })

  if (!point && session.user.role === "ADMIN") {
    point = await prisma.point.findUnique({
      where: { id: pointId, status: "APPROVED" },
    })
  }

  if (!point) return c.json({ error: "Ponto não encontrado ou sem permissão." }, 404)

  // Anti-abuso: 1 check-in por usuário por ponto por dia
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const amanha = new Date(hoje)
  amanha.setDate(amanha.getDate() + 1)

  const checkinHoje = await prisma.checkin.findFirst({
    where: { userId, pointId, createdAt: { gte: hoje, lt: amanha } },
  })

  if (checkinHoje) {
    return c.json(
      { error: "Este usuário já realizou check-in neste ponto hoje.", code: "DUPLICATE_CHECKIN" },
      409
    )
  }

  const [, coinResult] = await Promise.all([
    prisma.checkin.create({ data: { userId, pointId, coinsEarned: 10 } }),
    creditCoins(userId, "CHECKIN", pointId),
  ])

  const usuario = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  })

  return c.json({
    ok: true,
    coinsEarned: 10,
    newBalance: coinResult.newBalance,
    levelUp: coinResult.levelUp ?? null,
    userName: usuario?.name ?? "Usuário",
    pointName: point.name,
  })
})

export default checkin
```

---

## Passo 8 — Registrar as novas rotas no roteador Hono principal

Abrir `app/src/app/api/[[...route]]/route.ts`.

**Adicionar os imports** no topo (após os imports existentes):
```typescript
import qr from "./routes/qr"
import checkin from "./routes/checkin"
```

**Adicionar as rotas** (após as rotas existentes, antes dos exports):
```typescript
app.route("/qr", qr)
app.route("/checkin", checkin)
```

**Verificar:** `pnpm tsc --noEmit` sem erros.

Testar manualmente:
```bash
curl http://localhost:3000/api/health
# deve retornar {"status":"ok",...}
```

---

## Passo 9 — Componente QRCodeDisplay (cidadão)

Criar `app/src/components/coins/QRCodeDisplay.tsx`:

```tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import QRCode from "react-qr-code"
import { Button } from "@/components/ui/button"

export function QRCodeDisplay() {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [expiraEm, setExpiraEm] = useState(300)

  const buscarToken = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/qr/meu-codigo")
      if (!res.ok) throw new Error()
      const data = await res.json()
      setToken(data.token)
      setExpiraEm(300)
    } catch {
      setToken(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { buscarToken() }, [buscarToken])

  useEffect(() => {
    if (!token) return
    const interval = setInterval(() => {
      setExpiraEm(prev => {
        if (prev <= 1) { buscarToken(); return 300 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [token, buscarToken])

  const min = Math.floor(expiraEm / 60)
  const seg = expiraEm % 60

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 p-6">
        <div className="w-48 h-48 bg-gray-100 animate-pulse rounded-lg" />
        <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="flex flex-col items-center gap-3 p-6">
        <p className="text-sm text-muted-foreground">Erro ao gerar QR Code.</p>
        <Button variant="outline" size="sm" onClick={buscarToken}>Tentar novamente</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <p className="text-sm text-muted-foreground text-center">
        Mostre este QR Code ao parceiro no momento do descarte
      </p>
      <div className="bg-white p-4 rounded-xl border border-border">
        <QRCode
          value={token}
          size={192}
          fgColor="#2D7D46"
          level="M"
        />
      </div>
      <p className={`text-sm ${expiraEm < 60 ? "text-red-500" : "text-muted-foreground"}`}>
        Expira em {min}:{seg.toString().padStart(2, "0")}
      </p>
      <Button variant="outline" size="sm" onClick={buscarToken}>
        Renovar QR Code
      </Button>
      <p className="text-xs text-muted-foreground text-center max-w-xs">
        Não compartilhe este QR com outras pessoas.
      </p>
    </div>
  )
}
```

**Verificar:** `pnpm tsc --noEmit` sem erros.

---

## Passo 10 — Página do scanner (parceiro)

Criar `app/src/app/parceiro/scanner/page.tsx`:

```tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"

// Import dinâmico — html5-qrcode só funciona no browser
const Html5QrcodeScanner = dynamic(
  () => import("html5-qrcode").then(m => ({ default: m.Html5Qrcode })),
  { ssr: false }
)

type CheckinResult = {
  ok: boolean
  coinsEarned: number
  userName: string
  pointName: string
  levelUp?: string | null
}

export default function ScannerPage() {
  const { data: session } = useSession()
  const [pointId, setPointId] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [resultado, setResultado] = useState<CheckinResult | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const scannerRef = useRef<any>(null)

  // Buscar ponto do parceiro logado
  useEffect(() => {
    if (!session?.user?.id) return
    fetch("/api/parceiro/meu-ponto")
      .then(r => r.ok ? r.json() : null)
      .then(data => setPointId(data?.id ?? null))
  }, [session])

  const pararScanner = async () => {
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop()
        scannerRef.current.clear()
      }
    } catch { /* ignorar */ }
    setScanning(false)
  }

  const iniciarScanner = async () => {
    setResultado(null)
    setErro(null)
    setScanning(true)

    try {
      const { Html5Qrcode } = await import("html5-qrcode")
      const scanner = new Html5Qrcode("qr-reader")
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decoded: string) => {
          await pararScanner()
          await processarCheckin(decoded)
        },
        () => {}
      )
    } catch {
      setErro("Não foi possível acessar a câmera. Verifique as permissões.")
      setScanning(false)
    }
  }

  const processarCheckin = async (token: string) => {
    if (!pointId) {
      setErro("Nenhum ponto aprovado associado a esta conta.")
      return
    }

    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, pointId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErro(
          data.code === "DUPLICATE_CHECKIN"
            ? "Este usuário já fez check-in neste ponto hoje."
            : data.error ?? "Erro ao processar check-in."
        )
        return
      }

      setResultado(data)

      // Confetti ao creditar — import dinâmico para não quebrar SSR
      const confetti = (await import("canvas-confetti")).default
      confetti({
        particleCount: 80,
        spread: 60,
        colors: ["#2D7D46", "#4CAF73", "#F5A623"],
        origin: { y: 0.6 },
      })
    } catch {
      setErro("Erro de conexão. Tente novamente.")
    }
  }

  useEffect(() => () => { pararScanner() }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-6">

      <div className="text-center">
        <h1 className="text-xl font-medium">Scanner de Check-in</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Aponte a câmera para o QR Code do cidadão
        </p>
        {!pointId && (
          <p className="text-xs text-amber-600 mt-2">
            Nenhum ponto aprovado encontrado. Verifique o painel.
          </p>
        )}
      </div>

      <div
        id="qr-reader"
        className="w-full max-w-sm rounded-xl overflow-hidden"
        style={{ minHeight: scanning ? 300 : 0 }}
      />

      {resultado && (
        <div className="w-full max-w-sm bg-green-50 border border-green-200 rounded-xl p-5 text-center">
          <p className="text-green-700 font-medium text-lg">Check-in registrado!</p>
          <p className="text-green-600 mt-1 font-medium">{resultado.userName}</p>
          <p className="text-green-600 text-sm mt-1">
            +{resultado.coinsEarned} EcoCoins creditados
          </p>
          {resultado.levelUp && (
            <p className="text-amber-600 text-sm mt-2 font-medium">
              Subiu para o nível {resultado.levelUp}!
            </p>
          )}
          <p className="text-muted-foreground text-xs mt-2">{resultado.pointName}</p>
        </div>
      )}

      {erro && (
        <div className="w-full max-w-sm bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-red-700 text-sm">{erro}</p>
        </div>
      )}

      <div className="flex gap-3">
        {!scanning ? (
          <Button
            onClick={iniciarScanner}
            disabled={!pointId}
            className="bg-primary text-white"
          >
            Escanear QR Code
          </Button>
        ) : (
          <Button variant="outline" onClick={pararScanner}>
            Parar scanner
          </Button>
        )}
        {(resultado || erro) && (
          <Button variant="outline" onClick={iniciarScanner}>
            Novo scan
          </Button>
        )}
      </div>

    </div>
  )
}
```

**Verificar:** `pnpm tsc --noEmit` sem erros.

---

## Passo 11 — Adicionar QR Code no perfil do cidadão

Abrir `app/src/app/app/perfil/page.tsx`.

**Adicionar o import** no topo:
```tsx
import { QRCodeDisplay } from "@/components/coins/QRCodeDisplay"
```

**Adicionar a seção** dentro do JSX, após o conteúdo existente (antes do `</main>` ou do componente pai):
```tsx
<section className="mt-8">
  <h2 className="text-base font-medium mb-2">Meu QR Code de descarte</h2>
  <p className="text-sm text-muted-foreground mb-4">
    Apresente ao parceiro no momento do descarte para ganhar EcoCoins.
  </p>
  <QRCodeDisplay />
</section>
```

---

## Passo 12 — Adicionar rota /api/parceiro/meu-ponto

Se já existir o arquivo de rotas do parceiro (`app/src/app/api/routes/parceiro.ts`), adicionar dentro do router:

```typescript
parceiroRouter.get("/meu-ponto", async (c) => {
  const session = await auth()
  if (!session?.user?.id) return c.json({ error: "Não autenticado." }, 401)

  const point = await prisma.point.findFirst({
    where: {
      partner: { userId: session.user.id },
      status: "APPROVED",
    },
    select: { id: true, name: true, status: true },
  })

  if (!point) return c.json({ error: "Nenhum ponto aprovado." }, 404)
  return c.json(point)
})
```

Se o arquivo ainda não existir, criar `app/src/app/api/routes/parceiro.ts` com:

```typescript
import { Hono } from "hono"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"

const parceiroRouter = new Hono()

parceiroRouter.get("/meu-ponto", async (c) => {
  const session = await auth()
  if (!session?.user?.id) return c.json({ error: "Não autenticado." }, 401)

  const point = await prisma.point.findFirst({
    where: {
      partner: { userId: session.user.id },
      status: "APPROVED",
    },
    select: { id: true, name: true, status: true },
  })

  if (!point) return c.json({ error: "Nenhum ponto aprovado." }, 404)
  return c.json(point)
})

export default parceiroRouter
```

Depois registrar no roteador principal (`app/src/app/api/[[...route]]/route.ts`):
```typescript
import parceiroRouter from "./routes/parceiro"
// ...
app.route("/parceiro", parceiroRouter)
```

---

## Passo 13 — Adicionar link para o scanner no menu do parceiro

Abrir o componente de navegação do parceiro (provavelmente `src/components/layout/` ou dentro do layout `src/app/parceiro/layout.tsx`).

Adicionar o item:
```tsx
{ href: "/parceiro/scanner", label: "Scanner de Check-in" }
```

---

## Verificação final — testar tudo junto

Com `pnpm dev` rodando:

```
☐ Acessar /app/perfil como cidadão → QR Code aparece com contador regressivo
☐ Após 5 min o QR renova automaticamente
☐ Botão "Renovar QR Code" gera um novo token
☐ Acessar /parceiro/scanner como parceiro → câmera pede permissão
☐ Escanear o QR do cidadão → "Check-in registrado!" + confetti aparecem
☐ Escanear o mesmo QR de novo no mesmo dia → "Já fez check-in hoje"
☐ Verificar no Prisma Studio: tabela Checkin tem o registro
☐ Verificar no Prisma Studio: Wallet do cidadão tem +10 no balance
☐ Verificar no Prisma Studio: CoinTransaction com event="CHECKIN" registrada
☐ pnpm tsc --noEmit → zero erros
☐ pnpm lint → zero warnings novos
```

---

## Em caso de erro

| Erro | Causa provável | Solução |
|---|---|---|
| `Cannot find module 'react-qr-code'` | pnpm install não rodou | `pnpm install` na pasta app/ |
| `prisma: field 'checkins' not found` | Migration não aplicada | `pnpm prisma migrate dev` |
| `QR_HMAC_SECRET is undefined` | Variável não adicionada | Verificar .env.local |
| `Camera not accessible` | HTTPS necessário | Usar localhost (dev) ou configurar HTTPS |
| `html5-qrcode SSR error` | Import não dinâmico | Garantir que o import usa `dynamic()` com `ssr: false` |
| TypeScript errors em `event: event as any` | Enum CoinEvent não tem CHECKIN | Adicionar `CHECKIN` ao enum no schema.prisma |
