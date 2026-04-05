import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // Desabilita no dev para compatibilidade com Turbopack
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "pub-*.r2.dev" },
      { protocol: "https", hostname: "uploads.ecomed.eco.br" },
      { protocol: "https", hostname: "cdn.sanity.io" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  async rewrites() {
    return [
      // /sitemap-llm.xml → route handler at /sitemap-llm
      // (Next.js App Router does not match route.ts for segments ending in .xml)
      { source: "/sitemap-llm.xml", destination: "/sitemap-llm" },
    ];
  },
  async headers() {
    return [
      // Service Worker: nunca cachear — o próprio SW gerencia seu ciclo de atualização
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      // Headers de segurança para todas as rotas
      // OBS: Content-Security-Policy é aplicado pelo middleware.ts de forma condicional
      // (/studio recebe CSP permissiva; demais rotas recebem CSP restritiva)
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);
