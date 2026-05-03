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

          <section id="ecocoins">
            <h2>3. EcoMed Coins Natureza Jurídica e Regras</h2>

            <h3>3.1 Definição legal</h3>
            <p>
              Os <strong>EcoMed Coins</strong> são pontos virtuais de exclusivo uso interno na
              plataforma EcoMed. Em hipótese alguma devem ser confundidos com moeda,
              instrumento financeiro ou qualquer tipo de ativo econômico.
            </p>
            <p>
              Especificamente, os EcoMed Coins <strong>NÃO</strong>:
            </p>
            <ul>
              <li>possuem valor monetário, financeiro ou patrimonial;</li>
              <li>são moeda digital, criptomoeda, token ou ativo financeiro;</li>
              <li>podem ser convertidos em dinheiro (incluindo PIX, TED, DOC ou equivalente), salvo em promoções específicas expressamente comunicadas;</li>
              <li>podem ser transferidos entre usuários ou negociados com terceiros;</li>
              <li>podem ser utilizados fora da plataforma ecomed.eco.br.</li>
            </ul>

            <h3>3.2 Como são obtidos</h3>
            <p>
              Os EcoMed Coins são creditados automaticamente ao usuário em decorrência de ações
              educativas e de sustentabilidade realizadas na plataforma, como:
            </p>
            <ul>
              <li>Registro de descarte correto de medicamentos em pontos de coleta cadastrados;</li>
              <li>Leitura de artigos educativos e conclusão de quizzes;</li>
              <li>Interação com o assistente virtual EcoBot;</li>
              <li>Cumprimento de missões diárias e semanais;</li>
              <li>Indicação de novos usuários que confirmem o cadastro.</li>
            </ul>
            <p>
              Cada ação possui limites diários e condições técnicas de validação para evitar acumulação
              artificial. O EcoMed se reserva o direito de revisar, estornar ou excluir Coins obtidos
              de forma fraudulenta ou em desacordo com estas regras.
            </p>

            <h3>3.3 Resgate de recompensas</h3>
            <p>
              Os EcoMed Coins podem ser trocados por recompensas disponíveis no catálogo da
              plataforma. Ao resgatar uma recompensa, o usuário concorda que:
            </p>
            <ul>
              <li>o resgate é <strong>irreversível</strong>  os Coins gastos não são devolvidos;</li>
              <li>recompensas digitais são entregues instantaneamente; recompensas físicas ou de parceiros seguem o prazo indicado no catálogo;</li>
              <li>cada recompensa pode ter um período mínimo de espera entre resgates consecutivos (cooldown);</li>
              <li>o nível mínimo exigido deve ser atingido antes do resgate;</li>
              <li>o EcoMed pode descontinuar recompensas, respeitando os resgates já confirmados.</li>
            </ul>

            <h3>3.4 Validade e cancelamento</h3>
            <p>
              Em caso de exclusão ou encerramento de conta, todos os EcoMed Coins acumulados
              serão definitivamente perdidos, sem direito a indenização ou compensação. O EcoMed
              reserva-se o direito de alterar os valores de ações, regras de acúmulo e catálogo de
              recompensas a qualquer momento, com aviso prévio de 7 (sete) dias por e-mail ou
              notificação na plataforma, exceto em casos de ajuste emergencial de segurança.
            </p>

            <h3>3.5 Sanções por uso indevido</h3>
            <p>
              O uso de bots, scripts, múltiplas contas ou qualquer meio artificial para acumular
              EcoMed Coins é expressamente proibido e sujeito a:
            </p>
            <ul>
              <li><strong>Leve:</strong> notificação educativa;</li>
              <li><strong>Média:</strong> estorno dos Coins das últimas 24 horas + aviso formal;</li>
              <li><strong>Grave:</strong> suspensão de 7 dias e estorno total;</li>
              <li><strong>Crítica:</strong> banimento permanente e exclusão de conta.</li>
            </ul>
            <p>
              Sanções de nível médio ou superior são revisadas manualmente antes da aplicação. O
              usuário pode contestar decisões pelo e-mail{" "}
              <a href="mailto:contato@ecomed.eco.br">contato@ecomed.eco.br</a>.
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
