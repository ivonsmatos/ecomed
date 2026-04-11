"use client";

import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { Download } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type BeforeInstallPromptEvent = Event & {
  platforms: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function PwaInstallButton() {
  const [isStandalone, setIsStandalone] = useState(() => {
    if (typeof window === "undefined") return false;
    const standaloneByDisplayMode = window.matchMedia("(display-mode: standalone)").matches;
    const standaloneByNavigator =
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    return standaloneByDisplayMode || standaloneByNavigator;
  });

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(display-mode: standalone)");

    const updateStandalone = () => {
      const standaloneByNavigator =
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
      setIsStandalone(mediaQuery.matches || standaloneByNavigator);
    };

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
      toast.success("EcoMed instalado com sucesso.");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    mediaQuery.addEventListener("change", updateStandalone);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
      mediaQuery.removeEventListener("change", updateStandalone);
    };
  }, []);

  const isIOS = useMemo(() => {
    if (typeof window === "undefined") return false;
    return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  }, []);

  async function handleInstall() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;

      if (choice.outcome === "accepted") {
        toast.success("Instalação iniciada.");
      } else {
        toast.message("Instalação cancelada.");
      }

      setDeferredPrompt(null);
      return;
    }

    if (isIOS) {
      toast.message("No iPhone/iPad: toque em Compartilhar e depois em Adicionar à Tela de Início.");
      return;
    }

    toast.message("Use o menu do navegador e escolha Instalar aplicativo para adicionar o EcoMed.");
  }

  if (isStandalone) return null;

  return (
    <button
      type="button"
      onClick={handleInstall}
      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
      aria-label="Instalar EcoMed"
      title="Instalar EcoMed"
    >
      <Download className="size-3.5" />
      <span className="hidden sm:inline">Instalar app</span>
    </button>
  );
}
