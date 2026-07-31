import { Hono } from "hono"
import { auth } from "@/../auth"
import { exportUserData } from "@/lib/lgpd/export-user-data"
import { deleteUserData } from "@/lib/lgpd/delete-user-data"

export const lgpdRouter = new Hono()

lgpdRouter.get("/exportar", async (c) => {
  const session = await auth()
  if (!session?.user?.id) return c.json({ error: "Não autorizado" }, 401)

  const exportData = await exportUserData(session.user.id)
  return new Response(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="ecomed-dados-${session.user.id.slice(0, 8)}.json"`,
      "Cache-Control": "no-store",
    },
  })
})

lgpdRouter.delete("/excluir-conta", async (c) => {
  const session = await auth()
  if (!session?.user?.id) return c.json({ error: "Não autorizado" }, 401)

  await deleteUserData(session.user.id)
  return c.json({
    ok: true,
    message: "Conta anonimizada. Sessões e dados pessoais removíveis foram excluídos.",
  })
})
