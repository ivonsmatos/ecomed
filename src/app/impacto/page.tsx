import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { prisma } from "@/lib/db/prisma";
import { calcularImpacto } from "@/lib/impacto";

export const metadata: Metadata = {
  title: "Impacto Ambiental | EcoMed",
  description:
    "Números reais do impacto do EcoMed: descartes corretos registrados, litros de água protegidos e cobertura de pontos de coleta no Brasil.",
  alternates: { canonical: "https://ecomed.eco.br/impacto" },
};

// Estatísticas públicas — recalculadas no máximo a cada hora
export const revalidate = 3600;

const TOTAL_MUNICIPIOS_BRASIL = 5571;

async function getStats() {
  try {
    const [checkins, usuarios, pontos, cidades] = await Promise.all([
      prisma.checkin.count(),
      prisma.user.count({ where: { active: true } }),
      prisma.point.count({ where: { status: "APPROVED" } }),
      prisma.$queryRaw<[{ total: bigint }]>`
        SELECT COUNT(DISTINCT (city, state))::bigint AS total
        FROM "Point" WHERE status = 'APPROVED'
      `,
    ]);
    return {
      checkins,
      usuarios,
      pontos,
      cidadesCobertas: Number(cidades[0]?.total ?? 0),
    };
  } catch {
    return { checkins: 0, usuarios: 0, pontos: 0, cidadesCobertas: 0 };
  }
}

const fmt = (n: number) => n.toLocaleString("pt-BR");

export default async function ImpactoPage() {
  const stats = await getStats();
  const impacto = calcularImpacto(stats.checkins);
  const pctCobertura = Math.round((stats.cidadesCobertas / TOTAL_MUNICIPIOS_BRASIL) * 100);
  const cidadesSemPonto = TOTAL_MUNICIPIOS_BRASIL - stats.cidadesCobertas;

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-[#0d3b1a] py-20 text-center">
          <div className="container mx-auto max-w-3xl px-4">
            <span className="mb-4 inline-block rounded-full border border-white/20 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-eco-lime">
              Impacto em tempo real
            </span>
            <h1 className="mb-5 font-sans text-4xl font-extrabold leading-tight text-white sm:text-5xl">
              Cada descarte correto<span className="text-eco-lime"> conta</span>
            </h1>
            <p className="text-lg leading-relaxed text-white/80">
              Estes números são calculados diretamente da nossa base de dados e
              atualizados a cada hora. Sem estimativas infladas: é o que a
              comunidade EcoMed já realizou.
            </p>
          </div>
        </section>

        {/* Contadores principais */}
        <section className="bg-white py-16">
          <div className="container mx-auto max-w-5xl px-4">
            <div className="grid grid-cols-2 gap-6 text-center md:grid-cols-4">
              {[
                { v: fmt(stats.checkins), l: "descartes corretos registrados", i: "✅" },
                { v: fmt(impacto.litrosAguaProtegidos), l: "litros de água protegidos", i: "💧" },
                { v: `${impacto.kgResiduoDescartado} kg`, l: "de resíduos destinados corretamente", i: "⚖️" },
                { v: fmt(stats.usuarios), l: "cidadãos na comunidade", i: "🤝" },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl border border-gray-200 p-6">
                  <div className="mb-1 text-3xl">{s.i}</div>
                  <div className="text-3xl font-extrabold tracking-tight text-[#1A736A]">
                    {s.v}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">{s.l}</div>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-xs text-gray-400">
              Coeficientes de impacto: 1 descarte ≈ 450 L de água protegidos e 150 g de
              resíduo farmacêutico (referências: ANVISA, PNRS, estudos de ecotoxicologia).
            </p>
          </div>
        </section>

        {/* Cobertura nacional */}
        <section className="bg-gray-50 py-16">
          <div className="container mx-auto max-w-4xl px-4">
            <div className="mb-8 text-center">
              <h2 className="mb-3 font-sans text-3xl font-bold text-gray-900">
                Cobertura nacional de pontos de coleta
              </h2>
              <p className="mx-auto max-w-2xl text-gray-500">
                O EcoMed mapeia farmácias com logística reversa (LogMed) e Unidades
                Básicas de Saúde (DATASUS) em todo o Brasil.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
                <div className="text-4xl font-extrabold text-[#1A736A]">{fmt(stats.pontos)}</div>
                <div className="mt-1 text-sm text-gray-500">pontos de coleta mapeados</div>
              </div>
              <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
                <div className="text-4xl font-extrabold text-[#1A736A]">
                  {fmt(stats.cidadesCobertas)}
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  municípios com pelo menos 1 ponto ({pctCobertura}% do Brasil)
                </div>
              </div>
              <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-6 text-center">
                <div className="text-4xl font-extrabold text-amber-600">
                  {fmt(Math.max(cidadesSemPonto, 0))}
                </div>
                <div className="mt-1 text-sm text-amber-700">
                  municípios ainda sem ponto mapeado
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-2xl bg-[#1A736A] px-7 py-6 text-center">
              <p className="text-lg font-semibold text-white">
                Sua cidade está descoberta? Ajude a mudar isso.
              </p>
              <p className="mx-auto mt-1 max-w-xl text-sm text-[#D9D6D0]">
                Indique uma farmácia para o mapa ou leve o EcoMed para a Secretaria de
                Saúde do seu município.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <Link
                  href="/parceiros"
                  className="rounded-lg bg-eco-green px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-eco-green/90"
                >
                  Indicar uma farmácia
                </Link>
                <Link
                  href="/contato"
                  className="rounded-lg border-2 border-white px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
                >
                  Falar com a equipe
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Por que isso importa */}
        <section className="bg-white py-16">
          <div className="container mx-auto max-w-4xl px-4">
            <h2 className="mb-8 text-center font-sans text-3xl font-bold text-gray-900">
              Por que cada número importa
            </h2>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {[
                {
                  i: "🐟",
                  t: "Fauna aquática",
                  d: "Fármacos no esgoto causam feminização de peixes e colapso de populações. Cada descarte correto evita essa cadeia.",
                },
                {
                  i: "🦠",
                  t: "Superbactérias",
                  d: "Antibióticos descartados na pia selecionam bactérias resistentes que voltam para nós pela água e alimentos.",
                },
                {
                  i: "🚰",
                  t: "Água potável",
                  d: "Estações de tratamento convencionais não removem moléculas farmacêuticas — a prevenção é o único filtro real.",
                },
              ].map((c, i) => (
                <div key={i} className="rounded-2xl border border-gray-200 p-6">
                  <div className="mb-3 text-3xl">{c.i}</div>
                  <h3 className="mb-2 text-lg font-bold text-gray-900">{c.t}</h3>
                  <p className="text-sm leading-relaxed text-gray-600">{c.d}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link
                href="/mapa"
                className="inline-block rounded-lg bg-eco-green px-8 py-3.5 text-base font-bold text-white transition-colors hover:bg-eco-green/90"
              >
                Fazer parte desse número →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
