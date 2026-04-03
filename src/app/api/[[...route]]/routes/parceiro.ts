import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/../auth";
import { createPointSchema, updatePointSchema } from "@/lib/schemas/point";

const app = new Hono();

async function requirePartnerSession(c: Parameters<Parameters<typeof app.use>[1]>[0]) {
  const session = await auth();
  if (!session?.user?.id) return { error: c.json({ error: "Não autenticado" }, 401), partner: null };
  const partner = await prisma.partner.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!partner) return { error: c.json({ error: "Parceiro não encontrado" }, 403), partner: null };
  return { error: null, partner };
}

// GET /api/parceiro/pontos
app.get("/pontos", async (c) => {
  const { error, partner } = await requirePartnerSession(c);
  if (error) return error;

  const points = await prisma.point.findMany({
    where: { partnerId: partner!.id },
    include: {
      schedules: true,
      _count: { select: { favorites: true, reports: true, views: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return c.json(points);
});

// GET /api/parceiro/pontos/:id
app.get("/pontos/:id", async (c) => {
  const { error, partner } = await requirePartnerSession(c);
  if (error) return error;

  const point = await prisma.point.findFirst({
    where: { id: c.req.param("id"), partnerId: partner!.id },
    include: { schedules: true },
  });

  if (!point) return c.json({ error: "Ponto não encontrado" }, 404);
  return c.json(point);
});

// POST /api/parceiro/pontos
app.post("/pontos", zValidator("json", createPointSchema), async (c) => {
  const { error, partner } = await requirePartnerSession(c);
  if (error) return error;

  const { schedules, ...data } = c.req.valid("json");

  const point = await prisma.point.create({
    data: {
      ...data,
      phone: data.phone || null,
      email: data.email || null,
      partnerId: partner!.id,
      status: "PENDING",
      schedules: schedules && schedules.length > 0 ? { create: schedules } : undefined,
    },
    include: { schedules: true },
  });

  return c.json(point, 201);
});

// PUT /api/parceiro/pontos/:id
app.put("/pontos/:id", zValidator("json", updatePointSchema), async (c) => {
  const { error, partner } = await requirePartnerSession(c);
  if (error) return error;

  const existing = await prisma.point.findFirst({
    where: { id: c.req.param("id"), partnerId: partner!.id },
    select: { id: true, status: true },
  });

  if (!existing) return c.json({ error: "Ponto não encontrado" }, 404);

  const { schedules, ...data } = c.req.valid("json");

  // Editar ponto volta para PENDING se estava APPROVED
  const newStatus = existing.status === "APPROVED" ? "PENDING" : existing.status;

  const point = await prisma.point.update({
    where: { id: existing.id },
    data: {
      ...data,
      phone: data.phone || null,
      email: data.email || null,
      status: newStatus,
      ...(schedules
        ? {
            schedules: {
              deleteMany: {},
              create: schedules,
            },
          }
        : {}),
    },
    include: { schedules: true },
  });

  return c.json(point);
});

// DELETE /api/parceiro/pontos/:id
app.delete("/pontos/:id", async (c) => {
  const { error, partner } = await requirePartnerSession(c);
  if (error) return error;

  const existing = await prisma.point.findFirst({
    where: { id: c.req.param("id"), partnerId: partner!.id },
    select: { id: true },
  });

  if (!existing) return c.json({ error: "Ponto não encontrado" }, 404);

  await prisma.point.delete({ where: { id: existing.id } });
  return c.json({ ok: true });
});

export { app as parceiroRouter };

