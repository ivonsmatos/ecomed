import { timingSafeEqual } from "crypto"
import { prisma } from "@/lib/db/prisma"

function authorized(request: Request): boolean {
  const expected = process.env.CRON_SECRET
  const received = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  if (!expected || !received || expected.length !== received.length) return false
  return timingSafeEqual(Buffer.from(expected), Buffer.from(received))
}

export async function POST(request: Request) {
  if (!authorized(request)) return Response.json({ error: "Não autorizado" }, { status: 401 })

  const now = new Date()
  const [prompts, feedbacks] = await prisma.$transaction([
    prisma.aiPromptLog.updateMany({
      where: { expiresAt: { lte: now }, anonymizedAt: null },
      data: {
        userId: null,
        prompt: "[anonimizado por retenção]",
        response: null,
        ip: null,
        anonymizedAt: now,
      },
    }),
    prisma.chatFeedback.updateMany({
      where: { expiresAt: { lte: now }, anonymizedAt: null },
      data: {
        userId: null,
        pergunta: "[anonimizado por retenção]",
        resposta: "[anonimizado por retenção]",
        comment: null,
        anonymizedAt: now,
      },
    }),
  ])

  return Response.json({ ok: true, prompts: prompts.count, feedbacks: feedbacks.count })
}
