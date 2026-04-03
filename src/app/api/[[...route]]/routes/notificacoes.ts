import { Hono } from "hono";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db/prisma";

const app = new Hono();

// GET /api/notificacoes
app.get("/", async (c) => {
  const session = await auth();
  if (!session?.user?.id) return c.json({ error: "Não autenticado" }, 401);

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return c.json(notifications);
});

// POST /api/notificacoes/:id/ler
app.post("/:id/ler", async (c) => {
  const session = await auth();
  if (!session?.user?.id) return c.json({ error: "Não autenticado" }, 401);

  const notification = await prisma.notification.findFirst({
    where: { id: c.req.param("id"), userId: session.user.id },
  });

  if (!notification) return c.json({ error: "Notificação não encontrada" }, 404);

  await prisma.notification.update({
    where: { id: notification.id },
    data: { read: true },
  });

  return c.json({ ok: true });
});

// POST /api/notificacoes/ler-todas
app.post("/ler-todas", async (c) => {
  const session = await auth();
  if (!session?.user?.id) return c.json({ error: "Não autenticado" }, 401);

  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });

  return c.json({ ok: true });
});

export const notificacoesRouter = app;
