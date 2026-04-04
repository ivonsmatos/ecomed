import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, NetworkFirst, CacheFirst, NetworkOnly } from "serwist";

declare global {
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// URLs externas de analytics/telemetria — nunca cachear, ignorar falhas silenciosamente
const PASSTHROUGH_ORIGINS = [
  "static.cloudflareinsights.com",
  "cloudflareinsights.com",
  "plausible.io",
  "www.google-analytics.com",
  "analytics.google.com",
  "www.googletagmanager.com",
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
    // Analytics e telemetria externa: NetworkOnly sem cache, falhas silenciosas
    {
      matcher: ({ url }) => PASSTHROUGH_ORIGINS.includes(url.hostname),
      handler: new NetworkOnly(),
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
