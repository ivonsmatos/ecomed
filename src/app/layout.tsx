import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { CookieBanner } from "@/components/shared/CookieBanner";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL("https://ecomed.eco.br"),
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
  themeColor: "#1A736A",
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
    "https://www.instagram.com/ecomed.eco.br",
    "https://www.facebook.com/ecomed.eco.br",
    "https://www.linkedin.com/company/ecomed-brasil",
    "https://twitter.com/ecomed_eco_br",
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
      </head>
      <body className="min-h-screen bg-background font-sans antialiased" suppressHydrationWarning>
        {/* Google Tag Manager (noscript) */}
        {process.env.NODE_ENV === "production" && (
          <noscript>
            <iframe
              src="https://www.googletagmanager.com/ns.html?id=GTM-NQS3PK8S"
              height="0"
              width="0"
              className="hidden invisible"
            />
          </noscript>
        )}
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
          <CookieBanner />
          <Toaster richColors position="top-right" />
        </ThemeProvider>
        {/* Analytics — carregados após hidratação para evitar erros de hidratação (React #418) */}
        {process.env.NODE_ENV === "production" && (
          <>
            {/* Google Tag Manager */}
            <Script id="gtm" strategy="afterInteractive">
              {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-NQS3PK8S');`}
            </Script>
            {/* Google Analytics */}
            <Script src="https://www.googletagmanager.com/gtag/js?id=G-WY07TY58R1" strategy="afterInteractive" />
            <Script id="ga" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-WY07TY58R1');`}
            </Script>
            {/* Plausible Analytics */}
            <Script defer data-domain="ecomed.eco.br" src="https://plausible.io/js/script.js" strategy="afterInteractive" />
          </>
        )}
      </body>
    </html>
  );
}
