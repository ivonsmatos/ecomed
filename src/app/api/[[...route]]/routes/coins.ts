import { Hono } from "hono"
import { auth } from "@/../auth"
import { prisma } from "@/lib/db/prisma"
import { creditCoins } from "@/lib/coins"
import { checkRateLimit } from "@/lib/ratelimit"
import { aplicarProgressoMissoes } from "@/lib/coins/missions"

const coins = new Hono()

// GET /api/coins — saldo, nível, streak e histórico de transações
coins.get("/", async (c) => {
  const session = await auth()
  if (!session?.user?.id) return c.json({ error: "Não autenticado." }, 401)
  const userId = session.user.id

  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  })

  if (!wallet) {
    return c.json({
      balance: 0,
      totalEarned: 0,
      level: "SEMENTE",
      streakCurrent: 0,
      streakBest: 0,
      weeklyCoins: 0,
      transactions: [],
    })
  }

  return c.json({
    balance: wallet.balance,
    totalEarned: wallet.totalEarned,
    level: wallet.level,
    streakCurrent: wallet.streakCurrent,
    streakBest: wallet.streakBest,
    weeklyCoins: wallet.weeklyCoins,
    lastActivityAt: wallet.lastActivityAt,
    transactions: wallet.transactions.map((t) => ({
      id: t.id,
      amount: t.amount,
      event: t.event,
      note: t.note,
      createdAt: t.createdAt,
    })),
  })
})

// POST /api/coins/article-read — registra leitura de artigo (≥ 120s, scroll ≥ 90%)
coins.post("/article-read", async (c) => {
  const ip = c.req.header("CF-Connecting-IP") ?? "anon"
  const { success } = await checkRateLimit("map", ip)
  if (!success) return c.json({ error: "Muitas requisições." }, 429)

  const session = await auth()
  if (!session?.user?.id) return c.json({ error: "Não autenticado." }, 401)
  const userId = session.user.id

  const body = await c.req.json<{ articleSlug: string; secondsRead: number; scrollPct: number }>()
  const { articleSlug, secondsRead, scrollPct } = body

  if (typeof secondsRead !== "number" || secondsRead < 120) {
    return c.json({ error: "Tempo de leitura insuficiente (mínimo 2 minutos)." }, 422)
  }
  if (typeof scrollPct !== "number" || scrollPct < 90) {
    return c.json({ error: "Scroll insuficiente (mínimo 90%)." }, 422)
  }

  const result = await creditCoins(userId, "ARTICLE_READ", articleSlug)

  if (!result.ok) {
    return c.json({ ok: false, reason: "limite_diario", newBalance: result.newBalance })
  }

  await aplicarProgressoMissoes(userId, "ARTICLE_READ").catch(() => null)

  return c.json({
    ok: true,
    coinsEarned: 2,
    newBalance: result.newBalance,
    levelUp: result.levelUp ?? null,
    streakBonus: result.streakBonus ?? null,
  })
})

// POST /api/coins/ecobot-question — registra pergunta ao EcoBot (≥ 10 chars)
coins.post("/ecobot-question", async (c) => {
  const session = await auth()
  if (!session?.user?.id) return c.json({ error: "Não autenticado." }, 401)
  const userId = session.user.id

  const body = await c.req.json<{ questionLength: number }>()
  if (!body.questionLength || body.questionLength < 10) {
    return c.json({ ok: false, reason: "pergunta_curta" })
  }

  const result = await creditCoins(userId, "ECOBOT_QUESTION")
  if (result.ok) {
    await aplicarProgressoMissoes(userId, "ECOBOT_QUESTION").catch(() => null)
  }
  return c.json({ ok: result.ok, newBalance: result.newBalance })
})

// POST /api/coins/ecobot-rating — registra avaliação de resposta do EcoBot
coins.post("/ecobot-rating", async (c) => {
  const session = await auth()
  if (!session?.user?.id) return c.json({ error: "Não autenticado." }, 401)
  const userId = session.user.id

  const result = await creditCoins(userId, "ECOBOT_RATING")
  if (result.ok) {
    await aplicarProgressoMissoes(userId, "ECOBOT_RATING").catch(() => null)
  }
  return c.json({ ok: result.ok, newBalance: result.newBalance })
})

// POST /api/coins/share — registra compartilhamento via Web Share API
coins.post("/share", async (c) => {
  const session = await auth()
  if (!session?.user?.id) return c.json({ error: "Não autenticado." }, 401)
  const userId = session.user.id

  const body = await c.req.json<{ type: "article" | "badge" }>()
  const event = body.type === "badge" ? "SHARE_BADGE" : "SHARE_ARTICLE"

  const result = await creditCoins(userId, event)
  if (result.ok) {
    await aplicarProgressoMissoes(userId, event).catch(() => null)
  }
  return c.json({ ok: result.ok, newBalance: result.newBalance })
})

export default coins
