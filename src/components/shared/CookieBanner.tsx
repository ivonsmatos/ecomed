"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CONSENT_EVENT,
  CONSENT_STORAGE_KEY,
  clearAnalyticsCookies,
  createConsent,
  parseConsent,
} from "@/lib/consent";

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(CONSENT_EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(CONSENT_EVENT, cb);
  };
}

function getSnapshot() {
  return localStorage.getItem(CONSENT_STORAGE_KEY);
}

function getServerSnapshot() { return null; }

export function CookieBanner() {
  const pathname = usePathname();
  const rawConsent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const consent = parseConsent(rawConsent);

  // Widget embeddable: sem banner dentro de iframes de terceiros
  if (pathname?.startsWith("/embed")) return null;

  function handleAccept() {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(createConsent(true)));
    window.dispatchEvent(new Event(CONSENT_EVENT));
  }

  function handleReject() {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(createConsent(false)));
    clearAnalyticsCookies();
    window.dispatchEvent(new Event(CONSENT_EVENT));
  }

  function handleRevoke() {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
    clearAnalyticsCookies();
    window.dispatchEvent(new Event(CONSENT_EVENT));
  }

  if (consent !== null) {
    return (
      <button
        type="button"
        onClick={handleRevoke}
        className="fixed bottom-2 left-2 z-40 rounded-md border bg-background/90 px-2 py-1 text-xs text-muted-foreground shadow-sm"
      >
        Preferências de cookies
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-label="Consentimento de cookies"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80",
        "px-4 py-4 shadow-lg"
      )}
    >
      <div className="container mx-auto max-w-5xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="flex-1 text-sm text-muted-foreground leading-relaxed">
          Usamos cookies essenciais para o funcionamento da plataforma e cookies analíticos (Google
          Analytics) para entender como você usa o EcoMed. Consulte nossa{" "}
          <Link href="/cookies" className="underline underline-offset-2 hover:text-foreground">
            Política de Cookies
          </Link>{" "}
          e{" "}
          <Link href="/privacidade" className="underline underline-offset-2 hover:text-foreground">
            Política de Privacidade
          </Link>
          .
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleReject}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            Só essenciais
          </button>
          <button
            onClick={handleAccept}
            className="rounded-md bg-eco-green px-4 py-2 text-sm font-medium text-white hover:bg-eco-green transition-colors"
          >
            Aceitar todos
          </button>
          <button
            onClick={handleReject}
            aria-label="Fechar"
            className="ml-1 rounded-md p-1 hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
