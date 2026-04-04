import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Política de Privacidade | EcoMed",
  description: "Como o EcoMed coleta, utiliza e protege seus dados pessoais conforme a LGPD.",
  alternates: { canonical: "https://ecomed.eco.br/privacidade" },
};

export default function PrivacidadePage() {
  return (
    <>
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-12 space-y-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Política de Privacidade</h1>
          <p className="text-sm text-muted-foreground">Última atualização: abril de 2026</p>
        </div>

        <div className="prose prose-green dark:prose-invert max-w-none space-y-8">
          <p>
            A presente Política de Privacidade descreve como o <strong>EcoMed</strong> (acessível em{" "}
            <a href="https://ecomed.eco.br">ecomed.eco.br</a>), projeto acadêmico desenvolvido sob
            coordenação da Escola Técnica Estadual, coleta, utiliza, armazena, compartilha e protege
            os dados pessoais dos usuários.
          </p>
          <p>
            Esta política foi elaborada em conformidade com a{" "}
            <strong>Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD)</strong>, o
            Marco Civil da Internet (Lei nº 12.965/2014), o Código de Defesa do Consumidor (Lei nº
            8.078/1990) e demais normas aplicáveis.
          </p>

          <section>
            <h2>1. Dados coletados e finalidades</h2>
            <p>
              Os dados pessoais coletados são utilizados exclusivamente para as seguintes finalidades:
            </p>
            <ul>
              <li>Fornecer os serviços da plataforma (mapa de pontos, gamificação, notificações).</li>
              <li>
                Fornecer respostas educativas por meio do assistente virtual com inteligência
                artificial (EcoBot).
              </li>
              <li>Enviar comunicações relacionadas ao uso da plataforma.</li>
              <li>Cumprir obrigações legais e regulatórias.</li>
            </ul>
          </section>

          <section>
            <h2>2. Compartilhamento de dados</h2>
            <p>
              O EcoMed <strong>NÃO</strong> compartilha, vende, aluga ou comercializa dados pessoais
              dos usuários. Dados poderão ser compartilhados apenas:
            </p>
            <ul>
              <li>
                <strong>Determinação legal ou judicial:</strong> quando exigido por autoridade
                competente.
              </li>
              <li>
                <strong>Prestação de serviço:</strong> com provedores de infraestrutura (hospedagem,
                banco de dados) que atuam como operadores, sob contrato de confidencialidade e adesão
                à LGPD.
              </li>
              <li>
                <strong>Dados anonimizados:</strong> estatísticas agregadas sem possibilidade de
                identificação individual poderão ser usadas em relatórios de impacto ambiental.
              </li>
            </ul>
          </section>

          <section>
            <h2>3. Armazenamento e segurança</h2>
            <p>
              Os dados são armazenados em banco de dados PostgreSQL com certificação de segurança.
              Adotamos medidas técnicas e organizacionais para proteger as informações contra acesso
              não autorizado, perda ou divulgação indevida.
            </p>
          </section>

          <section>
            <h2>4. Transferência internacional</h2>
            <p>
              Alguns provedores de infraestrutura podem armazenar dados fora do Brasil. Nesses casos,
              garantimos que a transferência ocorre em conformidade com o{" "}
              <strong>artigo 33 da LGPD</strong>, mediante cláusulas contratuais padrão (SCCs) e
              verificação de grau adequado de proteção (certificações SOC 2 e ISO 27001).
            </p>
          </section>

          <section>
            <h2>5. Direitos do usuário</h2>
            <p>Em conformidade com os artigos 17 a 22 da LGPD, o usuário possui os direitos de:</p>
            <ul>
              <li>Confirmar a existência de tratamento e acessar seus dados.</li>
              <li>Solicitar correção de dados incompletos, inexatos ou desatualizados.</li>
              <li>Solicitar anonimização, bloqueio ou eliminação de dados desnecessários.</li>
              <li>Solicitar portabilidade dos dados a outro fornecedor.</li>
              <li>Revogar o consentimento a qualquer momento, sem prejuízo.</li>
              <li>Solicitar a exclusão completa da conta e de todos os dados pessoais.</li>
            </ul>
            <p>
              Para exercer qualquer desses direitos, entre em contato:{" "}
              <a href="mailto:privacidade@ecomed.eco.br">privacidade@ecomed.eco.br</a>. Prazo de
              atendimento: até 15 (quinze) dias úteis.
            </p>
          </section>

          <section>
            <h2>6. Menores de idade</h2>
            <p>
              O EcoMed é direcionado a usuários maiores de 18 anos. Não coletamos intencionalmente
              dados de crianças e adolescentes. Caso tenhamos conhecimento de coleta sem consentimento
              dos responsáveis, adotaremos medidas imediatas de exclusão conforme a LGPD.
            </p>
          </section>

          <section>
            <h2>7. Alterações desta política</h2>
            <p>
              Esta política poderá ser atualizada periodicamente. Alterações relevantes serão
              comunicadas por notificação na plataforma e/ou e-mail cadastrado.
            </p>
          </section>

          <section>
            <h2>8. Contato e ANPD</h2>
            <p>
              Dúvidas ou reclamações:{" "}
              <a href="mailto:privacidade@ecomed.eco.br">privacidade@ecomed.eco.br</a>.
            </p>
            <p>
              O usuário também pode apresentar reclamação à{" "}
              <strong>Autoridade Nacional de Proteção de Dados (ANPD)</strong> pelo site{" "}
              <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer">
                gov.br/anpd
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
