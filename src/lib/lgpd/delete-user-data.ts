import { prisma } from "@/lib/db/prisma"

export async function deleteUserData(userId: string) {
  const anonymizedEmail = `removed_${userId}@deleted.invalid`
  const now = new Date()

  await prisma.$transaction([
    prisma.account.deleteMany({ where: { userId } }),
    prisma.session.deleteMany({ where: { userId } }),
    prisma.passwordResetToken.deleteMany({ where: { userId } }),
    prisma.pushSubscription.deleteMany({ where: { userId } }),
    prisma.favorite.deleteMany({ where: { userId } }),
    prisma.notification.deleteMany({ where: { userId } }),
    prisma.report.updateMany({ where: { userId }, data: { description: null, userId: null } }),
    prisma.chatFeedback.updateMany({
      where: { userId },
      data: {
        userId: null,
        pergunta: "[anonimizado a pedido do titular]",
        resposta: "[anonimizado a pedido do titular]",
        comment: null,
        anonymizedAt: now,
      },
    }),
    prisma.aiPromptLog.updateMany({
      where: { userId },
      data: {
        userId: null,
        prompt: "[anonimizado a pedido do titular]",
        response: null,
        ip: null,
        anonymizedAt: now,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        name: "Usuário Removido",
        email: anonymizedEmail,
        image: null,
        passwordHash: null,
        active: false,
        referralCode: `removed_${userId}`,
        referredById: null,
      },
    }),
  ])

  return { anonymizedAt: now, anonymizedEmail }
}
