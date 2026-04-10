import { prisma } from "@/lib/db/prisma"

// ── Helpers de data ──────────────────────────────────────────────────────────

function startOfISOWeek(d = new Date()): Date {
  const day = d.getDay() || 7 // 1=Mon…7=Sun
  const result = new Date(d)
  result.setDate(d.getDate() - day + 1)
  result.setHours(0, 0, 0, 0)
  result.setMilliseconds(0)
  return result
}

/** Retorna o início da semana ISO N semanas atrás (0 = semana atual) */
function weeksAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n * 7)
  return startOfISOWeek(d)
}

// ── Tipo de retorno ──────────────────────────────────────────────────────────

export interface KpiData {
  northStar: { current: number; target: number; label: string }
  users: { total: number; dau: number; wau: number; newWeek: number; target: number }
  retention: { d7: number; d30: number }
  coins: { total: number; avg: number; spent: number; rewards: number }
  disposals: { total: number; week: number; gps: number; points: number }
  education: { articles: number; quizzes: number; chat: number; quizAvg: number }
  levels: { semente: number; broto: number; arvore: number; guardiao: number; lenda: number }
  streaks: { avg: number; best: number; active: number }
  missions: { completed: number; rate: number }
  tech: { uptime: number; lighthouse: number; api: number; chat: number; fcp: number; tests: number }
  social: { ig: number; tt: number; li: number; refs: number; shares: number; nps: number }
  impact: { liters: number; people: number; points: number; cities: number }
  tasks: { total: number; done: number; progress: number; review: number; blocked: number; notStarted: number }
  weekly: { w: string; u: number; d: number; c: number; a: number }[]
}

// ── Query principal ──────────────────────────────────────────────────────────

