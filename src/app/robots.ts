import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/mapa", "/blog"],
        disallow: ["/app/", "/parceiro/", "/admin/", "/api/"],
      },
    ],
    sitemap: "https://ecomed.eco.br/sitemap.xml",
  };
}
