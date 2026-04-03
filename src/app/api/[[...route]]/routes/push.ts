import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { auth } from "@/../../auth";
import { prisma } from "@/lib/db/prisma";

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
