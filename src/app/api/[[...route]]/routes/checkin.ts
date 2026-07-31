import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { auth } from "@/../auth"
import { prisma } from "@/lib/db/prisma"
import { validarTokenPonto, validarTokenQR } from "@/lib/qr/token"
import { creditCoins } from "@/lib/coins"
import { checkRateLimit } from "@/lib/ratelimit"
import { verificarMilestonesDescarte } from "@/lib/goals/milestones"
import { aplicarProgressoMissoes } from "@/lib/coins/missions"
import { haversineMetros } from "@/lib/geo/haversine"

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
  const { userId, nonce } = parsed

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
  hoje.setUTCHours(0, 0, 0, 0)
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
  const createdCheckin = await prisma.checkin.create({
      data: { userId, pointId, coinsEarned: coinsBase, hasGps, qrNonce: nonce, checkinDay: hoje },
    })
  let coinResult
  try {
    coinResult = await creditCoins(
      userId,
      "CHECKIN",
      pointId,
      coinsBase,
      undefined,
      `CHECKIN:${userId}:${pointId}:${hoje.toISOString()}`,
    )
  } catch (error) {
    // Compensação: não deixa check-in sem o respectivo lançamento financeiro.
    await prisma.checkin.delete({ where: { id: createdCheckin.id } }).catch(() => null)
    throw error
  }
  if (!coinResult.ok) {
    await prisma.checkin.update({
      where: { id: createdCheckin.id },
      data: { coinsEarned: 0 },
    })
  }

  await aplicarProgressoMissoes(userId, "CHECKIN").catch(() => null)

  // 8. Bônus por novo ponto
  if (!primeiraVisita) {
    await creditCoins(
      userId,
      "CHECKIN_NEW_POINT",
      pointId,
      undefined,
      undefined,
      `CHECKIN_NEW_POINT:${userId}:${pointId}`,
    )
  }

  // 9. Bônus por retorno ao descarte (primeiro em 30 dias)
  if (!checkinRecente) {
    await creditCoins(
      userId,
      "CHECKIN_FIRST_MONTH",
      pointId,
      undefined,
      undefined,
      `CHECKIN_FIRST_MONTH:${userId}:${hoje.toISOString().slice(0, 7)}`,
    )
  }

  const [usuario, walletAtual] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    prisma.wallet.findUnique({ where: { userId }, select: { balance: true } }),
  ])

  // Verificar e conceder badges de milestones (fire-and-forget não bloqueia a resposta)
  const novosSelosDescarte = await verificarMilestonesDescarte(userId).catch(() => [] as string[])

  return c.json({
    ok: true,
    coinsEarned: coinResult.ok ? coinsBase : 0,
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

// ── POST /api/checkin/store — cidadão escaneia QR da loja ─────────────────────
const storeSchema = z.object({
  token: z.string().min(40),
  lat: z.number().optional(),
  lng: z.number().optional(),
})

checkin.post("/store", zValidator("json", storeSchema), async (c) => {
  const ip = c.req.header("CF-Connecting-IP") ?? "anon"
  const { success } = await checkRateLimit("map", ip)
  if (!success) return c.json({ error: "Muitas requisições." }, 429)

  const session = await auth()
  if (!session?.user?.id) return c.json({ error: "Não autenticado." }, 401)
  const userId = session.user.id

  const { token, lat, lng } = c.req.valid("json")
  const qrPayload = validarTokenPonto(token)
  if (!qrPayload) {
    return c.json({ error: "QR Code inválido, alterado ou expirado." }, 400)
  }
  const { pointId } = qrPayload

  // 1. Ponto existe e está aprovado?
  const point = await prisma.point.findFirst({
    where: { id: pointId, status: "APPROVED" },
    select: { id: true, name: true, latitude: true, longitude: true },
  })
  if (!point) return c.json({ error: "Ponto não encontrado ou inativo." }, 404)

  // 2. Já registrou nesta loja hoje?
  const hoje = new Date()
  hoje.setUTCHours(0, 0, 0, 0)
  const amanha = new Date(hoje)
  amanha.setDate(amanha.getDate() + 1)

  const jaHoje = await prisma.checkin.findFirst({
    where: { userId, pointId, createdAt: { gte: hoje, lt: amanha } },
  })
  if (jaHoje) {
    return c.json({ error: "Você já registrou um descarte aqui hoje.", code: "DUPLICATE_CHECKIN" }, 409)
  }

  // 3. GPS confirma presença? (< 200 m = bônus)
  let hasGps = false
  if (lat !== undefined && lng !== undefined) {
    const dist = haversineMetros(lat, lng, point.latitude, point.longitude)
    hasGps = dist <= 200
  }
  const coinsBase = hasGps ? 15 : 10

  // 4. Bônus especiais
  const primeiraVisita = await prisma.checkin.findFirst({ where: { userId, pointId } })
  const trintaDiasAtras = new Date()
  trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30)
  const checkinRecente = await prisma.checkin.findFirst({
    where: { userId, createdAt: { gte: trintaDiasAtras } },
  })

  // 5. Gravar check-in + creditar
  const createdCheckin = await prisma.checkin.create({
      data: {
        userId,
        pointId,
        coinsEarned: coinsBase,
        hasGps,
        qrNonce: qrPayload.nonce,
        checkinDay: hoje,
      },
    })
  let coinResult
  try {
    coinResult = await creditCoins(
      userId,
      "CHECKIN",
      pointId,
      coinsBase,
      undefined,
      `CHECKIN:${userId}:${pointId}:${hoje.toISOString()}`,
    )
  } catch (error) {
    await prisma.checkin.delete({ where: { id: createdCheckin.id } }).catch(() => null)
    throw error
  }
  if (!coinResult.ok) {
    await prisma.checkin.update({
      where: { id: createdCheckin.id },
      data: { coinsEarned: 0 },
    })
  }

  await aplicarProgressoMissoes(userId, "CHECKIN").catch(() => null)

  if (!primeiraVisita) {
    await creditCoins(
      userId,
      "CHECKIN_NEW_POINT",
      pointId,
      undefined,
      undefined,
      `CHECKIN_NEW_POINT:${userId}:${pointId}`,
    )
  }
  if (!checkinRecente) {
    await creditCoins(
      userId,
      "CHECKIN_FIRST_MONTH",
      pointId,
      undefined,
      undefined,
      `CHECKIN_FIRST_MONTH:${userId}:${hoje.toISOString().slice(0, 7)}`,
    )
  }

  const [walletAtual, novosSelosDescarte] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId }, select: { balance: true } }),
    verificarMilestonesDescarte(userId).catch(() => [] as string[]),
  ])

  return c.json({
    ok: true,
    coinsEarned: coinResult.ok ? coinsBase : 0,
    hasGps,
    newBalance: walletAtual?.balance ?? coinResult.newBalance,
    levelUp: coinResult.levelUp ?? null,
    bonuses: { newPoint: !primeiraVisita, firstInMonth: !checkinRecente },
    pointName: point.name,
    novosSelosDescarte,
  })
})

export default checkin
