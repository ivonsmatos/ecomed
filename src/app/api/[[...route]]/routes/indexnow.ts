import { Hono } from "hono";

// IndexNow — notifica Bing/Yandex imediatamente quando conteúdo é atualizado
// Checklist GEO: "ping indexnow / bing API em todas as atualizações de conteúdo"
// Usage (interno): POST /api/indexnow { urls: ["https://ecomed.eco.br/blog/slug"] }

const INDEXNOW_KEY = process.env.INDEXNOW_KEY ?? "";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

const app = new Hono();

// GET /api/indexnow — serve a chave de verificação IndexNow
app.get("/", (c) => {
  if (!INDEXNOW_KEY) return c.text("Not configured", 404);
  return c.text(INDEXNOW_KEY, 200, { "Content-Type": "text/plain" });
});

// POST /api/indexnow — submete URLs ao Bing/Yandex
app.post("/", async (c) => {
  if (!INDEXNOW_KEY) {
    return c.json({ error: "INDEXNOW_KEY not configured" }, 500);
  }

  let urls: string[] = [];
  try {
    const body = await c.req.json<{ urls?: string[] }>();
    urls = Array.isArray(body.urls) ? body.urls : [];
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  if (urls.length === 0) {
    return c.json({ error: "No URLs provided" }, 400);
  }

  const validUrls = urls.filter((u) => {
    try {
      return new URL(u).hostname === "ecomed.eco.br";
    } catch {
      return false;
    }
  });

  if (validUrls.length === 0) {
    return c.json({ error: "No valid ecomed.eco.br URLs" }, 400);
  }

  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: "ecomed.eco.br",
      key: INDEXNOW_KEY,
      keyLocation: `https://ecomed.eco.br/${INDEXNOW_KEY}.txt`,
      urlList: validUrls,
    }),
  });

  return c.json(
    { submitted: validUrls.length, status: response.status },
    response.ok ? 200 : 502,
  );
});

export default app;

