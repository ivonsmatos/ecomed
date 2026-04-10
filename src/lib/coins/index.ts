import { prisma } from "@/lib/db/prisma"

// ---- Início do dia em UTC (usado como chave do DailyLimitTracker) ----
function diaUTC(): Date {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d
}

// ---- Início da semana (segunda-feira 00:00 UTC) para ranking semanal ----
function inicioSemanaUTC(): Date {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  const dow = d.getUTCDay() // 0=dom, 1=seg...
  d.setUTCDate(d.getUTCDate() - ((dow + 6) % 7))
  return d
}

// ---- Cálculo de nível pelo totalEarned (lifetime) ----
export function calcularNivel(
  totalEarned: number,
): "SEMENTE" | "BROTO" | "ARVORE" | "GUARDIAO" | "LENDA_ECO" {
  if (totalEarned <= 100) return "SEMENTE"
  if (totalEarned <= 500) return "BROTO"
  if (totalEarned <= 2000) return "ARVORE"
  if (totalEarned <= 5000) return "GUARDIAO"
  return "LENDA_ECO"
}

// ---- Multiplicador de Coins por nível (GUARDIAO e LENDA_ECO) ----
function multiplicadorNivel(level: string): number {
  if (level === "GUARDIAO") return 1.2
  if (level === "LENDA_ECO") return 1.5
  return 1.0
}

// ---- Valor base por evento ----
const COIN_VALUES: Record<string, number> = {
  // Onboarding (único por conta)
  SIGNUP: 20,
  ONBOARDING_PROFILE: 10,
  ONBOARDING_SCREENS: 5,
  ONBOARDING_GEO: 5,
  ONBOARDING_PUSH: 5,
  // Descarte
  CHECKIN: 10,              // GPS = 15 (passar como customAmount)
  CHECKIN_FIRST_MONTH: 5,
  CHECKIN_NEW_POINT: 5,
  // Educação
  ARTICLE_READ: 2,
  QUIZ: 5,
  QUIZ_PERFECT: 10,
  ECOBOT_QUESTION: 1,
  ECOBOT_RATING: 1,
  // Engajamento social
  REFERRAL: 20,
  SHARE_ARTICLE: 3,
  SHARE_BADGE: 2,
  // Streaks
  STREAK_3_DAYS: 5,
  STREAK_7_DAYS: 15,
  STREAK_30_DAYS: 50,
  DAILY_STREAK: 1,
  // Missões
  MISSION_COMPLETE: 0,     // variável — informar customAmount
  MISSION_DAILY_BONUS: 10,
  MISSION_WEEKLY_BONUS: 15,
  // Outros
  REPORT_SUBMITTED: 5,
  BADGE_EARNED: 0,
  ADMIN_GRANT: 0,
  ADJUSTMENT: 0,
}

// ---- Limite diário por categoria ----
const LIMITES_DIARIOS: Partial<Record<string, number>> = {
  CHECKIN: 3,
  ARTICLE_READ: 5,
  QUIZ: 3,
  QUIZ_PERFECT: 3,
  ECOBOT_QUESTION: 10,
  ECOBOT_RATING: 10,
  SHARE_ARTICLE: 2,
  SHARE_BADGE: 1,
  REPORT_SUBMITTED: 3,
}

// ---- Eventos isentos do teto diário global ----
const ISENTO_TETO_GLOBAL = new Set([
  "SIGNUP",
  "ONBOARDING_PROFILE",
  "ONBOARDING_SCREENS",
  "ONBOARDING_GEO",
  "ONBOARDING_PUSH",
  "ADMIN_GRANT",
  "ADJUSTMENT",
  "REDEMPTION",
  "STREAK_3_DAYS",
  "STREAK_7_DAYS",
  "STREAK_30_DAYS",
])

// ---- Eventos com multiplicador de nível ----
const COM_MULTIPLICADOR = new Set([
  "CHECKIN",
  "ARTICLE_READ",
  "QUIZ",
  "QUIZ_PERFECT",
  "MISSION_COMPLETE",
])

const TETO_DIARIO_GLOBAL = 120

// ---- Verifica teto diário global e limite por categoria; registra no tracker ----
async function verificarERegistrar(
  userId: string,
  event: string,
  amount: number,
): Promise<boolean> {
  const hoje = diaUTC()

  if (!ISENTO_TETO_GLOBAL.has(event)) {
    const totais = await prisma.dailyLimitTracker.findMany({ where: { userId, date: hoje } })
    const totalHoje = totais.reduce((s, t) => s + t.coins, 0)
    if (totalHoje + amount > TETO_DIARIO_GLOBAL) return false
  }

  const limite = LIMITES_DIARIOS[event]
  if (limite !== undefined) {
    const catRow = await prisma.dailyLimitTracker.findUnique({
      where: { userId_date_category: { userId, date: hoje, category: event } },
    })
    if (catRow && catRow.count >= limite) return false
  }

  // Registrar no tracker
  if (!["ADMIN_GRANT", "ADJUSTMENT", "REDEMPTION"].includes(event)) {
    await prisma.dailyLimitTracker.upsert({
      where: { userId_date_category: { userId, date: hoje, category: event } },
      update: { count: { increment: 1 }, coins: { increment: amount } },
      create: { userId, date: hoje, category: event, count: 1, coins: amount },
    })
  }

  return true
}

