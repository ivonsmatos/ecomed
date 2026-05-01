import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db/prisma";
import { sendPushToUser } from "@/lib/push";

export const pushRouter = new Hono();

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
  expirationTime: z.number().nullable().optional(),
});

pushRouter.post("/subscribe", zValidator("json", subscribeSchema), async (c) => {
  const session = await auth();
  if (!session?.user?.id) return c.json({ error: "Não autorizado" }, 401);

  const { endpoint, keys } = c.req.valid("json");

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { p256dh: keys.p256dh, auth: keys.auth, userId: session.user.id },
    create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, userId: session.user.id },
  });

  return c.json({ ok: true }, 201);
});

pushRouter.delete(
  "/unsubscribe",
  zValidator("json", z.object({ endpoint: z.string().url() })),
  async (c) => {
    const session = await auth();
    if (!session?.user?.id) return c.json({ error: "Não autorizado" }, 401);

    const { endpoint } = c.req.valid("json");

    await prisma.pushSubscription.deleteMany({
      where: { endpoint, userId: session.user.id },
    });

    return c.json({ ok: true });
  },
);

// POST /push/test — usuario logado dispara push de teste pra si mesmo (botao "testar push" no perfil)
pushRouter.post("/test", async (c) => {
  const session = await auth();
  if (!session?.user?.id) return c.json({ error: "Não autorizado" }, 401);

  const result = await sendPushToUser(session.user.id, {
    title: "EcoMed · Push funcionando 🌿",
    body: "Você receberá notificações de missões, conquistas e novidades.",
    url: "/recompensas",
    tag: "test",
  });

  return c.json({ ok: true, ...result });
});

// POST /push/send — admin envia push para um userId arbitrario (usado para campanhas manuais)
pushRouter.post(
  "/send",
  zValidator(
    "json",
    z.object({
      userId: z.string(),
      title: z.string().min(1).max(80),
      body: z.string().min(1).max(200),
      url: z.string().url().optional(),
      tag: z.string().optional(),
    }),
  ),
  async (c) => {
    const session = await auth();
    if (!session?.user?.id) return c.json({ error: "Não autorizado" }, 401);

    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (me?.role !== "ADMIN") return c.json({ error: "Apenas ADMIN" }, 403);

    const payload = c.req.valid("json");
    const result = await sendPushToUser(payload.userId, {
      title: payload.title,
      body: payload.body,
      url: payload.url,
      tag: payload.tag,
    });

    return c.json({ ok: true, ...result });
  },
);

