import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export async function GET() {
  const base = "https://ecomed.eco.br";
  const now = new Date().toISOString();

  let articles: { slug: string; updatedAt: Date; title?: string }[] = [];
  try {
    articles = await prisma.article.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
      orderBy: { publishedAt: "desc" },
    });
  } catch {
    // DB unavailable — return static only
  }

  const staticPages = [
    {
      url: `${base}/`,
      lastmod: now,
      changefreq: "weekly",
      priority: "1.0",
      title: "EcoMed — Seu remédio tem destino certo.",
      description: "Plataforma brasileira para descarte correto de medicamentos vencidos.",
    },
    {
      url: `${base}/mapa`,
      lastmod: now,
      changefreq: "hourly",
      priority: "0.9",
      title: "Mapa de pontos de coleta de medicamentos",
      description: "Encontre farmácias, UBS e ecopontos para descarte de medicamentos próximos a você.",
    },
    {
      url: `${base}/blog`,
      lastmod: now,
      changefreq: "weekly",
      priority: "0.7",
      title: "Blog EcoMed — Educação ambiental e descarte de medicamentos",
      description: "Artigos sobre legislação, descarte correto e impacto ambiental de medicamentos.",
    },
    {
      url: `${base}/compromisso`,
      lastmod: now,
      changefreq: "monthly",
      priority: "0.6",
      title: "Compromisso EcoMed — Sustentabilidade, educação e impacto",
      description: "Conheça os compromissos institucionais do EcoMed com descarte correto, IA responsável e políticas públicas.",
    },
    {
      url: `${base}/ranking`,
      lastmod: now,
      changefreq: "daily",
      priority: "0.6",
      title: "Ranking de descarte responsável",
      description: "Top usuários com mais descartes corretos realizados pelo EcoMed.",
    },
  ];

  const articlePages = articles.map((a) => ({
    url: `${base}/blog/${a.slug}`,
    lastmod: a.updatedAt.toISOString(),
    changefreq: "monthly",
    priority: "0.6",
    title: a.slug,
    description: "Artigo educativo sobre descarte de medicamentos — EcoMed Blog.",
  }));

  const allPages = [...staticPages, ...articlePages];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- LLM-Optimized Sitemap for EcoMed — ecomed.eco.br -->
<!-- This sitemap includes human-readable descriptions for AI systems -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:geo="https://ecomed.eco.br/ai/service.json">
${allPages
  .map(
    (p) => `  <url>
    <loc>${p.url}</loc>
    <lastmod>${p.lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
    <geo:title>${p.title}</geo:title>
    <geo:description>${p.description}</geo:description>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
