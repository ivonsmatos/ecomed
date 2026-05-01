import { Hono } from "hono";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db/prisma";

export const lgpdRouter = new Hono();

// GET /api/lgpd/exportar — exporta todos os dados do usuário autenticado
lgpdRouter.get("/exportar", async (c) => {
  const session = await auth();
  if (!session?.user?.id) return c.json({ error: "Não autorizado" }, 401);

  const userId = session.user.id;

  const [user, wallet, checkins, favorites, reports, missions, badges, rewards, notifications] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          referralCode: true,
          referredById: true,
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
      prisma.favorite.findMany({
        where: { userId },
        include: { point: { select: { name: true, address: true } } },
      }),
      prisma.report.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.userMission.findMany({
        where: { userId },
        include: { mission: { select: { slug: true, title: true, type: true } } },
        orderBy: { expiresAt: "desc" },
      }),
      prisma.userBadge.findMany({
        where: { userId },
        include: { badge: { select: { slug: true, name: true } } },
        orderBy: { earnedAt: "desc" },
      }),
      prisma.userReward.findMany({
        where: { userId },
        include: { reward: { select: { name: true, cost: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);

  const exportData = {
    exportadoEm: new Date().toISOString(),
    usuario: user,
    carteira: wallet
      ? {
          balance: wallet.balance,
          totalEarned: wallet.totalEarned,
          level: wallet.level,
          streakCurrent: wallet.streakCurrent,
          streakBest: wallet.streakBest,
          transacoes: wallet.transactions,
        }
      : null,
    checkins,
    favoritos: favorites,
    reportes: reports,
    missoes: missions.map((m) => ({
      titulo: m.mission.title,
      tipo: m.mission.type,
      progresso: m.progress,
      concluida: m.completed,
      completadaEm: m.completedAt,
      expira: m.expiresAt,
    })),
    conquistas: badges.map((b) => ({
      slug: b.badge.slug,
      nome: b.badge.name,
      ganhoEm: b.earnedAt,
    })),
    recompensas: rewards.map((r) => ({
      nome: r.reward.name,
      custo: r.reward.cost,
      status: r.status,
      criadoEm: r.createdAt,
    })),
    notificacoes: notifications.map((n) => ({
      titulo: n.title,
      corpo: n.body,
      lida: n.read,
      criadaEm: n.createdAt,
    })),
  };

  return new Response(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="ecomed-dados-${userId.slice(0, 8)}.json"`,
    },
  });
});

// DELETE /api/lgpd/excluir-conta — anonimiza e desativa a conta do usuário
lgpdRouter.delete("/excluir-conta", async (c) => {
  const session = await auth();
  if (!session?.user?.id) return c.json({ error: "Não autorizado" }, 401);

  const userId = session.user.id;

  // Soft delete: anonimiza os dados pessoais e desativa a conta
  // Mantém transações e checkins para integridade estatística (sem PII)
  await prisma.$transaction([
    // Anonimiza usuário
    prisma.user.update({
      where: { id: userId },
      data: {
        name: "Usuário Removido",
        email: `removed_${userId}@ecomed.eco.br`,
        image: null,
        passwordHash: null,
        active: false,
        referralCode: `removed_${userId}`,
      },
    }),
    // Remove sessões ativas
    prisma.session.deleteMany({ where: { userId } }),
    // Remove subscriptions de push
    prisma.pushSubscription.deleteMany({ where: { userId } }),
    // Remove favoritos
    prisma.favorite.deleteMany({ where: { userId } }),
    // Remove notificações
    prisma.notification.deleteMany({ where: { userId } }),
  ]);

  return c.json({
    ok: true,
    message: "Conta anonimizada com sucesso. Seus dados pessoais foram removidos.",
  });
});
