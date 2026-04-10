import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { auth } from "@/../auth"
import { prisma } from "@/lib/db/prisma"

const rewards = new Hono()

const NIVEL_ORDEM = ["SEMENTE", "BROTO", "ARVORE", "GUARDIAO", "LENDA_ECO"]

function nivelAtingido(nivelUsuario: string, nivelMin: string): boolean {
  return NIVEL_ORDEM.indexOf(nivelUsuario) >= NIVEL_ORDEM.indexOf(nivelMin)
}

// GET /api/rewards — catálogo de recompensas disponíveis
rewards.get("/", async (c) => {
  const session = await auth()
  if (!session?.user?.id) return c.json({ error: "Não autenticado." }, 401)
  const userId = session.user.id

  const [catalog, wallet, resgatesRecentes] = await Promise.all([
    prisma.rewardCatalog.findMany({
      where: { active: true },
      orderBy: [{ minLevel: "asc" }, { cost: "asc" }],
    }),
    prisma.wallet.findUnique({ where: { userId } }),
    prisma.userReward.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
  ])

  const balance = wallet?.balance ?? 0
  const level = wallet?.level ?? "SEMENTE"

  const dto = catalog.map((r) => {
    const podeResgatar =
      balance >= r.cost && nivelAtingido(level, r.minLevel) && (r.stock === null || r.stock > 0)

    // Verificar cooldown
    const ultimoResgate = resgatesRecentes.find((ur) => ur.rewardId === r.id)
    let emCooldown = false
    if (ultimoResgate && r.cooldownDays > 0) {
      const proxResgate = new Date(ultimoResgate.createdAt)
      proxResgate.setDate(proxResgate.getDate() + r.cooldownDays)
      emCooldown = new Date() < proxResgate
    }

    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      description: r.description,
      tier: r.tier,
      cost: r.cost,
      minLevel: r.minLevel,
      stock: r.stock,
      cooldownDays: r.cooldownDays,
      podeResgatar: podeResgatar && !emCooldown,
      emCooldown,
    }
  })

  return c.json({ balance, level, rewards: dto })
})

// GET /api/rewards/my — histórico de resgates do usuário
rewards.get("/my", async (c) => {
  const session = await auth()
  if (!session?.user?.id) return c.json({ error: "Não autenticado." }, 401)
  const userId = session.user.id

  const resgates = await prisma.userReward.findMany({
    where: { userId },
    include: { reward: true },
    orderBy: { createdAt: "desc" },
  })

  return c.json(
    resgates.map((r) => ({
      id: r.id,
      rewardName: r.reward.name,
      rewardSlug: r.reward.slug,
      cost: r.reward.cost,
      status: r.status,
      createdAt: r.createdAt,
    })),
  )
})

// POST /api/rewards/:id/redeem — resgatar recompensa
rewards.post(
  "/:id/redeem",
  zValidator("param", z.object({ id: z.string().cuid() })),
  async (c) => {
    const session = await auth()
    if (!session?.user?.id) return c.json({ error: "Não autenticado." }, 401)
    const userId = session.user.id
    const { id } = c.req.valid("param")

    const [reward, wallet] = await Promise.all([
      prisma.rewardCatalog.findUnique({ where: { id, active: true } }),
      prisma.wallet.findUnique({ where: { userId } }),
    ])

    if (!reward) return c.json({ error: "Recompensa não encontrada." }, 404)
    if (!wallet) return c.json({ error: "Carteira não encontrada." }, 404)

    // Verificar nível mínimo
    if (!nivelAtingido(wallet.level, reward.minLevel)) {
      return c.json({ error: `Nível mínimo necessário: ${reward.minLevel}` }, 403)
    }

    // Verificar saldo
    if (wallet.balance < reward.cost) {
      return c.json({ error: "Saldo insuficiente." }, 402)
    }

    // Verificar estoque
    if (reward.stock !== null && reward.stock <= 0) {
      return c.json({ error: "Recompensa esgotada." }, 409)
    }

    // Verificar cooldown
    if (reward.cooldownDays > 0) {
      const ultimoResgate = await prisma.userReward.findFirst({
        where: { userId, rewardId: id },
        orderBy: { createdAt: "desc" },
      })
      if (ultimoResgate) {
        const proxResgate = new Date(ultimoResgate.createdAt)
        proxResgate.setDate(proxResgate.getDate() + reward.cooldownDays)
        if (new Date() < proxResgate) {
          return c.json({
            error: `Você só pode resgatar esta recompensa novamente após ${reward.cooldownDays} dias.`,
            nextAvailableAt: proxResgate,
          }, 409)
        }
      }
    }

    // Transação atômica: re-verificar estoque/saldo, debitar, criar registro, decrementar estoque
    let newBalance: number
    let userRewardId: string
    try {
      await prisma.$transaction(async (tx) => {
        const [latestReward, latestWallet] = await Promise.all([
          tx.rewardCatalog.findUnique({ where: { id, active: true } }),
          tx.wallet.findUnique({ where: { userId } }),
        ])

        if (!latestReward || (latestReward.stock !== null && latestReward.stock <= 0)) {
          throw Object.assign(new Error("Recompensa esgotada."), { statusCode: 409 })
        }
        if (!latestWallet || latestWallet.balance < reward.cost) {
          throw Object.assign(new Error("Saldo insuficiente."), { statusCode: 402 })
        }

        const updatedWallet = await tx.wallet.update({
          where: { userId },
          data: { balance: { decrement: reward.cost } },
          select: { balance: true, id: true },
        })
        newBalance = updatedWallet.balance

        await tx.coinTransaction.create({
          data: {
            walletId: updatedWallet.id,
            amount: -reward.cost,
            event: "REDEMPTION" as never,
            note: `Resgate: ${reward.name}`,
          },
        })

        const created = await tx.userReward.create({
          data: { userId, rewardId: id, status: "PENDING" },
        })
        userRewardId = created.id

        if (latestReward.stock !== null) {
          await tx.rewardCatalog.update({ where: { id }, data: { stock: { decrement: 1 } } })
        }
      })
    } catch (err) {
      const e = err as Error & { statusCode?: number }
      const status = (e.statusCode ?? 500) as 402 | 409 | 500
      return c.json({ error: e.message ?? "Erro ao processar resgate." }, status)
    }

    return c.json({
      ok: true,
      rewardName: reward.name,
      coinsSpent: reward.cost,
      newBalance: newBalance!,
      userRewardId: userRewardId!,
      status: "PENDING",
    })
  },
)

export default rewards
