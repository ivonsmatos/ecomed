import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BrainCircuit,
  Leaf,
  MapPin,
  Scale,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Compromisso | EcoMed",
  description:
    "Conheca os compromissos institucionais do EcoMed com sustentabilidade, educacao acessivel, inovacao responsavel e impacto mensuravel.",
  alternates: { canonical: "https://ecomed.eco.br/compromisso" },
};

const compromissos = [
  {
    icon: MapPin,
    title: "Facilitar o descarte correto",
    description:
      "Transformar informacao dispersa em acao simples, com mapa inteligente e mais de 7.500 pontos de coleta visiveis para qualquer pessoa.",
  },
  {
    icon: BookOpen,
    title: "Educar em linguagem acessivel",
    description:
      "Traduzir legislacao e orientacoes tecnicas para uma comunicacao clara, sem jargao, para reduzir o descarte incorreto de medicamentos.",
  },
  {
    icon: BrainCircuit,
    title: "Usar IA com responsabilidade",
    description:
      "Aplicar inteligencia artificial com guardrails: sem prescricao medica, sem substituicao de profissionais de saude e com redirecionamento seguro.",
  },
  {
    icon: BarChart3,
    title: "Medir e publicar impacto",
    description:
      "Acompanhar resultados com indicadores reais, como pessoas educadas, descartes corretos e litros de agua potencialmente protegidos.",
  },
];

const marcos = [
  "Lei 12.305/2010 (PNRS): responsabilidade compartilhada no ciclo de residuos.",
  "Decreto 10.388/2020: logistica reversa de medicamentos domiciliares (LogMed).",
  "RDC 222/2018 (ANVISA): boas praticas de gerenciamento de residuos de saude.",
  "ODS 3, ODS 6 e ODS 12 (ONU): saude, agua potavel e consumo responsavel.",
];

const pilaresConfianca = [
  {
    icon: ShieldCheck,
    title: "Transparencia e confianca",
    points: [
      "Projeto open source com codigo publico.",
      "Politicas de privacidade claras e alinhadas a LGPD.",
      "Nao comercializacao de dados pessoais dos usuarios.",
    ],
  },
  {
    icon: Scale,
    title: "Inovacao responsavel",
    points: [
      "IA orientada a educacao ambiental, nao a diagnostico clinico.",
      "Fontes oficiais como base de conhecimento (ANVISA e Ministerio da Saude).",
      "Revisao continua para reduzir respostas imprecisas e alucinacoes.",
    ],
  },
  {
    icon: Users,
    title: "Colaboracao e aprendizado",
    points: [
      "Construido por cerca de 70 estudantes de perfis multidisciplinares.",
      "Integracao entre farmacia, IA, frontend, design e negocios.",
      "Formacao profissional com impacto social mensuravel.",
    ],
  },
];