// ---- Atualiza streak e retorna milestone se atingido ----
function calcularStreak(
  streakAtual: number,
  streakBest: number,
  lastActivityAt: Date | null,
): { novoStreak: number; novoStreakBest: number; milestone?: string } {
  const agoraUtc0 = diaUTC()

  if (!lastActivityAt) {
    return { novoStreak: 1, novoStreakBest: Math.max(1, streakBest) }
  }

  const ultimoUtc0 = new Date(lastActivityAt)
  ultimoUtc0.setUTCHours(0, 0, 0, 0)
  const diffDias = Math.round((agoraUtc0.getTime() - ultimoUtc0.getTime()) / 86_400_000)

  if (diffDias === 0) {
    return { novoStreak: streakAtual, novoStreakBest: streakBest }
  }
  if (diffDias === 1) {
    const novoStreak = streakAtual + 1
    const novoStreakBest = Math.max(novoStreak, streakBest)
    let milestone: string | undefined
    if (novoStreak === 30) milestone = "STREAK_30_DAYS"
    else if (novoStreak === 7) milestone = "STREAK_7_DAYS"
    else if (novoStreak === 3) milestone = "STREAK_3_DAYS"
    return { novoStreak, novoStreakBest, milestone }
  }
  // streak quebrado
  return { novoStreak: 1, novoStreakBest: streakBest }
}

// ---- Credita coins para um usuário ----
export async function creditCoins(
  userId: string,
  event: string,
  reference?: string,
  customAmount?: number,
  label?: string,
): Promise<{ ok: boolean; newBalance: number; levelUp?: string; streakBonus?: string }> {
  let amount = customAmount ?? COIN_VALUES[event] ?? 0
  if (amount <= 0) return { ok: false, newBalance: 0 }

  // Buscar ou criar wallet
  let wallet = await prisma.wallet.findUnique({ where: { userId } })
  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: { userId, balance: 0, totalEarned: 0, level: "SEMENTE" },
    })
  }

  // Aplicar multiplicador de nível
  if (COM_MULTIPLICADOR.has(event)) {
    amount = Math.round(amount * multiplicadorNivel(wallet.level))
  }

  // Verificar limites
  const dentroDoLimite = await verificarERegistrar(userId, event, amount)
  if (!dentroDoLimite) return { ok: false, newBalance: wallet.balance }

  // Calcular streak
  const { novoStreak, novoStreakBest, milestone } = calcularStreak(
    wallet.streakCurrent,
    wallet.streakBest,
    wallet.lastActivityAt,
  )

  const novoBalance = wallet.balance + amount
  const novoTotal = wallet.totalEarned + amount
  const novoNivel = calcularNivel(novoTotal) as string
  const levelUp = novoNivel !== wallet.level ? novoNivel : undefined

  // Ranking semanal — resetar se passou da segunda-feira
  const inicioSemana = inicioSemanaUTC()
  const precisaResetarSemanal =
    !wallet.weeklyCoinsResetAt || wallet.weeklyCoinsResetAt < inicioSemana

  await Promise.all([
    prisma.wallet.update({
      where: { userId },
      data: {
        balance: { increment: amount },
        totalEarned: { increment: amount },
        level: novoNivel as never,
        streakCurrent: novoStreak,
        streakBest: novoStreakBest,
        lastActivityAt: new Date(),
        weeklyCoins: precisaResetarSemanal ? amount : { increment: amount },
        weeklyCoinsResetAt: precisaResetarSemanal ? inicioSemana : undefined,
      },
    }),
    prisma.coinTransaction.create({
      data: {
        walletId: wallet.id,
        amount,
        event: event as never,
        reference: reference ?? null,
        note: label ?? `${event}${reference ? ` · ${reference}` : ""}`,
      },
    }),
  ])

  // Bônus de streak (recursivo, não reentra no limite pois STREAK_* são isentos)
  let streakBonus: string | undefined
  if (milestone) {
    await creditCoins(userId, milestone)
    streakBonus = milestone
  }

  return { ok: true, newBalance: novoBalance, levelUp, streakBonus }
}

// ---- Debitar coins (resgate de recompensa) ----
export async function debitCoins(
  userId: string,
  amount: number,
  note?: string,
): Promise<{ ok: boolean; newBalance?: number }> {
  const wallet = await prisma.wallet.findUnique({ where: { userId } })
  if (!wallet || wallet.balance < amount) return { ok: false }

  const newBalance = wallet.balance - amount

  await Promise.all([
    prisma.coinTransaction.create({
      data: {
        walletId: wallet.id,
        amount: -amount,
        event: "REDEMPTION" as never,
        note: note ?? null,
      },
    }),
    prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: amount } },
    }),
  ])

  return { ok: true, newBalance }
}

// ---- Conceder badge ao usuário (idempotente) ----
export async function concederBadge(
  userId: string,
  badgeSlug: string,
): Promise<boolean> {
  const badge = await prisma.badge.findUnique({ where: { slug: badgeSlug } })
  if (!badge || !badge.active) return false

  const existing = await prisma.userBadge.findFirst({
    where: { userId, badgeId: badge.id },
  })
  if (existing) return false

  await prisma.userBadge.create({ data: { userId, badgeId: badge.id } })

  if (badge.coinReward > 0) {
    await creditCoins(userId, "BADGE_EARNED", badge.id, badge.coinReward)
  }

  return true
}

// ---- Dados completos da carteira (para API) ----
export async function getWalletInfo(userId: string) {
  return prisma.wallet.findUnique({
    where: { userId },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  })
}

