import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, NetworkFirst, CacheFirst, NetworkOnly } from "serwist";

declare global {
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Plugin que silencia erros de rede para requisições de analytics/telemetria.
// Retorna 204 No Content em vez de propagar "no-response" no console.
const silentFallbackPlugin = {
  handlerDidError: async () =>
    new Response(null, { status: 204, statusText: "No Content" }),
};

// Origens externas que o SW nunca deve interceptar:
// - api.sanity.io: SSE streams (listen) + REST — não podem ser cacheados
// - cloudflareinsights: script externo sem CORS header
// - analytics: telemetria
const PASSTHROUGH_ORIGINS = [
  "api.sanity.io",
  "q9uk6qff.api.sanity.io",
  "static.cloudflareinsights.com",
  "cloudflareinsights.com",
  "plausible.io",
  "www.google-analytics.com",
  "analytics.google.com",
  "www.googletagmanager.com",
  "region1.google-analytics.com",
];

// Prefixos de caminho (mesmo domínio) usados pelo proxy GA4 first-party
const ANALYTICS_PATHS = [
  "/fslp/",   // Google Analytics 4 first-party measurement
  "/g/collect",
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
  runtimeCaching: [
    // Analytics externas: NetworkOnly + silencia erros de rede
    {
      matcher: ({ url }) => PASSTHROUGH_ORIGINS.includes(url.hostname),
      handler: new NetworkOnly({ plugins: [silentFallbackPlugin] }),
    },
    // Rotas de analytics no mesmo domínio (/fslp/, /g/collect, etc.)
    {
      matcher: ({ url }) =>
        ANALYTICS_PATHS.some((p) => url.pathname.startsWith(p)),
      handler: new NetworkOnly({ plugins: [silentFallbackPlugin] }),
    },
    // Rotas dinâmicas do servidor — nunca servir do cache
    {
      matcher: ({ url }) =>
        url.pathname.startsWith("/api/") ||
        url.pathname === "/sitemap-llm.xml" ||
        url.pathname === "/sitemap-llm" ||
        url.pathname === "/sitemap.xml",
      handler: new NetworkOnly(),
    },
    // Pontos próximos: network-first com fallback de 5 minutos
    {
      matcher: /^\/api\/pontos\/proximos/,
      handler: new NetworkFirst({
        cacheName: "api-pontos",
        networkTimeoutSeconds: 5,
        plugins: [
          {
            cacheKeyWillBeUsed: async ({ request }) => request,
          },
        ],
      }),
    },
    // Tiles do mapa (OpenStreetMap): cache-first
    {
      matcher: /^https:\/\/[a-c]\.tile\.openstreetmap\.org/,
      handler: new CacheFirst({
        cacheName: "osm-tiles",
      }),
    },
    // Imagens de pontos no R2: cache-first
    {
      matcher: /\.r2\.dev\//,
      handler: new CacheFirst({
        cacheName: "r2-images",
      }),
    },
    // Demais rotas: default (stale-while-revalidate para assets estáticos)
    ...defaultCache,
  ],
});

serwist.addEventListeners();
