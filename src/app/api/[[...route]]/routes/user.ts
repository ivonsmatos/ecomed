import { Hono } from "hono"
import { auth } from "@/../auth"
import { prisma } from "@/lib/db/prisma"

export const userRouter = new Hono()

/**
 * DELETE /api/user
 *
 * Exclusão / anonimização de conta conforme LGPD (Lei 13.709/2018).
 *
 * O que é removido imediatamente:
 *   - Dados pessoais: name → "Usuário Removido", email → uuid@deleted.ecomed.eco.br, image → null
 *   - Push subscriptions (dados de device)
 *   - Conta desativada (active = false)
 *
 * O que é MANTIDO por obrigação legal / auditoria:
 *   - CoinTransactions (histórico financeiro)
 *   - Checkins (registros de descarte — dado ambiental, não pessoal)
 *   - AiPromptLogs (userId desvinculado via onDelete: SetNull já no schema)
 *   - UserMissions / UserBadges (progresso anônimo)
 *
 * Para exclusão total, o usuário pode solicitar via privacidade@ecomed.eco.br
 * e o DPO processa manualmente em até 15 dias úteis (art. 18 LGPD).
 */
userRouter.delete("/", async (c) => {
  const session = await auth()
  if (!session?.user?.id) {
    return c.json({ error: "Não autorizado" }, 401)
  }

  const userId = session.user.id
  const deletedEmail = `${userId}@deleted.ecomed.eco.br`

  await prisma.$transaction([
    // 1. Anonimizar dados pessoais
    prisma.user.update({
      where: { id: userId },
      data: {
        name: "Usuário Removido",
        email: deletedEmail,
        image: null,
        active: false,
      },
    }),
    // 2. Remover push subscriptions (dados de device)
    prisma.pushSubscription.deleteMany({ where: { userId } }),
    // 3. Remover sessões ativas (NextAuth)
    prisma.session.deleteMany({ where: { userId } }),
    // 4. Remover contas OAuth vinculadas
    prisma.account.deleteMany({ where: { userId } }),
  ])

  return c.json({
    ok: true,
    message:
      "Conta anonimizada com sucesso. Seus dados pessoais foram removidos. " +
      "Para exclusão total dos registros de atividade, envie solicitação para privacidade@ecomed.eco.br.",
  })
})

/**
 * GET /api/user/me — retorna dados básicos do usuário logado (útil para o frontend)
 */
userRouter.get("/me", async (c) => {
  const session = await auth()
  if (!session?.user?.id) {
    return c.json({ error: "Não autorizado" }, 401)
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      active: true,
      createdAt: true,
      wallet: {
        select: {
          balance: true,
          totalEarned: true,
          level: true,
          streakCurrent: true,
          streakBest: true,
        },
      },
    },
  })

  if (!user) return c.json({ error: "Usuário não encontrado" }, 404)

  return c.json(user)
})
