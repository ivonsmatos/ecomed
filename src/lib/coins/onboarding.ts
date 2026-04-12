import { prisma } from "@/lib/db/prisma"
import { creditCoins } from "@/lib/coins"

type ResultadoOnboarding = {
  ok: boolean
  creditedSignup: boolean
  creditedOnboarding: boolean
}

// Conclui onboarding de forma idempotente e centralizada.
export async function concluirOnboardingComBoasVindas(userId: string): Promise<ResultadoOnboarding> {
  const wallet = await prisma.wallet.findUnique({ where: { userId }, select: { id: true } })

  const [jaRecebeuSignup, jaRecebeuOnboarding] = wallet
    ? await Promise.all([
        prisma.coinTransaction.findFirst({
          where: { walletId: wallet.id, event: "SIGNUP" },
          select: { id: true },
        }),
        prisma.coinTransaction.findFirst({
          where: { walletId: wallet.id, event: "ONBOARDING_SCREENS" },
          select: { id: true },
        }),
      ])
    : [null, null]

  let creditedSignup = false
  let creditedOnboarding = false

  if (!jaRecebeuSignup) {
    const resultSignup = await creditCoins(userId, "SIGNUP")
    creditedSignup = resultSignup.ok
  }

  if (!jaRecebeuOnboarding) {
    const resultOnboarding = await creditCoins(userId, "ONBOARDING_SCREENS")
    creditedOnboarding = resultOnboarding.ok
  }

  return {
    ok: true,
    creditedSignup,
    creditedOnboarding,
  }
}