export default function CompromissoPage() {
  return (
    <>
      <Header />
      <main>
        <section className="bg-[#0d3b1a] py-24 text-center">
          <div className="container mx-auto max-w-3xl px-4">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-eco-lime">
              <Leaf className="size-3.5" />
              Compromisso EcoMed
            </span>
            <h1 className="mb-6 font-sans text-4xl font-extrabold leading-tight text-white sm:text-5xl">
              Tecnologia com proposito para
              <span className="text-eco-lime"> descarte correto de medicamentos</span>
            </h1>
            <p className="text-lg leading-relaxed text-white/80">
              Nosso compromisso e transformar desconhecimento em acao. O problema nao e falta de
              vontade: e falta de orientacao. Por isso, unimos educacao, mapa inteligente, IA
              responsavel e gamificacao para facilitar escolhas sustentaveis no dia a dia.
            </p>
          </div>
        </section>

        <section className="bg-white py-20">
          <div className="container mx-auto max-w-5xl px-4">
            <div className="mb-10 text-center">
              <h2 className="mb-3 font-sans text-3xl font-bold text-gray-900">Nossos compromissos praticos</h2>
              <p className="mx-auto max-w-2xl text-gray-500">
                O EcoMed foi desenhado para gerar impacto ambiental e de saude publica com
                acessibilidade, consistencia tecnica e foco em resultado real.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {compromissos.map((item) => {
                const Icon = item.icon;
                return (
                  <article
                    key={item.title}
                    className="rounded-2xl border border-gray-200 bg-gray-50 p-6 transition-all hover:-translate-y-0.5 hover:border-eco-lime hover:shadow-md"
                  >
                    <div className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-eco-teal/10 text-eco-lime">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-gray-600">{item.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-gray-50 py-20">
          <div className="container mx-auto max-w-4xl px-4">
            <div className="rounded-3xl border border-eco-lime/30 bg-white p-8 md:p-10">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-eco-lime">
                Manifesto EcoMed
              </p>
              <p className="text-lg leading-relaxed text-gray-700">
                &quot;A maioria das pessoas descarta medicamentos errado nao por descaso, mas por falta
                de informacao. Nosso compromisso e tornar o descarte correto simples, acessivel e
                recompensador para todos.&quot;
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white py-20">
          <div className="container mx-auto grid max-w-5xl grid-cols-1 gap-10 px-4 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <h2 className="mb-4 font-sans text-3xl font-bold text-gray-900">Compromisso com politicas publicas</h2>
              <p className="mb-6 text-gray-600">
                Atuamos em alinhamento direto com normas brasileiras e compromissos internacionais
                que orientam a saude ambiental e o descarte adequado de residuos.
              </p>
              <ul className="space-y-3">
                {marcos.map((item) => (
                  <li key={item} className="flex gap-3 rounded-xl border border-gray-200 p-4 text-sm text-gray-700">
                    <span className="mt-0.5 text-eco-lime">●</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <aside className="rounded-2xl bg-[#0d3b1a] p-8 text-white">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-eco-lime">Contexto do problema</p>
              <h3 className="mb-4 text-2xl font-bold">Por que esse compromisso e urgente?</h3>
              <ul className="space-y-4 text-sm text-white/85">
                <li>
                  <strong className="text-white">91%</strong> dos brasileiros descartam medicamentos de forma incorreta.
                </li>
                <li>
                  Cerca de <strong className="text-white">30 mil toneladas</strong> sao descartadas incorretamente por ano no Brasil.
                </li>
                <li>
                  <strong className="text-white">1 comprimido</strong> pode contaminar ate 450.000 litros de agua.
                </li>
              </ul>
            </aside>
          </div>
        </section>

        <section className="bg-gray-50 py-20">
          <div className="container mx-auto max-w-5xl px-4">
            <div className="mb-10 text-center">
              <h2 className="mb-3 font-sans text-3xl font-bold text-gray-900">Compromissos de confianca</h2>
              <p className="mx-auto max-w-2xl text-gray-500">
                O EcoMed combina transparencia institucional, inovacao tecnica e colaboracao
                multidisciplinar para manter qualidade e credibilidade em escala.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {pilaresConfianca.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <article key={pillar.title} className="rounded-2xl border border-gray-200 bg-white p-6">
                    <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-eco-teal/10 text-eco-lime">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="mb-3 text-lg font-semibold text-gray-900">{pillar.title}</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      {pillar.points.map((point) => (
                        <li key={point} className="flex gap-2">
                          <span className="mt-0.5 text-eco-lime">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-white py-20">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <h2 className="mb-4 font-sans text-3xl font-bold text-gray-900">Compromisso que vira acao</h2>
            <p className="mx-auto mb-8 max-w-2xl text-gray-600">
              O EcoMed nasceu como projeto academico colaborativo em 2026 e e construido por
              aproximadamente 70 estudantes. Nosso foco e gerar impacto ambiental real com uma
              plataforma gratuita, aberta e util para toda a populacao.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/mapa"
                className="inline-flex items-center gap-2 rounded-full bg-eco-green px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-eco-green/90"
              >
                Encontrar ponto de coleta
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/sobre"
                className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-eco-lime hover:text-gray-900"
              >
                Conhecer o projeto
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}