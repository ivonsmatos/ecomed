import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Política de Cookies | EcoMed",
  description: "Como o EcoMed utiliza cookies e tecnologias similares.",
  alternates: { canonical: "https://ecomed.eco.br/cookies" },
};

export default function CookiesPage() {
  return (
    <>
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-12 space-y-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Política de Cookies</h1>
          <p className="text-sm text-muted-foreground">Última atualização: abril de 2026</p>
        </div>

        <div className="prose prose-green dark:prose-invert max-w-none space-y-8">
          <p>
            Cookies são pequenos arquivos de texto armazenados no navegador quando você acessa um
            site. O EcoMed utiliza uma <strong>quantidade mínima de cookies</strong>, priorizando a
            privacidade do usuário.
          </p>

          <section>
            <h2>1. Cookies essenciais</h2>
            <p>
              Necessários para o funcionamento da plataforma e não podem ser desativados. Incluem a
              sessão de autenticação e preferências de tema (claro/escuro).
            </p>
          </section>

          <section>
            <h2>2. Cookies analíticos (opcionais)</h2>
            <p>
              Utilizados para entender como os usuários interagem com a plataforma — apenas se você
              aceitar no banner de consentimento. Utilizamos o{" "}
              <strong>Google Analytics (G-WY07TY58R1)</strong> e o{" "}
              <strong>Google Tag Manager (GTM-NQS3PK8S)</strong> para análises agregadas.
            </p>
          </section>

          <section>
            <h2>3. Tecnologias PWA (armazenamento local)</h2>
            <p>
              Como PWA, o EcoMed utiliza <strong>IndexedDB</strong> e{" "}
              <strong>Service Workers</strong> para funcionalidades offline. Esses dados são
              armazenados <em>localmente no seu dispositivo</em> e não são transmitidos ao servidor.
            </p>
          </section>

          <section>
            <h2>4. O que <strong>NÃO</strong> fazemos</h2>
            <ul>
              <li>Não utilizamos cookies de rastreamento publicitário.</li>
              <li>Não utilizamos cookies de terceiros para fins comerciais.</li>
              <li>Não compartilhamos dados de cookies com redes de anúncios.</li>
            </ul>
          </section>

          <section>
            <h2>5. Gerenciar cookies</h2>
            <p>
              Você pode bloquear ou excluir cookies a qualquer momento pelas configurações do seu
              navegador. Isso pode impactar funcionalidades que dependem de sessão autenticada.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
