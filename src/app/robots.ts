import type { MetadataRoute } from "next";

// Public content accessible to all crawlers (including AI)
const publicPaths = ["/", "/mapa", "/blog", "/ranking", "/faq"];
// Private paths blocked for all
const privatePaths = ["/app/", "/parceiro/", "/admin/", "/api/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Allow all AI crawlers full access to public content
      { userAgent: "GPTBot", allow: publicPaths, disallow: privatePaths },
      { userAgent: "ChatGPT-User", allow: publicPaths, disallow: privatePaths },
      { userAgent: "OAI-SearchBot", allow: publicPaths, disallow: privatePaths },
      { userAgent: "ClaudeBot", allow: publicPaths, disallow: privatePaths },
      { userAgent: "anthropic-ai", allow: publicPaths, disallow: privatePaths },
      { userAgent: "PerplexityBot", allow: publicPaths, disallow: privatePaths },
      { userAgent: "Google-Extended", allow: publicPaths, disallow: privatePaths },
      { userAgent: "Googlebot", allow: publicPaths, disallow: privatePaths },
      { userAgent: "Bytespider", allow: publicPaths, disallow: privatePaths },
      { userAgent: "cohere-ai", allow: publicPaths, disallow: privatePaths },
      {
        userAgent: "*",
        allow: publicPaths,
        disallow: privatePaths,
      },
    ],
    sitemap: "https://ecomed.eco.br/sitemap.xml",
  };
}