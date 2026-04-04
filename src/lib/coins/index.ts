import { prisma } from "@/lib/db/prisma"

// ---- Cálculo de nível pelo totalEarned ----
export function calcularNivel(
  totalEarned: number,
): "SEMENTE" | "BROTO" | "ARVORE" | "GUARDIAO" {
  if (totalEarned <= 100) return "SEMENTE"
  if (totalEarned <= 500) return "BROTO"
  if (totalEarned <= 2000) return "ARVORE"
  return "GUARDIAO"
}

// ---- Limites anti-abuso por evento/dia ----
const LIMITES_DIARIOS: Record<string, number> = {
  ARTICLE_READ: 5,
  REPORT_SUBMITTED: 3,
  CHECKIN: 3,
}

// ---- Recompensa por evento ----
const COIN_VALUES: Record<string, number> = {
  SIGNUP: 20,
  ARTICLE_READ: 2,
  REPORT_SUBMITTED: 5,
  STREAK_7_DAYS: 15,
  REFERRAL: 20,
  CHECKIN: 10,
}

// ---- Verifica se usuário ainda pode ganhar coins pelo evento hoje ----
export async function verificarLimiteDiario(
  userId: string,
  event: string,
): Promise<boolean> {
  const limite = LIMITES_DIARIOS[event]
  if (!limite) return true

  const inicio = new Date()
  inicio.setHours(0, 0, 0, 0)

  const count = await prisma.coinTransaction.count({
    where: {
      wallet: { userId },
      event: event as never,
      createdAt: { gte: inicio },
    },
  })

  return count < limite
}

// ---- Credita coins para um usuário ----
export async function creditCoins(
  userId: string,
  event: string,
  reference?: string,
  customAmount?: number,
): Promise<{ ok: boolean; newBalance: number; levelUp?: string }> {
  const amount = customAmount ?? COIN_VALUES[event] ?? 0
  if (amount <= 0) return { ok: false, newBalance: 0 }

  const dentroDoLimite = await verificarLimiteDiario(userId, event)
  if (!dentroDoLimite) return { ok: false, newBalance: 0 }

  let wallet = await prisma.wallet.findUnique({ where: { userId } })
  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: { userId, balance: 0, totalEarned: 0, level: "SEMENTE" },
    })
  }

  const novoBalance = wallet.balance + amount
  const novoTotal = wallet.totalEarned + amount
  const novoNivel = calcularNivel(novoTotal)
  const levelUp = novoNivel !== wallet.level ? novoNivel : undefined

  await Promise.all([
    prisma.wallet.update({
      where: { userId },
      data: {
        balance: novoBalance,
        totalEarned: novoTotal,
        level: novoNivel as never,
      },
    }),
    prisma.coinTransaction.create({
      data: {
        walletId: wallet.id,
        amount,
        event: event as never,
        reference: reference ?? null,
        note: `${event}${reference ? ` · ${reference}` : ""}`,
      },
    }),
  ])

  return { ok: true, newBalance: novoBalance, levelUp }
}

// ---- Debitar coins (resgate) ----
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
      data: { balance: newBalance },
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
