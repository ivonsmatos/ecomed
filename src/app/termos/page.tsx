import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Termos de Uso | EcoMed",
  description: "Termos e condições de uso da plataforma EcoMed.",
  alternates: { canonical: "https://ecomed.eco.br/termos" },
};

export default function TermosPage() {
  return (
    <>
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-12 space-y-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Termos de Uso</h1>
          <p className="text-sm text-muted-foreground">Última atualização: abril de 2026</p>
        </div>

        <div className="prose prose-green dark:prose-invert max-w-none space-y-8">
          <p>
            Ao acessar e utilizar a plataforma <strong>EcoMed</strong> (ecomed.eco.br), o usuário
            concorda integralmente com os presentes Termos de Uso. Caso não concorde com quaisquer
            condições aqui estabelecidas, deverá cessar imediatamente o uso da plataforma.
          </p>

          <section>
            <h2>1. Sobre a plataforma</h2>
            <p>O EcoMed é uma Progressive Web Application (PWA) educativa e gratuita que oferece:</p>
            <ul>
              <li>
                <strong>Mapa Inteligente:</strong> localização de pontos de coleta de medicamentos
                integrado com geolocalização.
              </li>
              <li>
                <strong>Assistente Virtual com IA (EcoBot):</strong> chatbot educativo sobre descarte
                de medicamentos.
              </li>
              <li>
                <strong>Sistema de Gamificação:</strong> recompensas (EcoMed Coins) que incentivam o
                descarte correto.
              </li>
              <li>
                <strong>Conteúdo Educativo:</strong> artigos, infográficos e quizzes sobre descarte
                correto de medicamentos.
              </li>
            </ul>
          </section>

          <section>
            <h2>2. Responsabilidades do usuário</h2>
            <p>O usuário é integralmente responsável por todas as atividades realizadas em sua conta e deve:</p>
            <ul>
              <li>Notificar o EcoMed imediatamente em caso de uso não autorizado de sua conta.</li>
              <li>Utilizar a plataforma para fins educativos e de consulta sobre descarte de medicamentos.</li>
            </ul>
            <p>É <strong>proibido</strong>:</p>
            <ul>
              <li>Utilizar bots ou meios automatizados para acumular EcoMed Coins de forma fraudulenta.</li>
              <li>Tentar acessar áreas restritas ou realizar engenharia reversa do código.</li>
              <li>Publicar conteúdo ofensivo, difamatório, discriminatório ou ilegal.</li>
              <li>
                Utilizar o assistente virtual para obter orientações médicas, diagnósticos ou
                prescrições.
              </li>
              <li>Compartilhar informações de saúde pessoais sensíveis em áreas públicas.</li>
              <li>Interferir na infraestrutura técnica da plataforma.</li>
            </ul>
          </section>

          <section>
            <h2>3. EcoMed Coins</h2>
            <p>
              Os EcoMed Coins são pontos virtuais de uso exclusivo dentro da plataforma.{" "}
              <strong>
                Não possuem valor monetário, não são moeda digital, criptomoeda ou ativo financeiro
              </strong>{" "}
              e não podem ser convertidos em dinheiro ou transferidos entre usuários. Os valores e
              regras podem ser alterados a qualquer momento sem aviso prévio.
            </p>
          </section>

          <section>
            <h2>4. Propriedade intelectual</h2>
            <p>
              Todo o conteúdo da plataforma (textos, artigos, ícones, logotipos, código-fonte e
              design) é protegido pela legislação de propriedade intelectual. O código-fonte do
              projeto é disponibilizado sob licença open source.
            </p>
          </section>

          <section>
            <h2>5. Limitação de responsabilidade</h2>
            <p>O EcoMed é um projeto educativo e acadêmico. Não nos responsabilizamos por:</p>
            <ul>
              <li>
                Decisões tomadas com base nas informações fornecidas pela plataforma sem consulta a
                profissional habilitado.
              </li>
              <li>
                Inexatidões ou desatualizações nas informações sobre pontos de coleta.
              </li>
              <li>Indisponibilidade temporária por manutenção ou fatores externos.</li>
              <li>Conteúdo gerado pelo assistente virtual que possa conter imprecisões.</li>
            </ul>
          </section>

          <section>
            <h2>6. Suspensão e encerramento</h2>
            <p>
              O EcoMed se reserva o direito de suspender ou encerrar a conta de qualquer usuário que
              viole estes Termos, sem aviso prévio. O usuário pode solicitar o encerramento de sua
              conta a qualquer momento pelo e-mail{" "}
              <a href="mailto:privacidade@ecomed.eco.br">privacidade@ecomed.eco.br</a>.
            </p>
          </section>

          <section>
            <h2>7. Lei aplicável e foro</h2>
            <p>
              Estes Termos são regidos pela legislação da República Federativa do Brasil. Fica eleito
              o <strong>Foro da Comarca de São Paulo/SP</strong> para dirimir quaisquer controvérsias.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
