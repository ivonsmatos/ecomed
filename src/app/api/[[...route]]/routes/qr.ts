import { Hono } from "hono"
import { auth } from "@/../auth"
import { gerarTokenQR } from "@/lib/qr/token"

const qr = new Hono()

// GET /api/qr/meu-codigo — cidadão busca o token para o seu QR Code
qr.get("/meu-codigo", async (c) => {
  const session = await auth()
  if (!session?.user?.id) return c.json({ error: "Não autenticado." }, 401)

  const token = gerarTokenQR(session.user.id)
  return c.json({ token })
})

export default qr
