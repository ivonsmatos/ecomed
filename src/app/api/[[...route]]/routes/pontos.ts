import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/ratelimit";

const app = new Hono();

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  raio: z.coerce.number().min(500).max(50_000).default(5000),
});

// GET /api/pontos/proximos?lat=&lng=&raio=
app.get("/proximos", zValidator("query", querySchema), async (c) => {
  const ip = c.req.header("CF-Connecting-IP") ?? c.req.header("x-forwarded-for") ?? "unknown";
  const { success } = await checkRateLimit("map", ip);
  if (!success) return c.json({ error: "Muitas requisições" }, 429);

  const { lat, lng, raio } = c.req.valid("query");

  try {
    const points = await prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        address: string;
        city: string;
        state: string;
        latitude: number;
        longitude: number;
        phone: string | null;
        photoUrl: string | null;
        residueTypes: string[];
        distancia_metros: number;
      }>
    >`
      SELECT
        id, name, address, city, state, latitude, longitude, phone, "photoUrl", "residueTypes",
        ROUND(
          ST_Distance(
            ST_MakePoint(${lng}, ${lat})::geography,
            ST_MakePoint(longitude, latitude)::geography
          )::numeric
        ) AS distancia_metros
      FROM "Point"
      WHERE status = 'APPROVED'
        AND ST_DWithin(
          ST_MakePoint(${lng}, ${lat})::geography,
          ST_MakePoint(longitude, latitude)::geography,
          ${raio}
        )
      ORDER BY distancia_metros
      LIMIT 30
    `;

    return c.json(points);
  } catch (err) {
    console.error("[pontos/proximos] query error:", err);
    return c.json([], 200);
  }
});

// GET /api/pontos/:id
app.get("/:id", async (c) => {
  const id = c.req.param("id");

  const point = await prisma.point.findFirst({
    where: { id, status: "APPROVED" },
    include: { schedules: true },
  });

  if (!point) return c.json({ error: "Ponto não encontrado" }, 404);

  // Registrar visualização (fire-and-forget)
  prisma.pointView.create({ data: { pointId: id } }).catch(() => {});

  return c.json(point);
});

export const pontosRouter = app;

