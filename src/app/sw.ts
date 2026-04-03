import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, NetworkFirst, CacheFirst } from "serwist";

declare global {
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
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
