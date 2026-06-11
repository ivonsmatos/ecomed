"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    VLibras?: {
      Widget: new (url: string) => unknown;
    };
  }
}

// Atributos customizados exigidos pelo plugin VLibras (vw, vw-access-button,
// vw-plugin-wrapper) não existem na tipagem JSX — aplicados via spread.
const vwRoot = { vw: "true" } as Record<string, string>;
const vwButton = { "vw-access-button": "true" } as Record<string, string>;
const vwWrapper = { "vw-plugin-wrapper": "true" } as Record<string, string>;

export function VLibrasWidget() {
  const pathname = usePathname();

  // Widget embeddable: sem VLibras dentro de iframes de terceiros
  if (pathname?.startsWith("/embed")) return null;

  return (
    <>
      <div {...vwRoot} className="enabled">
        <div {...vwButton} className="active" />
        <div {...vwWrapper}>
          <div className="vw-plugin-top-wrapper" />
        </div>
      </div>
      <Script
        src="https://vlibras.gov.br/app/vlibras-plugin.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (window.VLibras) {
            new window.VLibras.Widget("https://vlibras.gov.br/app");
          }
        }}
      />
    </>
  );
}
