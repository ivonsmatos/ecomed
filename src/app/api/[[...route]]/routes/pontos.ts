import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/ratelimit";

const app = new Hono();

// Haversine: distância em metros entre dois pontos (lat/lng em graus decimais)
function haversineMetros(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  raio: z.coerce.number().min(500).max(50_000).default(5000),
});

// GET /api/pontos/mapa — todos os pontos aprovados (usado pelo mapa completo)
app.get("/mapa", async (c) => {
  const ip = c.req.header("CF-Connecting-IP") ?? c.req.header("x-forwarded-for") ?? "unknown";
  const { success } = await checkRateLimit("map", ip);
  if (!success) return c.json({ error: "Muitas requisições" }, 429);

  try {
    const points = await prisma.point.findMany({
      where: { status: "APPROVED" },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        state: true,
        latitude: true,
        longitude: true,
        phone: true,
        photoUrl: true,
        residueTypes: true,
      },
    });
    return c.json(points);
  } catch (err) {
    console.error("[pontos/mapa] query error:", err);
    return c.json([], 200);
  }
});

// GET /api/pontos/proximos?lat=&lng=&raio=
app.get("/proximos", zValidator("query", querySchema), async (c) => {
  const ip = c.req.header("CF-Connecting-IP") ?? c.req.header("x-forwarded-for") ?? "unknown";
  const { success } = await checkRateLimit("map", ip);
  if (!success) return c.json({ error: "Muitas requisições" }, 429);

  const { lat, lng, raio } = c.req.valid("query");

  // Bounding box em graus (margem de 50% para cobrir distâncias diagonais)
  const delta = (raio / 111_000) * 1.5;

  try {
    const candidatos = await prisma.point.findMany({
      where: {
        status: "APPROVED",
        latitude: { gte: lat - delta, lte: lat + delta },
        longitude: { gte: lng - delta, lte: lng + delta },
      },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        state: true,
        latitude: true,
        longitude: true,
        phone: true,
        photoUrl: true,
        residueTypes: true,
      },
    });

    const points = candidatos
      .map((p) => ({ ...p, distancia_metros: haversineMetros(lat, lng, p.latitude, p.longitude) }))
      .filter((p) => p.distancia_metros <= raio)
      .sort((a, b) => a.distancia_metros - b.distancia_metros)
      .slice(0, 30);

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

