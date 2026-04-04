import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    template: "%s | EcoMed",
    default: "EcoMed — Seu remédio tem destino certo.",
  },
  description:
    "Encontre pontos de coleta de medicamentos vencidos perto de você. Farmácias, UBS e ecopontos para descarte seguro e sustentável.",
  keywords: ["descarte medicamentos", "coleta medicamentos", "farmácia coleta", "ecoponto"],
  authors: [{ name: "EcoMed" }],
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "EcoMed", statusBarStyle: "default" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://ecomed.eco.br",
    siteName: "EcoMed",
    title: "EcoMed — Seu remédio tem destino certo.",
    description: "Encontre pontos de coleta de medicamentos vencidos perto de você.",
  },
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "EcoMed",
  url: "https://ecomed.eco.br",
  logo: "https://ecomed.eco.br/icons/icon-512.png",
  description:
    "Plataforma brasileira para mapeamento de pontos de coleta de medicamentos vencidos e sem uso. Conecta cidadãos a farmácias, UBS e ecopontos para descarte seguro e sustentável.",
  foundingDate: "2025",
  areaServed: { "@type": "Country", name: "Brasil" },
  sameAs: [
    "https://github.com/ivonsmatos/ecomed",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    availableLanguage: "Portuguese",
    url: "https://ecomed.eco.br/app/chat",
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "EcoMed",
  url: "https://ecomed.eco.br",
  description: "Seu remédio tem destino certo. Encontre pontos de coleta de medicamentos vencidos perto de você.",
  inLanguage: "pt-BR",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://ecomed.eco.br/mapa?busca={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* JSON-LD — Organization + WebSite schemas (GEO/AI citability) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        {process.env.NODE_ENV === "production" && (
          <script
            defer
            data-domain="ecomed.eco.br"
            src="https://plausible.io/js/script.js"
          />
        )}
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
