import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/../auth";
import { checkRateLimit } from "@/lib/ratelimit";

const app = new Hono();

// POST /api/favoritos
app.post("/", zValidator("json", z.object({ pontoId: z.string().cuid() })), async (c) => {
  const ip = c.req.header("CF-Connecting-IP") ?? c.req.header("x-forwarded-for") ?? "unknown";
  const { success } = await checkRateLimit("map", ip);
  if (!success) return c.json({ error: "Muitas requisições" }, 429);

  const session = await auth();
  if (!session?.user?.id) return c.json({ error: "Não autenticado" }, 401);

  const { pontoId } = c.req.valid("json");

  const point = await prisma.point.findFirst({
    where: { id: pontoId, status: "APPROVED" },
    select: { id: true },
  });
  if (!point) return c.json({ error: "Ponto não encontrado" }, 404);

  const fav = await prisma.favorite.upsert({
    where: { userId_pointId: { userId: session.user.id, pointId: pontoId } },
    create: { userId: session.user.id, pointId: pontoId },
    update: {},
  });

  return c.json(fav, 201);
});

// DELETE /api/favoritos
app.delete("/", zValidator("json", z.object({ pontoId: z.string().cuid() })), async (c) => {
  const session = await auth();
  if (!session?.user?.id) return c.json({ error: "Não autenticado" }, 401);

  const { pontoId } = c.req.valid("json");

  await prisma.favorite.deleteMany({
    where: { userId: session.user.id, pointId: pontoId },
  });

  return c.json({ ok: true });
});

// GET /api/favoritos
app.get("/", async (c) => {
  const session = await auth();
  if (!session?.user?.id) return c.json({ error: "Não autenticado" }, 401);

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: {
      point: {
        select: {
          id: true, name: true, address: true, city: true, state: true,
          latitude: true, longitude: true, phone: true, photoUrl: true,
          residueTypes: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return c.json(favorites.map((f) => f.point));
});

export const favoritosRouter = app;

