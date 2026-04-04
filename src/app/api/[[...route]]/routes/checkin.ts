import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { auth } from "@/../auth"
import { prisma } from "@/lib/db/prisma"
import { validarTokenQR } from "@/lib/qr/token"
import { creditCoins } from "@/lib/coins"
import { checkRateLimit } from "@/lib/ratelimit"

const checkin = new Hono()

const checkinSchema = z.object({
  token: z.string().min(10),
  pointId: z.string().cuid(),
})

// POST /api/checkin — parceiro escaneia QR do cidadão e registra check-in
checkin.post("/", zValidator("json", checkinSchema), async (c) => {
  // 1. Rate limiting por IP (anti-abuso)
  const ip = c.req.header("CF-Connecting-IP") ?? "anon"
  const { success } = await checkRateLimit("map", ip)
  if (!success) return c.json({ error: "Muitas requisições." }, 429)

  // 2. Apenas parceiros ou admins podem registrar check-ins
  const session = await auth()
  if (!session?.user?.id) return c.json({ error: "Não autenticado." }, 401)
  const userRole = (session.user as { role?: string }).role
  if (userRole !== "PARTNER" && userRole !== "ADMIN") {
    return c.json({ error: "Apenas parceiros podem registrar check-ins." }, 403)
  }

  const { token, pointId } = c.req.valid("json")

  // 3. Validar token HMAC — extrai o userId do cidadão
  const parsed = validarTokenQR(token)
  if (!parsed) {
    return c.json(
      { error: "QR Code inválido ou expirado. Peça ao usuário gerar um novo." },
      400,
    )
  }
  const { userId } = parsed

  // 4. Verificar ownership do ponto (parceiro só acessa seus próprios pontos)
  let point = await prisma.point.findFirst({
    where: {
      id: pointId,
      status: "APPROVED",
      partner: { userId: session.user.id },
    },
  })

  // Admins podem fazer check-in em qualquer ponto aprovado
  if (!point && userRole === "ADMIN") {
    point = await prisma.point.findUnique({
      where: { id: pointId, status: "APPROVED" },
    })
  }

  if (!point) return c.json({ error: "Ponto não encontrado ou sem permissão." }, 404)

  // 5. Anti-abuso: 1 check-in por usuário por ponto por dia
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const amanha = new Date(hoje)
  amanha.setDate(amanha.getDate() + 1)

  const checkinHoje = await prisma.checkin.findFirst({
    where: { userId, pointId, createdAt: { gte: hoje, lt: amanha } },
  })

  if (checkinHoje) {
    return c.json(
      {
        error: "Este usuário já realizou check-in neste ponto hoje.",
        code: "DUPLICATE_CHECKIN",
      },
      409,
    )
  }

  // 6. Registrar check-in e creditar coins
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
