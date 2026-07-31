import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { auth } from "@/../auth";
import { checkRateLimit } from "@/lib/ratelimit";
import { prisma } from "@/lib/db/prisma";
import { creditCoins } from "@/lib/coins";
import { aplicarProgressoMissoes } from "@/lib/coins/missions";

const app = new Hono();

const chatSchema = z.object({
  pergunta: z.string().min(3).max(1000),
});

const feedbackSchema = z.object({
  messageId: z.string().min(1).max(36),
  rating: z.enum(["positive", "negative"]),
});

// Persiste log de IA sem bloquear/derrubar a request principal.
async function logPrompt(input: {
  userId: string | null;
  messageId: string;
  prompt: string;
  response: string | null;
  model: string | null;
  latencyMs: number;
  ragScore: number | null;
  status: "ok" | "timeout" | "error" | "rate_limited";
  errorCode: string | null;
  ip: string | null;
}) {
  try {
    await prisma.aiPromptLog.create({
      data: {
        ...input,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        retentionPolicyVersion: "2026-07",
      },
    });
  } catch (e) {
    // Falha de log não pode quebrar o chat — apenas reporta no stderr.
    console.error("[ai-prompt-log] insert failed:", e);
  }
}

// POST /api/chat
app.post("/", zValidator("json", chatSchema), async (c) => {
  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
  const messageId = crypto.randomUUID();
  const startedAt = Date.now();

  const { success } = await checkRateLimit("chat", ip);
  if (!success) {
    const { pergunta: perguntaTmp } = c.req.valid("json");
    await logPrompt({
      userId: null,
      messageId,
      prompt: perguntaTmp,
      response: null,
      model: null,
      latencyMs: Date.now() - startedAt,
      ragScore: null,
      status: "rate_limited",
      errorCode: "429",
      ip,
    });
    return c.json({ error: "Muitas requisições. Tente em instantes." }, 429);
  }

  const { pergunta } = c.req.valid("json");
  const iaUrl = process.env.IA_SERVICE_URL;
  const iaToken = process.env.IA_SERVICE_TOKEN;
  const session = await auth();
  const userId = session?.user?.id ?? null;

  if (!iaUrl || !iaToken) {
    await logPrompt({
      userId,
      messageId,
      prompt: pergunta,
      response: null,
      model: null,
      latencyMs: Date.now() - startedAt,
      ragScore: null,
      status: "error",
      errorCode: "no_config",
      ip,
    });
    return c.json({ error: "Serviço de IA não configurado." }, 503);
  }

  try {
    const res = await fetch(`${iaUrl}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${iaToken}`,
      },
      body: JSON.stringify({ pergunta, session_id: userId ?? ip }),
      signal: AbortSignal.timeout(55_000),
    });

    if (!res.ok) {
      const status = res.status === 503 ? 503 : 502;
      await logPrompt({
        userId,
        messageId,
        prompt: pergunta,
        response: null,
        model: null,
        latencyMs: Date.now() - startedAt,
        ragScore: null,
        status: "error",
        errorCode: `ia_${res.status}`,
        ip,
      });
      return c.json({ error: "Erro ao consultar o EcoBot. Tente novamente." }, status);
    }

    const data: { resposta: string; model?: string; ragScore?: number } = await res.json();
    const latencyMs = Date.now() - startedAt;

    if (userId && pergunta.trim().length >= 10) {
      const coinResult = await creditCoins(
        userId,
        "ECOBOT_QUESTION",
        messageId,
        undefined,
        "Pergunta ao EcoBot",
        `ECOBOT_QUESTION:${messageId}`,
      );
      if (coinResult.ok) {
        await aplicarProgressoMissoes(userId, "ECOBOT_QUESTION").catch(() => null);
      }
    }

    await logPrompt({
      userId,
      messageId,
      prompt: pergunta,
      response: data.resposta,
      model: data.model ?? null,
      latencyMs,
      ragScore: typeof data.ragScore === "number" ? data.ragScore : null,
      status: "ok",
      errorCode: null,
      ip,
    });

    return c.json({ resposta: data.resposta, messageId });
  } catch (err) {
    const isTimeout =
      err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
    const status: "timeout" | "error" = isTimeout ? "timeout" : "error";
    const errorCode = err instanceof Error ? err.name : "unknown";
    await logPrompt({
      userId,
      messageId,
      prompt: pergunta,
      response: null,
      model: null,
      latencyMs: Date.now() - startedAt,
      ragScore: null,
      status,
      errorCode,
      ip,
    });
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
  const { messageId, rating } = c.req.valid("json");

  const userId = session?.user?.id ?? null;
  const original = await prisma.aiPromptLog.findFirst({
    where: userId
      ? { messageId, userId }
      : { messageId, userId: null, ip },
    select: { prompt: true, response: true },
  });
  if (!original?.response) {
    return c.json({ error: "Mensagem não encontrada ou não pertence a esta sessão." }, 404);
  }

  const existingFeedback = await prisma.chatFeedback.findUnique({ where: { messageId } });
  if (existingFeedback) return c.json({ ok: true, coinsEarned: 0, idempotent: true });

  const feedback = await prisma.chatFeedback.create({
    data: {
      userId,
      messageId,
      pergunta: original.prompt,
      resposta: original.response,
      rating,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      retentionPolicyVersion: "2026-07",
    },
  });

  // Creditar ECOBOT_RATING apenas para usuários autenticados
  let coinsEarned = 0;
  if (session?.user?.id && feedback.rating === rating) {
    const result = await creditCoins(
      session.user.id,
      "ECOBOT_RATING",
      messageId,
      undefined,
      "Avaliação do EcoBot",
      `ECOBOT_RATING:${messageId}`,
    );
    if (result.ok) {
      await aplicarProgressoMissoes(session.user.id, "ECOBOT_RATING").catch(() => null);
      coinsEarned = 1;
    }
  }

  return c.json({ ok: true, coinsEarned });
});

export const chatRouter = app;
