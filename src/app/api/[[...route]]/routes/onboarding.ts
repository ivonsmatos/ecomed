import { Hono } from "hono"
import { auth } from "@/../auth"
import { prisma } from "@/lib/db/prisma"
import { creditCoins } from "@/lib/coins"

const onboarding = new Hono()

// POST /api/onboarding/concluir — credita coins de boas-vindas (único por usuário)
onboarding.post("/concluir", async (c) => {
  const session = await auth()
  if (!session?.user?.id) return c.json({ error: "Não autenticado." }, 401)

  // Verificar se já recebeu o bônus de cadastro
  const wallet = await prisma.wallet.findUnique({ where: { userId: session.user.id } })

  const jaRecebeu = wallet
    ? await prisma.coinTransaction.findFirst({
        where: { walletId: wallet.id, event: "SIGNUP" },
      })
    : null

  if (!jaRecebeu) {
    await creditCoins(session.user.id, "SIGNUP")
  }

  return c.json({ ok: true })
})

export default onboarding
