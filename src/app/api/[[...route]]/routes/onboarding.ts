import { Hono } from "hono"
import { auth } from "@/../auth"
import { concluirOnboardingComBoasVindas } from "@/lib/coins/onboarding"

const onboarding = new Hono()

// POST /api/onboarding/concluir — credita coins de boas-vindas (único por usuário)
onboarding.post("/concluir", async (c) => {
  const session = await auth()
  if (!session?.user?.id) return c.json({ error: "Não autenticado." }, 401)

  const result = await concluirOnboardingComBoasVindas(session.user.id)
  return c.json({
    ok: result.ok,
    creditedSignup: result.creditedSignup,
    creditedOnboarding: result.creditedOnboarding,
  })
})

export default onboarding
