import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bot, BookOpen, Coins, MapPin, ShieldCheck } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "O que fazemos | EcoMed",
  description:
    "Entenda como o EcoMed transforma o descarte correto de medicamentos em ação com mapa inteligente, IA educativa e gamificação.",
  alternates: { canonical: "https://ecomed.eco.br/o-que-fazemos" },
};

const frentes = [
  {
    icon: MapPin,
    title: "Encontre pontos de coleta",
    description:
      "Mapa inteligente com mais de 7.500 pontos LogMed para localizar farmácias, UBS e hospitais próximos de você.",
  },
  {
    icon: Bot,
    title: "Responda dúvidas com IA",
    description:
      "EcoBot disponível 24 horas para orientar sobre descarte, legislação e impacto ambiental em linguagem simples.",
  },
  {
    icon: Coins,
    title: "Transforme ação em recompensa",
    description:
      "Cada descarte correto, quiz e leitura educativa gera EcoMed Coins para estimular hábitos sustentáveis.",
  },
];

const desafios = [
  "91% dos brasileiros descartam medicamentos de forma incorreta.",
  "Cerca de 30 mil toneladas são descartadas incorretamente por ano no Brasil.",
  "Um comprimido pode contaminar até 450.000 litros de água.",
  "Antibióticos descartados incorretamente contribuem para superbactérias.",
];

const basePublica = [
  "Lei 12.305/2010 (PNRS): responsabilidade compartilhada no ciclo de resíduos.",
  "Decreto 10.388/2020: logística reversa de medicamentos domiciliares (LogMed).",
  "RDC 222/2018 (ANVISA): boas práticas de gerenciamento de resíduos de saúde.",
  "ODS 3, ODS 6 e ODS 12 (ONU): saúde, água potável e consumo responsável.",
];

const metodo = [
  {
    icon: MapPin,
    title: "Mapeamos o caminho",
    description:
      "Concentramos em um único lugar dados de pontos de coleta para reduzir a distância entre intenção e descarte correto.",
  },
  {
    icon: BookOpen,
    title: "Educamos com clareza",
    description:
      "Traduzimos normas técnicas e temas de saúde ambiental para linguagem acessível, sem jargão e com foco prático.",
  },
  {
    icon: ShieldCheck,
    title: "Aplicamos IA responsável",
    description:
      "Nossa IA é educativa, com guardrails, sem prescrição médica e com redirecionamento para profissionais quando necessário.",
  },
];

export default function OQueFazemosPage() {
  return (
    <>
      <Header />
      <main>
        <section className="bg-[#0d3b1a] py-24 text-center">
          <div className="container mx-auto max-w-3xl px-4">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-eco-lime">
              O que fazemos no EcoMed
            </span>
            <h1 className="mb-6 font-sans text-4xl font-extrabold leading-tight text-white sm:text-5xl">
              Transformamos descarte correto em
              <span className="text-eco-lime"> ação simples no dia a dia</span>
            </h1>
            <p className="text-lg leading-relaxed text-white/80">
              O EcoMed conecta educação ambiental, tecnologia e políticas públicas para ajudar
              pessoas a descartarem medicamentos com segurança, praticidade e impacto positivo.
            </p>
          </div>
        </section>

        <section className="bg-white py-20">
          <div className="container mx-auto max-w-5xl px-4">
            <div className="mb-10 text-center">
              <h2 className="mb-3 font-sans text-3xl font-bold text-gray-900">Nossas frentes de atuação</h2>
              <p className="mx-auto max-w-2xl text-gray-500">
                Com base no modelo Encontre, Pergunte e Ganhe, tornamos o descarte correto mais
                acessível, educativo e recompensador.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {frentes.map((item) => {
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
          <div className="container mx-auto grid max-w-5xl grid-cols-1 gap-10 px-4 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <h2 className="mb-4 font-sans text-3xl font-bold text-gray-900">Como fazemos acontecer</h2>
              <p className="mb-6 text-gray-600">
                Nossa atuação une produto digital, conteúdo educativo e direcionamento técnico para
                que a população tenha autonomia no descarte correto.
              </p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {metodo.map((item) => {
                  const Icon = item.icon;
                  return (
                    <article key={item.title} className="rounded-xl border border-gray-200 bg-white p-5">
                      <div className="mb-3 inline-flex size-9 items-center justify-center rounded-lg bg-eco-teal/10 text-eco-lime">
                        <Icon className="size-4" />
                      </div>
                      <h3 className="mb-2 text-base font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </article>
                  );
                })}
              </div>
            </div>

            <aside className="rounded-2xl bg-[#0d3b1a] p-8 text-white">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-eco-lime">Contexto</p>
              <h3 className="mb-4 text-2xl font-bold">Problema que enfrentamos</h3>
              <ul className="space-y-4 text-sm text-white/85">
                {desafios.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-1 text-eco-lime">●</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </section>

        <section className="bg-white py-20">
          <div className="container mx-auto max-w-5xl px-4">
            <div className="mb-10 text-center">
              <h2 className="mb-3 font-sans text-3xl font-bold text-gray-900">Alinhamento com políticas públicas</h2>
              <p className="mx-auto max-w-2xl text-gray-500">
                O EcoMed foi desenhado para apoiar metas nacionais e internacionais de saúde
                ambiental, logística reversa e consumo responsável.
              </p>
            </div>

            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {basePublica.map((item) => (
                <li key={item} className="rounded-xl border border-gray-200 p-5 text-sm leading-relaxed text-gray-700">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bg-gray-50 py-20">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <h2 className="mb-4 font-sans text-3xl font-bold text-gray-900">Coloque isso em prática hoje</h2>
            <p className="mx-auto mb-8 max-w-2xl text-gray-600">
              Se você tem medicamentos vencidos ou em desuso, o primeiro passo pode ser dado agora:
              encontrar um ponto de coleta próximo e descartar com segurança.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/mapa"
                className="inline-flex items-center gap-2 rounded-full bg-eco-green px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-eco-green/90"
              >
                Abrir mapa de coleta
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/sobre"
                className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-eco-lime hover:text-gray-900"
              >
                Conhecer a história do EcoMed
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}