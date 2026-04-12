# EcoMed — QR Check-in: Implementação Completa

Tudo que precisa ser feito. Executar na ordem.

---

## Passo 1 — Instalar os dois pacotes

```bash
cd app
pnpm add react-qr-code html5-qrcode canvas-confetti react-circular-progressbar
pnpm add -D @types/canvas-confetti
```

---

## Passo 2 — Adicionar model Checkin ao schema.prisma

Colar **dentro** de `prisma/schema.prisma`, antes do último `}` do arquivo:

```prisma
model Checkin {
  id        String   @id @default(cuid())
  userId    String
  pointId   String
  coinsEarned Int    @default(10)
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  point     Point    @relation(fields: [pointId], references: [id], onDelete: Cascade)

  // Anti-abuso: 1 check-in por usuário por ponto por dia
  @@unique([userId, pointId, createdAt])
}
```

Adicionar no `model User` (dentro da lista de relações existentes):
```prisma
  checkins     Checkin[]
```

Adicionar no `model Point`:
```prisma
  checkins     Checkin[]
```

Rodar a migration:
```bash
pnpm prisma migrate dev --name add-checkin
```

---

## Passo 3 — Lógica de crédito de coins

Criar `src/lib/coins/index.ts` (ou adicionar a este arquivo se já existir):

```typescript
import { prisma } from "@/lib/db/prisma"

// Calcular nível baseado no total ganho
export function calcularNivel(totalEarned: number) {
  if (totalEarned <= 100) return "SEMENTE"
  if (totalEarned <= 500) return "BROTO"
  if (totalEarned <= 2000) return "ARVORE"
  return "GUARDIAO"
}

// Limite diário por evento (anti-abuso)
const LIMITES_DIARIOS: Partial<Record<string, number>> = {
  ARTICLE_READ: 5,
  REPORT_SUBMITTED: 3,
  CHECKIN: 3,  // até 3 pontos diferentes por dia
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

// Valores de cada evento
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

  // Verificar limite diário
  const dentroDoLimite = await verificarLimiteDiario(userId, event)
  if (!dentroDoLimite) return { ok: false, newBalance: 0 }

  // Buscar ou criar carteira
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

  // Atualizar carteira e registrar transação em paralelo
  await Promise.all([
    prisma.wallet.update({
      where: { userId },
      data: { balance: novoBalance, totalEarned: novoTotal, level: novoNivel as any },
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

---

## Passo 4 — Gerar token HMAC para o QR

Criar `src/lib/qr/token.ts`:

```typescript
import crypto from "crypto"

const SECRET = process.env.QR_HMAC_SECRET ?? process.env.NEXTAUTH_SECRET ?? "fallback"

// Gerar payload assinado: userId:timestamp:hmac
export function gerarTokenQR(userId: string): string {
  const ts = Math.floor(Date.now() / 1000)
  const payload = `${userId}:${ts}`
  const hmac = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("hex")
    .slice(0, 16)  // 16 chars suficientes
  return `${payload}:${hmac}`
}

// Validar token e extrair userId
// Token expira em 5 minutos
export function validarTokenQR(token: string): { userId: string } | null {
  const parts = token.split(":")
  if (parts.length !== 3) return null

  const [userId, tsStr, hmacRecebido] = parts
  const ts = parseInt(tsStr, 10)
  const agora = Math.floor(Date.now() / 1000)

  // Expirado (> 5 minutos)
  if (agora - ts > 300) return null

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

Adicionar ao `.env.local`:
```env
QR_HMAC_SECRET=  # gerar: openssl rand -base64 32
```

---

## Passo 5 — API Routes

### GET /api/qr/meu-codigo

Criar `src/app/api/routes/qr.ts`:

```typescript
import { Hono } from "hono"
import { auth } from "@/auth"
import { gerarTokenQR } from "@/lib/qr/token"

const qr = new Hono()

// Cidadão busca o token para o seu QR Code
qr.get("/meu-codigo", async (c) => {
  const session = await auth()
  if (!session?.user?.id) return c.json({ error: "Não autenticado." }, 401)

  const token = gerarTokenQR(session.user.id)
  return c.json({ token })
})

export default qr
```

### POST /api/checkin

Criar `src/app/api/routes/checkin.ts`:

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

const schema = z.object({
  token: z.string().min(10),  // token QR do cidadão
  pointId: z.string().cuid(), // ID do ponto de coleta
})

// Parceiro escaneia QR e registra check-in
checkin.post("/", zValidator("json", schema), async (c) => {
  // Rate limit por IP (parceiros não devem escanear em loop)
  const ip = c.req.header("CF-Connecting-IP") ?? "anon"
  const { success } = await checkRateLimit("map", ip)
  if (!success) return c.json({ error: "Muitas requisições." }, 429)

  // Parceiro precisa estar autenticado
  const session = await auth()
  if (!session?.user?.id) return c.json({ error: "Não autenticado." }, 401)
  if (session.user.role !== "PARTNER" && session.user.role !== "ADMIN") {
    return c.json({ error: "Apenas parceiros podem registrar check-ins." }, 403)
  }

  const { token, pointId } = c.req.valid("json")

  // Validar token HMAC do cidadão
  const parsed = validarTokenQR(token)
  if (!parsed) {
    return c.json({ error: "QR Code inválido ou expirado. Peça ao usuário gerar um novo." }, 400)
  }
  const { userId } = parsed

  // Parceiro só pode fazer check-in nos seus próprios pontos
  const point = await prisma.point.findFirst({
    where: {
      id: pointId,
      status: "APPROVED",
      partner: { userId: session.user.id },
    },
    include: { partner: true },
  })

  // Admins podem fazer check-in em qualquer ponto
  const pointFinal = point ?? (session.user.role === "ADMIN"
    ? await prisma.point.findUnique({ where: { id: pointId, status: "APPROVED" } })
    : null)

  if (!pointFinal) return c.json({ error: "Ponto não encontrado ou sem permissão." }, 404)

  // Anti-abuso: verificar se já houve check-in neste ponto hoje
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const amanha = new Date(hoje)
  amanha.setDate(amanha.getDate() + 1)

  const checkinHoje = await prisma.checkin.findFirst({
    where: {
      userId,
      pointId,
      createdAt: { gte: hoje, lt: amanha },
    },
  })

  if (checkinHoje) {
    return c.json({
      error: "Este usuário já realizou check-in neste ponto hoje.",
      code: "DUPLICATE_CHECKIN",
    }, 409)
  }

  // Registrar check-in e creditar coins em paralelo
  const [, coinResult] = await Promise.all([
    prisma.checkin.create({ data: { userId, pointId, coinsEarned: 10 } }),
    creditCoins(userId, "CHECKIN", pointId),
  ])

  // Buscar dados do usuário para feedback visual no parceiro
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
    pointName: pointFinal.name,
  })
})

