"use client";

import { useEffect, useState, startTransition } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "ecomed_cookie_consent";

type ConsentState = "accepted" | "rejected" | null;

export function CookieBanner() {
  const [consent, setConsent] = useState<ConsentState>("accepted"); // começa oculto no SSR

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ConsentState | null;
    startTransition(() => setConsent(stored)); // null = não respondeu ainda → mostra o banner
  }, []);

  function handleAccept() {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setConsent("accepted");
  }

  function handleReject() {
    localStorage.setItem(STORAGE_KEY, "rejected");
    setConsent("rejected");
    // Apaga cookies analíticos existentes (GA/GTM)
    document.cookie = "_ga=; Max-Age=0; path=/";
    document.cookie = "_ga_WY07TY58R1=; Max-Age=0; path=/";
  }

  // Não mostrar se já respondeu
  if (consent !== null) return null;

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
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
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
