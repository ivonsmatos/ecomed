import { auth } from "./auth";
import { NextResponse } from "next/server";
import type { NextAuthRequest } from "next-auth";

// Rotas que exigem apenas autenticação (qualquer role)
const AUTH_ROUTES = ["/app"];

// Rotas que exigem role PARTNER ou ADMIN
const PARTNER_ROUTES = ["/parceiro"];

// Rotas que exigem role ADMIN
const ADMIN_ROUTES = ["/admin"];

// CSP geral para todas as rotas (exceto /studio)
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

// CSP permissiva apenas para /studio — o Sanity Studio requer unsafe-eval e acesso a
// core.sanity-cdn.com e *.api.sanity.io (REST + WebSocket)
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

export default auth((req: NextAuthRequest) => {
  const { pathname } = req.nextUrl;

  const isStudio = pathname === "/studio" || pathname.startsWith("/studio/");
  const cspValue = isStudio ? studioCsp : csp;

  // Encaminha pathname para Server Components via request header
  const forwardedHeaders = new Headers(req.headers);
  forwardedHeaders.set("x-pathname", pathname);

  function withCsp(res: NextResponse): NextResponse {
    res.headers.set("Content-Security-Policy", cspValue);
    res.headers.set("x-pathname", pathname);
    return res;
  }

  // Para NextResponse.next(), encaminha x-pathname como request header (legível via headers())
  function nextWithCsp(): NextResponse {
    const res = NextResponse.next({ request: { headers: forwardedHeaders } });
    res.headers.set("Content-Security-Policy", cspValue);
    return res;
  }

  // Rewrite /sitemap-llm.xml → /sitemap-llm
  // (App Router não roteia segmentos terminados em extensão conhecida como .xml)
  if (pathname === "/sitemap-llm.xml") {
    return withCsp(NextResponse.rewrite(new URL("/sitemap-llm", req.url)));
  }

  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));
  const isPartnerRoute = PARTNER_ROUTES.some((r) => pathname.startsWith(r));
  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r));

  if (!isAuthRoute && !isPartnerRoute && !isAdminRoute) {
    return nextWithCsp();
  }

  const session = req.auth;

  if (!session?.user) {
    const loginUrl = new URL("/entrar", req.url);
    loginUrl.searchParams.set("callbackUrl", req.url);
    return withCsp(NextResponse.redirect(loginUrl));
  }

  const role = (session.user as { role?: string }).role ?? "USER";

  if (isAdminRoute && role !== "ADMIN") {
    return withCsp(NextResponse.redirect(new URL("/app", req.url)));
  }

  if (isPartnerRoute && role !== "PARTNER" && role !== "ADMIN") {
    return withCsp(NextResponse.redirect(new URL("/app", req.url)));
  }

  return nextWithCsp();
});

export const config = {
  matcher: ["/app/:path*", "/parceiro/:path*", "/admin/:path*", "/sitemap-llm.xml"],
};
