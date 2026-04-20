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

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d
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

  const d7ago  = daysAgo(7)
  const d30ago = daysAgo(30)

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
    // Education
    articleReads,
    // Social (from coin transactions)
    totalReferrals,
    totalShares,
    // Impact: cidades únicas de pontos aprovados
    uniqueCities,
    // Retention cohort d7: users created >7d ago that interacted in last 7d
    retentionD7cohort,
    retentionD7active,
    // Retention cohort d30
    retentionD30cohort,
    retentionD30active,
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
    // Chat: conta prompts com status ok no AiPromptLog (fonte de verdade)
    prisma.aiPromptLog.count({ where: { status: "ok" } }),
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
    // Artigos lidos: CoinTransactions de ARTICLE_READ
    prisma.coinTransaction.count({ where: { event: "ARTICLE_READ" as never } }),
    // Referrals bem-sucedidos
    prisma.coinTransaction.count({ where: { event: "REFERRAL" as never } }),
    // Compartilhamentos (artigos + badges)
    prisma.coinTransaction.count({
      where: { event: { in: ["SHARE_ARTICLE", "SHARE_BADGE"] as never[] } },
    }),
    // Cidades únicas de pontos aprovados
    prisma.point
      .groupBy({ by: ["city"], where: { status: "APPROVED" } })
      .then((r) => r.length),
    // Retenção D7: cohort de usuários criados há mais de 7 dias
    prisma.user.count({
      where: { role: "CITIZEN", active: true, createdAt: { lt: d7ago } },
    }),
    // Retenção D7: desses, quantos tiveram transação nos últimos 7 dias
    prisma.coinTransaction
      .groupBy({
        by: ["walletId"],
        where: { createdAt: { gte: d7ago } },
      })
      .then((r) =>
        prisma.wallet.count({
          where: {
            id: { in: r.map((x) => x.walletId) },
            user: { createdAt: { lt: d7ago } },
          },
        }),
      ),
    // Retenção D30: cohort
    prisma.user.count({
      where: { role: "CITIZEN", active: true, createdAt: { lt: d30ago } },
    }),
    // Retenção D30: ativos
    prisma.coinTransaction
      .groupBy({
        by: ["walletId"],
        where: { createdAt: { gte: d30ago } },
      })
      .then((r) =>
        prisma.wallet.count({
          where: {
            id: { in: r.map((x) => x.walletId) },
            user: { createdAt: { lt: d30ago } },
          },
        }),
      ),
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

  // Retenção (% de cohort que voltou)
  const d7Rate  = retentionD7cohort  > 0 ? Math.round((retentionD7active  / retentionD7cohort)  * 100) : 0
  const d30Rate = retentionD30cohort > 0 ? Math.round((retentionD30active / retentionD30cohort) * 100) : 0

  // Impacto: 5 medicamentos × 200 mL = 1 L por descarte
  const litersProtected = Math.round(totalCheckins * 5 * 0.2)

  return {
    northStar: { current: weekCheckins, target: 10, label: "Descartes/semana" },
    users: { total: totalUsers, dau: dauWallets, wau: wauWallets, newWeek: newUsersWeek, target: 100 },
    retention: { d7: d7Rate, d30: d30Rate },
    coins: { total: totalEarned, avg: coinsAvg, spent: coinsSpent, rewards: totalRewards },
    disposals: { total: totalCheckins, week: weekCheckins, gps: gpsCheckins, points: uniquePoints },
    education: { articles: articleReads, quizzes: totalQuizzes, chat: totalChat, quizAvg },
    levels: {
      semente: levelMap["SEMENTE"] ?? 0,
      broto:   levelMap["BROTO"]   ?? 0,
      arvore:  levelMap["ARVORE"]  ?? 0,
      guardiao: levelMap["GUARDIAO"] ?? 0,
      lenda:   levelMap["LENDA_ECO"] ?? 0,
    },
    streaks: { avg: streakAvg, best: streakBest, active: activeStreaks },
    missions: { completed: totalMissions, rate: missionRate },
    // Métricas técnicas sem fonte no DB — mantidas como referência estática.
    // Para valores em tempo real: integrar Lighthouse CI (tests), UptimeRobot API (uptime),
    // e medir latências de produção via AiPromptLog.latencyMs.
    tech: { uptime: 99.9, lighthouse: 92, api: 1.2, chat: 3.8, fcp: 1.3, tests: 0 },
    // Social: sem integração com APIs externas (Instagram/TikTok/LinkedIn)
    social: { ig: 0, tt: 0, li: 0, refs: totalReferrals, shares: totalShares, nps: 0 },
    impact: {
      liters: litersProtected,
      people: totalUsers,
      points: totalPoints,
      cities: uniqueCities,
    },
    // Tarefas: sem fonte no DB — alimentar manualmente ou via integração Linear/Jira
    tasks: { total: 0, done: 0, progress: 0, review: 0, blocked: 0, notStarted: 0 },
    weekly,
  }
}
