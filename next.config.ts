import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";
import { withSentryConfig } from "@sentry/nextjs";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // Desabilita no dev para compatibilidade com Turbopack
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  output: "standalone",
  // instrumentation.ts é auto-detectado no Next.js 15 (stable).
  // Não requer flag experimental — apenas ter o arquivo na raiz do projeto é suficiente.
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

const withSerwistConfig = withSerwist(nextConfig);

// Sentry envolve o config final. Sem SENTRY_AUTH_TOKEN, source maps não são enviados
// mas a captura de erros runtime ainda funciona (config inicializado em sentry.*.config.ts).
export default withSentryConfig(withSerwistConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Build silencioso a menos que esteja em CI
  silent: !process.env.CI,

  // Source maps só se houver auth token (precisa de SENTRY_AUTH_TOKEN no build)
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },

  webpack: {
    // Remove código de debug do bundle de produção (substitui disableLogger deprecado)
    treeshake: {
      removeDebugLogging: true,
    },
    // Desativa monitors automáticos do Vercel (usamos VPS)
    automaticVercelMonitors: false,
  },
});
