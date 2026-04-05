import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // Desabilita no dev para compatibilidade com Turbopack
  disable: process.env.NODE_ENV === "development",
});

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://plausible.io https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://cdn.sanity.io https://uploads.ecomed.eco.br https://*.r2.dev https://www.google-analytics.com https://www.googletagmanager.com https://lh3.googleusercontent.com https://*.tile.openstreetmap.org https://unpkg.com",
  "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://www.googletagmanager.com https://plausible.io https://api.indexnow.org https://static.cloudflareinsights.com https://fonts.googleapis.com https://fonts.gstatic.com https://*.tile.openstreetmap.org https://unpkg.com wss:",
  "frame-src https://www.googletagmanager.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

// CSP permissiva apenas para /studio — o Sanity Studio requer acesso a core.sanity-cdn.com
// e ao cluster *.api.sanity.io (API REST + WebSocket)
const studioCsp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://core.sanity-cdn.com https://cdn.sanity.io",
  "style-src 'self' 'unsafe-inline' https://core.sanity-cdn.com https://cdn.sanity.io https://fonts.googleapis.com",
  "font-src 'self' data: https://core.sanity-cdn.com https://cdn.sanity.io https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://cdn.sanity.io https://lh3.googleusercontent.com",
  "connect-src 'self' https://*.api.sanity.io wss://*.api.sanity.io https://api.sanity.io https://cdn.sanity.io https://core.sanity-cdn.com",
  "worker-src 'self' blob:",
  "frame-src 'self' https://cdn.sanity.io",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

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
      // CSP geral para todas as rotas
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
      // CSP permissiva para o Sanity Studio embutido (/studio e sub-rotas)
      {
        source: "/studio",
        headers: [{ key: "Content-Security-Policy", value: studioCsp }],
      },
      {
        source: "/studio/(.*)",
        headers: [{ key: "Content-Security-Policy", value: studioCsp }],
      },
    ];
  },
};

export default withSerwist(nextConfig);