export default checkin
```

Registrar as rotas no roteador principal (`src/app/api/[[...route]]/route.ts`):

```typescript
import qr from "./routes/qr"
import checkin from "./routes/checkin"

// Adicionar junto com as outras rotas:
app.route("/qr", qr)
app.route("/checkin", checkin)
```

---

## Passo 6 — Componente QRCodeDisplay (cidadão)

Criar `src/components/coins/QRCodeDisplay.tsx`:

```tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import QRCode from "react-qr-code"
import { Button } from "@/components/ui/button"

export function QRCodeDisplay() {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [expiraEm, setExpiraEm] = useState(300) // 5 minutos

  const buscarToken = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/qr/meu-codigo")
      const data = await res.json()
      setToken(data.token)
      setExpiraEm(300)
    } catch {
      // Silencioso — botão de refresh disponível
    } finally {
      setLoading(false)
    }
  }, [])

  // Buscar token ao montar
  useEffect(() => { buscarToken() }, [buscarToken])

  // Contador regressivo
  useEffect(() => {
    if (!token) return
    const interval = setInterval(() => {
      setExpiraEm(prev => {
        if (prev <= 1) {
          buscarToken() // renovar automaticamente
          return 300
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [token, buscarToken])

  const minutos = Math.floor(expiraEm / 60)
  const segundos = expiraEm % 60

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 p-6">
        <div className="w-48 h-48 bg-gray-100 animate-pulse rounded-lg" />
        <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <p className="text-sm text-muted-foreground text-center">
        Mostre este QR Code ao parceiro no momento do descarte
      </p>

      {token && (
        <div className="bg-white p-4 rounded-xl border border-border">
          <QRCode
            value={token}
            size={192}
            fgColor="#2D7D46"  // verde EcoMed
            level="M"
          />
        </div>
      )}

      <div className="flex items-center gap-2 text-sm">
        <span className={expiraEm < 60 ? "text-red-500" : "text-muted-foreground"}>
          Expira em {minutos}:{segundos.toString().padStart(2, "0")}
        </span>
      </div>

      <Button variant="outline" size="sm" onClick={buscarToken}>
        Renovar QR Code
      </Button>

      <p className="text-xs text-muted-foreground text-center max-w-xs">
        Cada QR Code é único e válido por 5 minutos.
        Não compartilhe com outras pessoas.
      </p>
    </div>
  )
}
```

---

## Passo 7 — Scanner do parceiro

Criar `src/app/parceiro/scanner/page.tsx`:

```tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import confetti from "canvas-confetti"

// Substitua pelo ID do ponto do parceiro logado
// Em produção, buscar da sessão: session.user.partnerId → point.id
const POINT_ID_PLACEHOLDER = "SUBSTITUIR_PELO_POINT_ID"

type CheckinResult = {
  ok: boolean
  coinsEarned: number
  userName: string
  pointName: string
  levelUp?: string | null
}

export default function ScannerPage() {
  const [scanning, setScanning] = useState(false)
  const [resultado, setResultado] = useState<CheckinResult | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)

  const pararScanner = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop()
    }
    setScanning(false)
  }

  const iniciarScanner = async () => {
    setResultado(null)
    setErro(null)
    setScanning(true)

    const scanner = new Html5Qrcode("qr-reader")
    scannerRef.current = scanner

    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await pararScanner()
          await processarCheckin(decodedText)
        },
        () => {} // erro de frame — ignorar
      )
    } catch {
      setErro("Não foi possível acessar a câmera. Verifique as permissões.")
      setScanning(false)
    }
  }

  const processarCheckin = async (token: string) => {
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, pointId: POINT_ID_PLACEHOLDER }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.code === "DUPLICATE_CHECKIN") {
          setErro("Este usuário já realizou check-in neste ponto hoje.")
        } else {
          setErro(data.error ?? "Erro ao processar check-in.")
        }
        return
      }

      setResultado(data)

      // Animação de confetti ao creditar coins
      confetti({
        particleCount: 80,
        spread: 60,
        colors: ["#2D7D46", "#4CAF73", "#F5A623"],
        origin: { y: 0.6 },
      })

      if (data.levelUp) {
        toast({ title: `Parabéns! ${data.userName} subiu para o nível ${data.levelUp}!` })
      }
    } catch {
      setErro("Erro de conexão. Tente novamente.")
    }
  }

  // Limpar scanner ao sair da página
  useEffect(() => () => { pararScanner() }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-6">
      <div className="text-center">
        <h1 className="text-xl font-medium">Scanner de Check-in</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Aponte a câmera para o QR Code do cidadão
        </p>
      </div>

      {/* Área do scanner */}
      <div id="qr-reader" className="w-full max-w-sm rounded-xl overflow-hidden" />

      {/* Resultado de sucesso */}
      {resultado && (
        <div className="w-full max-w-sm bg-green-50 border border-green-200 rounded-xl p-5 text-center">
          <p className="text-green-700 font-medium text-lg">Check-in registrado!</p>
          <p className="text-green-600 mt-1">{resultado.userName}</p>
          <p className="text-green-600 text-sm mt-1">
            +{resultado.coinsEarned} EcoCoins creditados
          </p>
          {resultado.levelUp && (
            <p className="text-amber-600 text-sm mt-2 font-medium">
              Subiu para o nível {resultado.levelUp}!
            </p>
          )}
        </div>
      )}

      {/* Erro */}
      {erro && (
        <div className="w-full max-w-sm bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-red-700 text-sm">{erro}</p>
        </div>
      )}

      {/* Controles */}
      <div className="flex gap-3">
        {!scanning ? (
          <Button onClick={iniciarScanner} className="bg-primary text-white">
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

---

## Passo 8 — Adicionar QR Code na tela de perfil

Em `src/app/app/perfil/page.tsx`, adicionar a seção:

```tsx
import { QRCodeDisplay } from "@/components/coins/QRCodeDisplay"

// Dentro do JSX da página, adicionar uma nova seção:
<section>
  <h2 className="text-base font-medium mb-3">Meu QR Code de descarte</h2>
  <QRCodeDisplay />
</section>
```

---

## Passo 9 — Buscar o pointId real no scanner do parceiro

Na página do scanner, o `POINT_ID_PLACEHOLDER` precisa ser o ID do ponto do parceiro logado.
Adicionar no início do componente:

```tsx
import { useSession } from "next-auth/react"

// Dentro do componente:
const { data: session } = useSession()
const [pointId, setPointId] = useState<string | null>(null)

useEffect(() => {
  if (!session?.user?.id) return
  fetch("/api/parceiro/meu-ponto")
    .then(r => r.json())
    .then(data => setPointId(data.id ?? null))
}, [session])

// Substituir POINT_ID_PLACEHOLDER por pointId na chamada processarCheckin
```

Criar `src/app/api/routes/parceiro.ts` (se ainda não existir) — rota `/api/parceiro/meu-ponto`:

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

---

## Resumo — checklist de execução

```
☐  pnpm add react-qr-code html5-qrcode canvas-confetti react-circular-progressbar
☐  Adicionar model Checkin ao schema.prisma
☐  Adicionar relações checkins[] em User e Point
☐  pnpm prisma migrate dev --name add-checkin
☐  Adicionar QR_HMAC_SECRET ao .env.local
☐  Criar src/lib/coins/index.ts
☐  Criar src/lib/qr/token.ts
☐  Criar src/app/api/routes/qr.ts
☐  Criar src/app/api/routes/checkin.ts
☐  Registrar rotas qr e checkin no roteador Hono
☐  Criar src/components/coins/QRCodeDisplay.tsx
☐  Criar src/app/parceiro/scanner/page.tsx
☐  Adicionar <QRCodeDisplay /> no perfil do cidadão
☐  Testar: cidadão abre perfil → QR aparece
☐  Testar: parceiro escaneia → resultado aparece + confetti
☐  Testar: segundo scan no mesmo dia → erro DUPLICATE_CHECKIN
```
