import type { MetadataRoute } from "next";
import { getCidades, cidadeSlug } from "@/lib/geo/cidades";
import { getSitemapArticles } from "@/lib/sanity/queries";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://ecomed.eco.br";

  let articles: Awaited<ReturnType<typeof getSitemapArticles>> = [];
  try {
    articles = await getSitemapArticles();
  } catch {
    // DB unavailable at build time — return static routes only
  }

  // Páginas programáticas /descarte/[cidade]-[uf] — só cidades com 2+ pontos
  // (evita thin content em municípios com 1 UBS isolada)
  let cidadeRoutes: MetadataRoute.Sitemap = [];
  try {
    const cidades = await getCidades();
    cidadeRoutes = cidades
      .filter((c) => c.pontos >= 2)
      .map((c) => ({
        url: `${base}/descarte/${cidadeSlug(c.city, c.state)}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
  } catch {
    // DB unavailable — skip
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/mapa`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/sobre`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/parceiros`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/o-que-fazemos`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/compromisso`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/impacto`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/desenvolvedores`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/ranking`, lastModified: new Date(), changeFrequency: "daily", priority: 0.6 },
    { url: `${base}/entrar`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/cadastrar`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/contato`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/privacidade`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/termos`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/cookies`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/aviso-medico`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/metodologia-impacto`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  ];

  const articleRoutes: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${base}/blog/${a.slug}`,
    lastModified: new Date(a._updatedAt),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...articleRoutes, ...cidadeRoutes];
}