export async function getKpiData(): Promise<KpiData> {
  const weekStart = startOfISOWeek()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  // ── Queries paralelas principais ─────────────────────────────────────────
  const [
    totalUsers,
    newUsersWeek,
    walletAgg,
    levelGroups,
    totalCheckins,
    weekCheckins,
    gpsCheckins,
    uniquePoints,
    totalMissions,
    missionsThisWeek,
    totalQuizzes,
    totalChat,
    totalPoints,
    totalRewards,
    coinsSpentAgg,
    dauWallets,
    wauWallets,
    activeStreaks,
    quizPerfRaw,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "CITIZEN", active: true } }),
    prisma.user.count({ where: { role: "CITIZEN", createdAt: { gte: weekStart } } }),
    prisma.wallet.aggregate({
      _sum: { totalEarned: true },
      _avg: { streakCurrent: true },
      _max: { streakBest: true },
      _count: { _all: true },
    }),
    prisma.wallet.groupBy({ by: ["level"], _count: { _all: true } }),
    prisma.checkin.count(),
    prisma.checkin.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.checkin.count({ where: { hasGps: true } }),
    prisma.checkin.groupBy({ by: ["pointId"] }).then((r) => r.length),
    prisma.userMission.count({ where: { completed: true } }),
    prisma.userMission.count({ where: { expiresAt: { gte: weekStart } } }),
    prisma.quizAttempt.count(),
    prisma.chatFeedback.count(),
    prisma.point.count({ where: { status: "APPROVED" } }),
    prisma.userReward.count(),
    prisma.coinTransaction.aggregate({
      _sum: { amount: true },
      where: { amount: { lt: 0 } },
    }),
    // DAU: wallets com transação hoje
    prisma.coinTransaction
      .groupBy({ by: ["walletId"], where: { createdAt: { gte: todayStart } } })
      .then((r) => r.length),
    // WAU: wallets com transação esta semana
    prisma.coinTransaction
      .groupBy({ by: ["walletId"], where: { createdAt: { gte: weekStart } } })
      .then((r) => r.length),
    prisma.wallet.count({ where: { streakCurrent: { gt: 0 } } }),
    // Média de acerto em %
    prisma.$queryRaw<[{ avg_pct: number | null }]>`
      SELECT AVG(CAST(score AS float) / NULLIF(total, 0) * 100) AS avg_pct
      FROM "QuizAttempt"
    `,
  ])

  // ── Weekly sparkline: últimas 6 semanas ──────────────────────────────────
  const weeklyPromises = Array.from({ length: 6 }, async (_, idx) => {
    const wStart = weeksAgo(5 - idx)
    const wEnd = weeksAgo(4 - idx)
    const [u, d, c, a] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: wStart, lt: wEnd } } }),
      prisma.checkin.count({ where: { createdAt: { gte: wStart, lt: wEnd } } }),
      prisma.coinTransaction.aggregate({
        _sum: { amount: true },
        where: { createdAt: { gte: wStart, lt: wEnd }, amount: { gt: 0 } },
      }),
      prisma.quizAttempt.count({ where: { createdAt: { gte: wStart, lt: wEnd } } }),
    ])
    return { w: `S${idx + 1}`, u, d, c: Number(c._sum.amount ?? 0), a }
  })
  const weekly = await Promise.all(weeklyPromises)

  // ── Derivações ───────────────────────────────────────────────────────────

  const levelMap = Object.fromEntries(
    levelGroups.map((g) => [g.level, g._count._all])
  )

  const totalEarned = walletAgg._sum.totalEarned ?? 0
  const walletCount = walletAgg._count._all || 1
  const coinsAvg = Math.round(totalEarned / walletCount)
  const coinsSpent = Math.abs(coinsSpentAgg._sum.amount ?? 0)
  const quizAvg = Math.round(quizPerfRaw[0]?.avg_pct ?? 0)
  const streakAvg = Math.round((walletAgg._avg.streakCurrent ?? 0) * 10) / 10
  const streakBest = walletAgg._max.streakBest ?? 0

  // Taxa de conclusão de missões esta semana (evita divisão por zero)
  const missionRate =
    missionsThisWeek > 0 ? Math.round((totalMissions / missionsThisWeek) * 100) : 0

  // Impacto: estimativa ~200ml por medicamento descartado, média 5 medicamentos por descarte
  const litersProtected = totalCheckins * 5 * 0.2 * 1000 // em mL → litros × 1000 = mL

  return {
    northStar: { current: weekCheckins, target: 10, label: "Descartes/semana" },
    users: { total: totalUsers, dau: dauWallets, wau: wauWallets, newWeek: newUsersWeek, target: 100 },
    retention: { d7: 0, d30: 0 }, // requer event-tracking dedicado
    coins: { total: totalEarned, avg: coinsAvg, spent: coinsSpent, rewards: totalRewards },
    disposals: { total: totalCheckins, week: weekCheckins, gps: gpsCheckins, points: uniquePoints },
    education: { articles: 0, quizzes: totalQuizzes, chat: totalChat, quizAvg },
    levels: {
      semente: levelMap["SEMENTE"] ?? 0,
      broto: levelMap["BROTO"] ?? 0,
      arvore: levelMap["ARVORE"] ?? 0,
      guardiao: levelMap["GUARDIAO"] ?? 0,
      lenda: levelMap["LENDA_ECO"] ?? 0,
    },
    streaks: { avg: streakAvg, best: streakBest, active: activeStreaks },
    missions: { completed: totalMissions, rate: missionRate },
    // Métricas técnicas sem fonte no DB — mantidas como referência estática
    tech: { uptime: 99.9, lighthouse: 92, api: 1.2, chat: 3.8, fcp: 1.3, tests: 0 },
    // Social: sem fonte no DB
    social: { ig: 0, tt: 0, li: 0, refs: 0, shares: 0, nps: 0 },
    impact: {
      liters: Math.round(litersProtected),
      people: totalUsers,
      points: totalPoints,
      cities: 0,
    },
    // Tarefas: sem fonte no DB
    tasks: { total: 0, done: 0, progress: 0, review: 0, blocked: 0, notStarted: 0 },
    weekly,
  }
}
