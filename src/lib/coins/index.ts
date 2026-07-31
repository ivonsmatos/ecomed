import { prisma } from "@/lib/db/prisma"
import type { Prisma } from "@/generated/prisma/client"
import { sendPushToUser } from "@/lib/push"
import { APP_ROUTES } from "@/lib/routes"
import {
  COIN_VALUES,
  COM_MULTIPLICADOR,
  ISENTO_TETO_GLOBAL,
  LIMITES_DIARIOS,
  LIMITES_MENSAIS,
  TETO_DIARIO_GLOBAL,
  calcularNivel,
  calcularStreak,
  diaUTC,
  inicioMesUTC,
  inicioSemanaUTC,
  multiplicadorNivel,
} from "./levels"

export { calcularNivel } from "./levels"

const NIVEL_LABEL: Record<string, string> = {
  SEMENTE: "Semente 🌱",
  BROTO: "Broto 🌿",
  ARVORE: "Árvore 🌳",
  GUARDIAO: "Guardião 🛡️",
  LENDA_ECO: "Lenda Eco ⭐",
}

// ---- Verifica teto diário global e limite por categoria; registra no tracker ----
async function verificarERegistrar(
  tx: Prisma.TransactionClient,
  userId: string,
  event: string,
  amount: number,
): Promise<boolean> {
  const hoje = diaUTC()

  if (!ISENTO_TETO_GLOBAL.has(event)) {
    const totais = await tx.dailyLimitTracker.findMany({ where: { userId, date: hoje } })
    const totalHoje = totais.reduce((s, t) => s + t.coins, 0)
    if (totalHoje + amount > TETO_DIARIO_GLOBAL) return false
  }

  const limite = LIMITES_DIARIOS[event]
  if (limite !== undefined) {
    const catRow = await tx.dailyLimitTracker.findUnique({
      where: { userId_date_category: { userId, date: hoje, category: event } },
    })
    if (catRow && catRow.count >= limite) return false
  }

  // Verificar limite mensal
  const limiteMensal = LIMITES_MENSAIS[event]
  if (limiteMensal !== undefined) {
    const inicioMes = inicioMesUTC()
    const contMes = await tx.dailyLimitTracker.findMany({
      where: { userId, category: event, date: { gte: inicioMes } },
    })
    const totalMes = contMes.reduce((s, t) => s + t.count, 0)
    if (totalMes >= limiteMensal) return false
  }

  // Registrar no tracker
  if (!["ADMIN_GRANT", "ADJUSTMENT", "REDEMPTION"].includes(event)) {
    await tx.dailyLimitTracker.upsert({
      where: { userId_date_category: { userId, date: hoje, category: event } },
      update: { count: { increment: 1 }, coins: { increment: amount } },
      create: { userId, date: hoje, category: event, count: 1, coins: amount },
    })
  }

  return true
}

