/**
 * API pública do EcoMed — somente leitura, com autenticação por X-API-Key.
 *
 * Use case: permitir que parceiros (ONGs, projetos acadêmicos, plataformas
 * sustentáveis) integrem o mapa de pontos de coleta nas suas aplicações.
 *
 * Chaves são armazenadas como JSON na env var PUBLIC_API_KEYS:
 *   {
 *     "ecmd_pk_xxx": { "name": "Nome do parceiro", "origin": "https://dominio.tld" }
 *   }
 *
 * Cada chave tem rate limit de 60 req/min (sliding window) e CORS liberado
 * apenas para o origin registrado.
 */
import { Hono } from "hono";
import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/ratelimit";

type ApiKeyConfig = { name: string; origin: string };

function loadApiKeys(): Record<string, ApiKeyConfig> {
  try {
    return JSON.parse(process.env.PUBLIC_API_KEYS ?? "{}");
  } catch (err) {
    console.error("[public-api] PUBLIC_API_KEYS inválido:", err);
    return {};
  }
}

// Haversine: distância em metros entre dois pontos lat/lng
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

const app = new Hono<{ Variables: { apiKeyName: string } }>();

// ── CORS dinâmico ──────────────────────────────────────────────────────────
// Permite o origin registrado em cada chave. Usar callback para validar.
app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return null;
      const keys = loadApiKeys();
      const allowedOrigins = Object.values(keys).map((k) => k.origin);
      return allowedOrigins.includes(origin) ? origin : null;
    },
    allowMethods: ["GET", "OPTIONS"],
    allowHeaders: ["X-API-Key", "Content-Type"],
    maxAge: 86400,
  }),
);

// ── Autenticação por API key + rate limit ──────────────────────────────────
app.use("*", async (c, next) => {
  const key = c.req.header("X-API-Key");
  if (!key) {
    return c.json(
      {
        error: "Missing API key",
        message: "Inclua o header X-API-Key na requisição.",
        docs: "https://ecomed.eco.br/parceiros",
      },
      401,
    );
  }

  const keys = loadApiKeys();
  const config = keys[key];
  if (!config) {
    return c.json({ error: "Invalid API key" }, 401);
  }

  // Rate limit por chave (60 req/min)
  try {
    const { success, limit, remaining, reset } = await checkRateLimit("publicApi", key);
    c.header("X-RateLimit-Limit", String(limit));
    c.header("X-RateLimit-Remaining", String(remaining));
    c.header("X-RateLimit-Reset", String(reset));
    if (!success) {
      return c.json(
        {
          error: "Rate limit exceeded",
          message: "Limite de 60 requisições por minuto atingido.",
          retryAfterSeconds: Math.ceil((reset - Date.now()) / 1000),
        },
        429,
      );
    }
  } catch (err) {
    console.warn("[public-api] rate limit indisponível, prosseguindo:", err);
  }

  c.set("apiKeyName", config.name);
  await next();
});

// ── Endpoints ──────────────────────────────────────────────────────────────

const proximosSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  raio: z.coerce.number().min(500).max(50_000).default(5000),
});

/**
 * GET /api/public/v1/pontos/proximos?lat=&lng=&raio=
 * Retorna até 30 pontos de coleta aprovados ordenados por distância.
 */
app.get("/v1/pontos/proximos", zValidator("query", proximosSchema), async (c) => {
  const { lat, lng, raio } = c.req.valid("query");
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
        residueTypes: true,
      },
    });

    const points = candidatos
      .map((p) => ({
        ...p,
        distancia_metros: haversineMetros(lat, lng, p.latitude, p.longitude),
      }))
      .filter((p) => p.distancia_metros <= raio)
      .sort((a, b) => a.distancia_metros - b.distancia_metros)
      .slice(0, 30);

    return c.json({
      source: "EcoMed Public API v1",
      attribution:
        "Dados originais: LogMed / Sindusfarma (programa oficial de logística reversa de medicamentos no Brasil). Uso autorizado para fins educativos e não comerciais.",
      count: points.length,
      query: { lat, lng, raio_metros: raio },
      pontos: points,
    });
  } catch (err) {
    console.error("[public-api] erro em /v1/pontos/proximos:", err);
    return c.json({ error: "Erro interno ao consultar pontos" }, 500);
  }
});

/**
 * GET /api/public/v1/pontos/:id
 * Retorna detalhes completos de um ponto de coleta.
 */
app.get("/v1/pontos/:id", async (c) => {
  const id = c.req.param("id");
  try {
    const point = await prisma.point.findFirst({
      where: { id, status: "APPROVED" },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        latitude: true,
        longitude: true,
        phone: true,
        residueTypes: true,
        schedules: {
          select: {
            dayOfWeek: true,
            opens: true,
            closes: true,
            closed: true,
          },
        },
      },
    });

    if (!point) {
      return c.json({ error: "Ponto não encontrado" }, 404);
    }

    return c.json({
      source: "EcoMed Public API v1",
      attribution:
        "Dados originais: LogMed / Sindusfarma. Uso autorizado para fins educativos e não comerciais.",
      ponto: point,
    });
  } catch (err) {
    console.error("[public-api] erro em /v1/pontos/:id:", err);
    return c.json({ error: "Erro interno ao consultar ponto" }, 500);
  }
});

export const publicApiRouter = app;
