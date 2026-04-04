import { auth } from "./auth";
import { NextResponse } from "next/server";
import type { NextAuthRequest } from "next-auth";

// Rotas que exigem apenas autenticação (qualquer role)
const AUTH_ROUTES = ["/app"];

// Rotas que exigem role PARTNER ou ADMIN
const PARTNER_ROUTES = ["/parceiro"];

// Rotas que exigem role ADMIN
const ADMIN_ROUTES = ["/admin"];

export default auth((req: NextAuthRequest) => {
  const { pathname } = req.nextUrl;

  // Rewrite /sitemap-llm.xml → /sitemap-llm
  // (App Router não roteia segmentos terminados em extensão conhecida como .xml)
  if (pathname === "/sitemap-llm.xml") {
    return NextResponse.rewrite(new URL("/sitemap-llm", req.url));
  }

  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));
  const isPartnerRoute = PARTNER_ROUTES.some((r) => pathname.startsWith(r));
  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r));

  if (!isAuthRoute && !isPartnerRoute && !isAdminRoute) {
    return NextResponse.next();
  }

  const session = req.auth;

  if (!session?.user) {
    const loginUrl = new URL("/entrar", req.url);
    loginUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(loginUrl);
  }

  const role = (session.user as { role?: string }).role ?? "USER";

  if (isAdminRoute && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/app", req.url));
  }

  if (isPartnerRoute && role !== "PARTNER" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/app", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/app/:path*", "/parceiro/:path*", "/admin/:path*", "/sitemap-llm.xml"],
};
