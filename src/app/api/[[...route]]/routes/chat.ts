import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { auth } from "@/../auth";
import { checkRateLimit } from "@/lib/ratelimit";

const app = new Hono();

const chatSchema = z.object({
  pergunta: z.string().min(3).max(1000),
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
    return c.json(data);
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

export const chatRouter = app;

