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

// GET /api/pontos/mapa — pontos aprovados para o mapa (amostra distribuída por cidade)
// Com 58k+ pontos no banco, retornamos 1 ponto por cidade (até ~780 marcadores) para
// o overview inicial. O endpoint /proximos carrega pontos detalhados ao usar geolocalização.
app.get("/mapa", async (c) => {
  const ip = c.req.header("CF-Connecting-IP") ?? c.req.header("x-forwarded-for") ?? "unknown";
  try {
    const { success } = await checkRateLimit("map", ip);
    if (!success) return c.json({ error: "Muitas requisições" }, 429);
  } catch (err) {
    console.warn("[pontos/mapa] rate limit unavailable, proceeding:", err);
  }

  try {
    // 1 ponto representativo por cidade (o mais recente) — evita saturar o mapa
    const rows = await prisma.$queryRaw<
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
      }>
    >`
      SELECT DISTINCT ON (city, state)
        id, name, address, city, state, latitude, longitude,
        phone, "photoUrl", "residueTypes"
      FROM "Point"
      WHERE status = 'APPROVED'
      ORDER BY city, state, "createdAt" DESC
    `;
    return c.json(rows);
  } catch (err) {
    console.error("[pontos/mapa] query error:", err);
    return c.json([], 200);
  }
});

// GET /api/pontos/proximos?lat=&lng=&raio=
app.get("/proximos", zValidator("query", querySchema), async (c) => {
  const ip = c.req.header("CF-Connecting-IP") ?? c.req.header("x-forwarded-for") ?? "unknown";
  try {
    const { success } = await checkRateLimit("map", ip);
    if (!success) return c.json({ error: "Muitas requisições" }, 429);
  } catch (err) {
    console.warn("[pontos/proximos] rate limit unavailable, proceeding:", err);
  }

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

