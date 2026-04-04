import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Aviso Médico | EcoMed",
  description: "O EcoMed é uma plataforma educativa e não substitui orientação médica profissional.",
  alternates: { canonical: "https://ecomed.eco.br/aviso-medico" },
};

export default function AvisoMedicoPage() {
  return (
    <>
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-12 space-y-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-8 text-amber-500" />
            <h1 className="text-3xl font-bold">Aviso Médico (Disclaimer)</h1>
          </div>
          <p className="text-sm text-muted-foreground">Última atualização: abril de 2026</p>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4 text-sm text-amber-800 dark:text-amber-200">
          <strong>Atenção:</strong> Em caso de emergência médica ou intoxicação, ligue imediatamente
          para o <strong>SAMU (192)</strong> ou procure a UPA/pronto-socorro mais próximo.
        </div>

        <div className="prose prose-green dark:prose-invert max-w-none space-y-8">
          <section>
            <h2>O que o EcoMed é</h2>
            <p>
              O EcoMed é uma plataforma <strong>EDUCATIVA</strong> sobre descarte de medicamentos e
              seus impactos ambientais. As informações disponibilizadas abordam exclusivamente:
            </p>
            <ul>
              <li>Como descartar medicamentos vencidos ou sem uso de forma correta e segura.</li>
              <li>Localização de pontos de coleta (dados do sistema LogMed e fontes oficiais).</li>
              <li>Legislação ambiental relacionada ao descarte de medicamentos.</li>
              <li>Impactos ambientais do descarte incorreto.</li>
            </ul>
          </section>

          <section>
            <h2>O que o EcoMed <strong>NÃO</strong> é</h2>
            <p>O EcoMed <strong>NÃO</strong>:</p>
            <ul>
              <li>É uma plataforma de saúde ou serviço médico.</li>
              <li>Presta serviços médicos, farmacêuticos ou de saúde.</li>
              <li>
                Substitui a orientação de médicos, farmacêuticos, enfermeiros ou outros profissionais
                de saúde.
              </li>
              <li>Fornece diagnósticos, prescrições ou recomendações terapêuticas.</li>
            </ul>
          </section>

          <section>
            <h2>Orientações importantes</h2>
            <ul>
              <li>
                Consulte sempre um médico ou farmacêutico antes de tomar qualquer decisão sobre seus
                medicamentos.
              </li>
              <li>
                Não utilize informações do EcoMed como substituto para aconselhamento médico
                profissional.
              </li>
              <li>
                Verifique a validade e condições de armazenamento de seus medicamentos com um
                farmacêutico.
              </li>
              <li>
                Em dúvida sobre descarte de medicamentos controlados ou de uso contínuo, consulte seu
                médico antes de descartá-los.
              </li>
            </ul>
          </section>

          <section>
            <h2>Sobre o EcoBot (Assistente Virtual)</h2>
            <p>
              O EcoBot é um assistente virtual baseado em IA com escopo restrito a informações
              educativas sobre descarte de medicamentos. Apesar dos mecanismos de segurança
              implementados (filtros de entrada e saída, base de conhecimento curada), as respostas
              podem conter imprecisões. O EcoBot <strong>não é um profissional de saúde</strong> e
              suas respostas não devem ser interpretadas como conselho médico.
            </p>
          </section>

          <section>
            <h2>Limitação de responsabilidade</h2>
            <p>
              Na máxima extensão permitida pela legislação aplicável, o EcoMed, sua coordenação,
              instituição vinculada e equipe de desenvolvimento isentam-se de responsabilidade por
              danos à saúde decorrentes de automedicação ou interpretação incorreta do conteúdo da
              plataforma.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
