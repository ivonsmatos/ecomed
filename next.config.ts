import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // Página de fallback quando navegação falha (offline ou server error)
  navigateFallback: "/offline",
  // Não usar fallback em rotas de API, assets estáticos e studio
  navigateFallbackDenylist: [/^\/api\//, /^\/_next\//, /\/studio/],
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
    ],
  },
};

export default withSerwist(nextConfig);
