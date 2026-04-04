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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      {process.env.NODE_ENV === "production" && (
        <head>
          <script
            defer
            data-domain="ecomed.eco.br"
            src="https://plausible.io/js/script.js"
          />
        </head>
      )}
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
