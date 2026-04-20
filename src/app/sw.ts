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
    // Rotas protegidas (auth required) — NUNCA cachear respostas de navegação.
    // O middleware Next.js retorna 302 → /entrar para usuários não autenticados.
    // Se o SW tentar usar essa resposta opaqueredirect como respondWith() de um
    // FetchEvent com redirect:"follow", o browser lança TypeError e mostra
    // chrome-error://chromewebdata/ em vez da página normal.
    {
      matcher: ({ url }: { url: URL }) =>
        ["/app", "/admin", "/parceiro"].some(
          (p) => url.pathname === p || url.pathname.startsWith(p + "/")
        ),
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

// ── Push notifications ────────────────────────────────────────────────────────
// Serwist não gerencia o evento push — adicionamos manualmente.

self.addEventListener("push", (event: PushEvent) => {
  let data: {
    title?: string;
    body?: string;
    url?: string;
    icon?: string;
    badge?: string;
    tag?: string;
  } = {};

  try {
    data = event.data?.json() ?? {};
  } catch {
    data = { title: "EcoMed", body: event.data?.text() ?? "" };
  }

  const title = data.title ?? "EcoMed";
  const options: NotificationOptions = {
    body: data.body ?? "",
    icon: data.icon ?? "/icons/icon-192.png",
    badge: data.badge ?? "/icons/icon-72.png",
    tag: data.tag ?? "ecomed-default",
    data: { url: data.url ?? "/" },
    // Mantém notificação visível até o usuário interagir
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();

  const url: string = event.notification.data?.url ?? "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Foca em aba já aberta se houver
        for (const client of clientList) {
          if (client.url === url && "focus" in client) {
            return (client as WindowClient).focus();
          }
        }
        // Abre nova aba
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      }),
  );
});