// ---- Credita coins para um usuário ----
export async function creditCoins(
  userId: string,
  event: string,
  reference?: string,
  customAmount?: number,
  label?: string,
  idempotencyKey?: string,
): Promise<{ ok: boolean; newBalance: number; levelUp?: string; streakBonus?: string }> {
  const amount = customAmount ?? COIN_VALUES[event] ?? 0
  if (amount <= 0) return { ok: false, newBalance: 0 }

  const run = () => prisma.$transaction(async (tx) => {
    if (idempotencyKey) {
      const existing = await tx.coinTransaction.findUnique({ where: { idempotencyKey } })
      if (existing) {
        const current = await tx.wallet.findUnique({ where: { id: existing.walletId } })
        return {
          ok: true,
          newBalance: current?.balance ?? 0,
          levelUp: undefined,
          milestone: null,
          idempotent: true,
        }
      }
    }

    const wallet = await tx.wallet.upsert({
      where: { userId },
      update: {},
      create: { userId, balance: 0, totalEarned: 0, level: "SEMENTE" },
    })

    let creditedAmount = amount
    if (COM_MULTIPLICADOR.has(event)) {
      creditedAmount = Math.round(creditedAmount * multiplicadorNivel(wallet.level))
    }

    const dentroDoLimite = await verificarERegistrar(tx, userId, event, creditedAmount)
    if (!dentroDoLimite) {
      return {
        ok: false,
        newBalance: wallet.balance,
        levelUp: undefined,
        milestone: null,
        idempotent: false,
      }
    }

    const { novoStreak, novoStreakBest, milestone } = calcularStreak(
      wallet.streakCurrent,
      wallet.streakBest,
      wallet.lastActivityAt,
    )
    const novoBalance = wallet.balance + creditedAmount
    const novoTotal = wallet.totalEarned + creditedAmount
    const novoNivel = calcularNivel(novoTotal) as string
    const levelUp = novoNivel !== wallet.level ? novoNivel : undefined
    const inicioSemana = inicioSemanaUTC()
    const precisaResetarSemanal =
      !wallet.weeklyCoinsResetAt || wallet.weeklyCoinsResetAt < inicioSemana

    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: { increment: creditedAmount },
        totalEarned: { increment: creditedAmount },
        level: novoNivel as never,
        streakCurrent: novoStreak,
        streakBest: novoStreakBest,
        lastActivityAt: new Date(),
        weeklyCoins: precisaResetarSemanal ? creditedAmount : { increment: creditedAmount },
        weeklyCoinsResetAt: precisaResetarSemanal ? inicioSemana : undefined,
      },
    })
    await tx.coinTransaction.create({
      data: {
        walletId: wallet.id,
        amount: creditedAmount,
        event: event as never,
        reference: reference ?? null,
        note: label ?? `${event}${reference ? ` · ${reference}` : ""}`,
        idempotencyKey: idempotencyKey ?? null,
      },
    })

    return { ok: true, newBalance: novoBalance, levelUp, milestone, idempotent: false }
  }, { isolationLevel: "Serializable" })

  let result: Awaited<ReturnType<typeof run>> | undefined
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      result = await run()
      break
    } catch (error) {
      const code = (error as { code?: string }).code
      if (code !== "P2034" || attempt === 2) throw error
    }
  }
  if (!result) throw new Error("Falha ao concluir transação de EcoCoins")
  if (!result.ok) return { ok: false, newBalance: result.newBalance }

  // Bônus de streak (recursivo, não reentra no limite pois STREAK_* são isentos)
  let streakBonus: string | undefined
  if (result.milestone && !result.idempotent) {
    await creditCoins(
      userId,
      result.milestone,
      reference,
      undefined,
      undefined,
      `STREAK:${userId}:${result.milestone}:${diaUTC().toISOString()}`,
    )
    streakBonus = result.milestone
  }

  // Push de level-up
  if (result.levelUp && !result.idempotent) {
    sendPushToUser(userId, {
      title: "Você subiu de nível! 🎊",
      body: `Agora você é ${NIVEL_LABEL[result.levelUp] ?? result.levelUp}. Continue assim!`,
      url: APP_ROUTES.rewards,
      tag: `levelup-${result.levelUp}`,
    }).catch((err) => console.error("[push:levelup] falhou:", err))
  }

  // Push de milestone de streak
  if (result.milestone && !result.idempotent) {
    const dias = result.milestone === "STREAK_30_DAYS" ? 30 : result.milestone === "STREAK_7_DAYS" ? 7 : 3
    sendPushToUser(userId, {
      title: `${dias} dias seguidos! 🔥`,
      body: `Sua sequência continua. Bônus de EcoCoins creditado.`,
      url: APP_ROUTES.rewards,
      tag: `streak-${result.milestone}`,
    }).catch((err) => console.error("[push:streak] falhou:", err))
  }

  return { ok: true, newBalance: result.newBalance, levelUp: result.levelUp, streakBonus }
}

// ---- Debitar coins (resgate de recompensa) ----
export async function debitCoins(
  userId: string,
  amount: number,
  note?: string,
  idempotencyKey?: string,
): Promise<{ ok: boolean; newBalance?: number }> {
  if (!Number.isSafeInteger(amount) || amount <= 0) return { ok: false }

  return prisma.$transaction(
    (tx) => debitCoinsInTransaction(tx, userId, amount, note, idempotencyKey),
    { isolationLevel: "Serializable" },
  )
}

export async function debitCoinsInTransaction(
  tx: Prisma.TransactionClient,
  userId: string,
  amount: number,
  note?: string,
  idempotencyKey?: string,
): Promise<{ ok: boolean; newBalance?: number }> {
  if (!Number.isSafeInteger(amount) || amount <= 0) return { ok: false }
  if (idempotencyKey) {
    const existing = await tx.coinTransaction.findUnique({ where: { idempotencyKey } })
    if (existing) {
      const current = await tx.wallet.findUnique({ where: { id: existing.walletId } })
      return { ok: true, newBalance: current?.balance }
    }
  }
  const wallet = await tx.wallet.findUnique({ where: { userId } })
  if (!wallet) return { ok: false }
  const updated = await tx.wallet.updateMany({
    where: { id: wallet.id, balance: { gte: amount } },
    data: { balance: { decrement: amount } },
  })
  if (updated.count !== 1) return { ok: false }
  await tx.coinTransaction.create({
    data: {
      walletId: wallet.id,
      amount: -amount,
      event: "REDEMPTION" as never,
      note: note ?? null,
      idempotencyKey: idempotencyKey ?? null,
    },
  })
  return { ok: true, newBalance: wallet.balance - amount }
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
    await creditCoins(
      userId,
      "BADGE_EARNED",
      badge.id,
      badge.coinReward,
      undefined,
      `BADGE_EARNED:${userId}:${badge.id}`,
    )
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
