import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { auth } from "@/../auth"
import { prisma } from "@/lib/db/prisma"
import { validarTokenQR } from "@/lib/qr/token"
import { creditCoins } from "@/lib/coins"
import { checkRateLimit } from "@/lib/ratelimit"
import { verificarMilestonesDescarte } from "@/lib/goals/milestones"
import { aplicarProgressoMissoes } from "@/lib/coins/missions"

const checkin = new Hono()

const checkinSchema = z.object({
  token: z.string().min(10),
  pointId: z.union([
    z.string().cuid(),
    z.string().regex(/^point-seed-[a-zA-Z0-9_-]+$/),
    z.string().regex(/^seed-[a-zA-Z0-9_-]+$/),
  ]),
  hasGps: z.boolean().optional().default(false),
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

  const { token, pointId, hasGps } = c.req.valid("json")

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

  // 6. Verificar bônus especiais antes de creditar
  const coinsBase = hasGps ? 15 : 10

  // CHECKIN_NEW_POINT: primeiro check-in do usuário neste ponto
  const primeiraVisita = await prisma.checkin.findFirst({
    where: { userId, pointId },
  })

  // CHECKIN_FIRST_MONTH: primeiro check-in em qualquer ponto nos últimos 30 dias
  const trintiaDiasAtras = new Date()
  trintiaDiasAtras.setDate(trintiaDiasAtras.getDate() - 30)
  const checkinRecente = await prisma.checkin.findFirst({
    where: { userId, createdAt: { gte: trintiaDiasAtras } },
  })

  // 7. Registrar check-in e creditar coins base
  const [, coinResult] = await Promise.all([
    prisma.checkin.create({ data: { userId, pointId, coinsEarned: coinsBase, hasGps } }),
    creditCoins(userId, "CHECKIN", pointId, coinsBase),
  ])

  await aplicarProgressoMissoes(userId, "CHECKIN").catch(() => null)

  // 8. Bônus por novo ponto
  if (!primeiraVisita) {
    await creditCoins(userId, "CHECKIN_NEW_POINT", pointId)
  }

  // 9. Bônus por retorno ao descarte (primeiro em 30 dias)
  if (!checkinRecente) {
    await creditCoins(userId, "CHECKIN_FIRST_MONTH", pointId)
  }

  const [usuario, walletAtual] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    prisma.wallet.findUnique({ where: { userId }, select: { balance: true } }),
  ])

  // Verificar e conceder badges de milestones (fire-and-forget não bloqueia a resposta)
  const novosSelosDescarte = await verificarMilestonesDescarte(userId).catch(() => [] as string[])

  return c.json({
    ok: true,
    coinsEarned: coinsBase,
    hasGps,
    newBalance: walletAtual?.balance ?? coinResult.newBalance,
    levelUp: coinResult.levelUp ?? null,
    bonuses: {
      newPoint: !primeiraVisita,
      firstInMonth: !checkinRecente,
    },
    userName: usuario?.name ?? "Usuário",
    pointName: point.name,
    novosSelosDescarte,
  })
})

export default checkin
