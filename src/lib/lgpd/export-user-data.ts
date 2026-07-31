import { prisma } from "@/lib/db/prisma"

export async function exportUserData(userId: string) {
  const [
    user,
    wallet,
    checkins,
    favorites,
    reports,
    missions,
    badges,
    rewards,
    notifications,
    quizAttempts,
    feedbacks,
    aiPrompts,
    partner,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        active: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        referralCode: true,
        referredById: true,
        referrals: { select: { id: true, createdAt: true } },
      },
    }),
    prisma.wallet.findUnique({
      where: { userId },
      include: { transactions: { orderBy: { createdAt: "desc" } } },
    }),
    prisma.checkin.findMany({
      where: { userId },
      include: { point: { select: { name: true, address: true, city: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.favorite.findMany({ where: { userId }, include: { point: true } }),
    prisma.report.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.userMission.findMany({
      where: { userId },
      include: { mission: true },
      orderBy: { expiresAt: "desc" },
    }),
    prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: "desc" },
    }),
    prisma.userReward.findMany({
      where: { userId },
      include: { reward: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.quizAttempt.findMany({
      where: { userId },
      include: { quiz: { select: { slug: true, title: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.chatFeedback.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.aiPromptLog.findMany({
      where: { userId },
      select: {
        messageId: true,
        prompt: true,
        response: true,
        model: true,
        status: true,
        createdAt: true,
        expiresAt: true,
        retentionPolicyVersion: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.partner.findUnique({ where: { userId }, include: { points: true } }),
  ])

  return {
    schemaVersion: "2026-07",
    exportadoEm: new Date().toISOString(),
    usuario: user,
    carteira: wallet,
    checkins,
    favoritos: favorites,
    reportes: reports,
    missoes: missions,
    conquistas: badges,
    recompensas: rewards,
    notificacoes: notifications,
    quizzes: quizAttempts,
    feedbacksEcoBot: feedbacks,
    conversasEcoBot: aiPrompts,
    parceiro: partner,
    observacoes: {
      consentimentoCookies:
        "A preferência de cookies fica no navegador e deve ser exportada localmente pelo titular.",
    },
  }
}
