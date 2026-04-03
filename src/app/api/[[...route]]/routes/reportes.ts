import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/../auth";
import { checkRateLimit } from "@/lib/ratelimit";

const app = new Hono();

const reportSchema = z.object({
  pontoId: z.string().cuid(),
  tipo: z.enum(["CLOSED", "WRONG_ADDRESS", "NOT_ACCEPTING", "OTHER"]),
  descricao: z.string().max(500).optional(),
});

// POST /api/reportes
app.post("/", zValidator("json", reportSchema), async (c) => {
  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
  const { success } = await checkRateLimit("auth", ip); // limite conservador
  if (!success) return c.json({ error: "Muitas requisições" }, 429);

  const session = await auth();
  const { pontoId, tipo, descricao } = c.req.valid("json");

  const point = await prisma.point.findFirst({
    where: { id: pontoId, status: "APPROVED" },
    select: { id: true },
  });
  if (!point) return c.json({ error: "Ponto não encontrado" }, 404);

  const report = await prisma.report.create({
    data: {
      pointId: pontoId,
      type: tipo,
      description: descricao,
      userId: session?.user?.id ?? null,
    },
  });

  return c.json(report, 201);
});

export const reportesRouter = app;

