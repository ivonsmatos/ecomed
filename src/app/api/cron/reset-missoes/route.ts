import { NextRequest } from "next/server"
import { prisma } from "@/lib/db/prisma"

// GET /api/cron/reset-missoes — chamado pelo cron às 00:00 BRT (03:00 UTC)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const agora = new Date()

  // Resetar progresso de missões diárias expiradas
  const { count } = await prisma.userMission.updateMany({
    where: {
      mission: { type: "DAILY" },
      expiresAt: { lt: agora },
      completed: false,
    },
    data: { progress: 0 },
  })

  return Response.json({ ok: true, resetadas: count, timestamp: agora.toISOString() })
}
