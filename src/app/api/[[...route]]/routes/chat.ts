import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { auth } from "@/../auth";
import { checkRateLimit } from "@/lib/ratelimit";
import { prisma } from "@/lib/db/prisma";
import { creditCoins } from "@/lib/coins";

const app = new Hono();

const chatSchema = z.object({
  pergunta: z.string().min(3).max(1000),
});

const feedbackSchema = z.object({
  messageId: z.string().min(1).max(36),
  pergunta: z.string().min(1).max(1000),
  resposta: z.string().min(1).max(5000),
  rating: z.enum(["positive", "negative"]),
  comment: z.string().max(500).optional(),
});

// POST /api/chat
app.post("/", zValidator("json", chatSchema), async (c) => {
  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
  const { success } = await checkRateLimit("chat", ip);
  if (!success) return c.json({ error: "Muitas requisições. Tente em instantes." }, 429);

  const { pergunta } = c.req.valid("json");
  const iaUrl = process.env.IA_SERVICE_URL;
  const iaToken = process.env.IA_SERVICE_TOKEN;

  if (!iaUrl || !iaToken) {
    return c.json({ error: "Serviço de IA não configurado." }, 503);
  }

  try {
    const res = await fetch(`${iaUrl}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${iaToken}`,
      },
      body: JSON.stringify({ pergunta }),
      signal: AbortSignal.timeout(55_000),
    });

    if (!res.ok) {
      const status = res.status === 503 ? 503 : 502;
      return c.json({ error: "Erro ao consultar o EcoBot. Tente novamente." }, status);
    }

    const data: { resposta: string } = await res.json();
    const messageId = crypto.randomUUID();
    return c.json({ resposta: data.resposta, messageId });
  } catch (err) {
    const isTimeout =
      err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
    if (isTimeout) {
      return c.json(
        { error: "O EcoBot demorou para responder. Tente uma pergunta mais curta." },
        504,
      );
    }
    return c.json({ error: "Erro de conexão com o EcoBot. Tente novamente." }, 502);
  }
});

// POST /api/chat/feedback — registra avaliação 👍/👎 e credita EcoCoin
app.post("/feedback", zValidator("json", feedbackSchema), async (c) => {
  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
  const { success } = await checkRateLimit("chat", ip);
  if (!success) return c.json({ error: "Muitas requisições. Tente em instantes." }, 429);

  const session = await auth();
  const { messageId, pergunta, resposta, rating, comment } = c.req.valid("json");

  // Impedir avaliação duplicada da mesma mensagem
  const jaAvaliou = await prisma.chatFeedback.findFirst({ where: { messageId } });
  if (jaAvaliou) return c.json({ ok: false, reason: "ja_avaliado" });

  await prisma.chatFeedback.create({
    data: {
      userId: session?.user?.id ?? null,
      messageId,
      pergunta,
      resposta,
      rating,
      comment: comment ?? null,
    },
  });

  // Creditar ECOBOT_RATING apenas para usuários autenticados
  let coinsEarned = 0;
  if (session?.user?.id) {
    const result = await creditCoins(session.user.id, "ECOBOT_RATING", messageId);
    if (result.ok) coinsEarned = 1;
  }

  return c.json({ ok: true, coinsEarned });
});

export const chatRouter = app;

