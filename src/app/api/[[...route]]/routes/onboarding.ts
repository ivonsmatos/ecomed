import { Hono } from "hono"
import { auth } from "@/../auth"
import { prisma } from "@/lib/db/prisma"
import { creditCoins } from "@/lib/coins"

const onboarding = new Hono()

// POST /api/onboarding/concluir — credita coins de boas-vindas (único por usuário)
onboarding.post("/concluir", async (c) => {
  const session = await auth()
  if (!session?.user?.id) return c.json({ error: "Não autenticado." }, 401)

  const userId = session.user.id

  // Creditar SIGNUP se ainda não recebeu
  const wallet = await prisma.wallet.findUnique({ where: { userId } })
  const jaRecebeuSignup = wallet
    ? await prisma.coinTransaction.findFirst({
        where: { walletId: wallet.id, event: "SIGNUP" },
      })
    : null

  if (!jaRecebeuSignup) {
    await creditCoins(userId, "SIGNUP")
  }

  // Creditar ONBOARDING_SCREENS se ainda não recebeu (marca que o onboarding foi concluído)
  const jaRecebeuOnboarding = wallet
    ? await prisma.coinTransaction.findFirst({
        where: { walletId: wallet.id, event: "ONBOARDING_SCREENS" },
      })
    : null

  if (!jaRecebeuOnboarding) {
    await creditCoins(userId, "ONBOARDING_SCREENS")
  }

  return c.json({ ok: true })
})

export default onboarding
