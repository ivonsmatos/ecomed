import { NextRequest } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { ensureMissionsAtivas } from "@/lib/coins/missions"

// GET /api/cron/ensure-missoes — cria proativamente missoes diarias/semanais
// para usuarios ativos (interagiram nos ultimos 30 dias). Roda apos /reset-missoes.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const trintaDiasAtras = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const ativos = await prisma.user.findMany({
    where: {
      active: true,
      role: "CITIZEN",
      OR: [
        { wallet: { transactions: { some: { createdAt: { gt: trintaDiasAtras } } } } },
        { checkins: { some: { createdAt: { gt: trintaDiasAtras } } } },
      ],
    },
    select: { id: true },
    take: 5000,
  })

  let processed = 0
  let errors = 0
  for (const u of ativos) {
    try {
      await ensureMissionsAtivas(u.id)
      processed++
    } catch {
      errors++
    }
  }

  return Response.json({
    ok: true,
    eligible: ativos.length,
    processed,
    errors,
    timestamp: new Date().toISOString(),
  })
}
