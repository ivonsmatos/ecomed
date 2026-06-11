import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { prisma } from "@/lib/db/prisma";
import { cidadePorSlug } from "@/lib/geo/cidades";

// SEO programático: uma página por município com pontos de coleta.
// ISR com revalidação diária — a primeira visita gera, as demais servem cache.
export const revalidate = 86400;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cidade = await cidadePorSlug(slug);
  if (!cidade) return { title: "Cidade não encontrada | EcoMed" };

  const titulo = `Onde descartar medicamentos em ${cidade.city} - ${cidade.state}`;
  return {
    title: `${titulo} | EcoMed`,
    description: `${cidade.pontos} pontos de coleta de medicamentos vencidos em ${cidade.city} - ${cidade.state}. Farmácias e UBS com descarte gratuito, endereços e mapa atualizado.`,
    alternates: { canonical: `https://ecomed.eco.br/descarte/${slug}` },
    openGraph: {
      title: titulo,
      description: `Encontre os ${cidade.pontos} pontos de descarte correto de medicamentos em ${cidade.city}.`,
    },
  };
}

export default async function DescarteCidadePage({ params }: Props) {
  const { slug } = await params;
  const cidade = await cidadePorSlug(slug);
  if (!cidade) notFound();

  const pontos = await prisma.point.findMany({
    where: { status: "APPROVED", city: cidade.city, state: cidade.state },
    select: {
      id: true,
      name: true,
      address: true,
      residueTypes: true,
    },
    orderBy: { name: "asc" },
    take: 12,
  });

  const aceitaSeringas = (tipos: string[]) =>
    tipos.some((t) => ["seringas", "seringa", "perfurocortantes", "agulhas"].includes(t));

  const faq = [
    {
      q: `É de graça descartar medicamentos em ${cidade.city}?`,
      a: "Sim. O Decreto Federal 10.388/2020 garante o descarte gratuito de medicamentos domiciliares em farmácias participantes da logística reversa. Nenhuma taxa pode ser cobrada.",
    },
    {
      q: "O que posso levar para o ponto de coleta?",
      a: "Medicamentos vencidos ou sem uso (comprimidos, xaropes, pomadas), incluindo blisters e frascos com restos. Caixas de papelão e bulas vão para a reciclagem comum.",
    },
    {
      q: "E agulhas e seringas usadas?",
      a: "Perfurocortantes devem ser levados em recipiente rígido a uma Unidade Básica de Saúde (UBS) — farmácias comuns geralmente aceitam apenas medicamentos.",
    },
    {
      q: "Por que não posso jogar remédio no lixo ou na pia?",
      a: "Um único comprimido pode contaminar até 450 mil litros de água. Estações de tratamento de esgoto não removem moléculas farmacêuticas, que chegam aos rios e criam superbactérias.",
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "ItemList",
        name: `Pontos de coleta de medicamentos em ${cidade.city} - ${cidade.state}`,
        numberOfItems: cidade.pontos,
        itemListElement: pontos.slice(0, 10).map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: p.name,
          item: {
            "@type": "Place",
            name: p.name,
            address: `${p.address}, ${cidade.city} - ${cidade.state}`,
          },
        })),
      },
    ],
  };

  return (
    <>
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main>
        {/* Hero */}
        <section className="bg-[#0d3b1a] py-16">
          <div className="container mx-auto max-w-3xl px-4">
            <span className="mb-3 inline-block rounded-full border border-white/20 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-eco-lime">
              {cidade.city} - {cidade.state}
            </span>
            <h1 className="mb-4 font-sans text-3xl font-extrabold leading-tight text-white sm:text-4xl">
              Onde descartar medicamentos em {cidade.city}
            </h1>
            <p className="text-lg leading-relaxed text-white/80">
              {cidade.city} tem <strong className="text-eco-lime">{cidade.pontos}</strong>{" "}
              {cidade.pontos === 1 ? "ponto de coleta" : "pontos de coleta"} de medicamentos
              vencidos ou sem uso. O descarte é gratuito, garantido por lei federal.
            </p>
            <Link
              href="/mapa"
              className="mt-6 inline-block rounded-lg bg-eco-green px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-eco-green/90"
            >
              Ver no mapa interativo →
            </Link>
          </div>
        </section>

        {/* Lista de pontos */}
        <section className="bg-white py-14">
          <div className="container mx-auto max-w-3xl px-4">
            <h2 className="mb-6 font-sans text-2xl font-bold text-gray-900">
              Pontos de coleta em {cidade.city}
            </h2>
            <div className="space-y-3">
              {pontos.map((p) => (
                <Link
                  key={p.id}
                  href={`/mapa/ponto/${p.id}`}
                  className="block rounded-xl border border-gray-200 p-4 transition-all hover:border-eco-teal hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-gray-900">{p.name}</h3>
                      <p className="mt-0.5 text-sm text-gray-500">{p.address}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-eco-teal/10 px-2.5 py-1 text-xs font-semibold text-eco-teal">
                      {aceitaSeringas(p.residueTypes) ? "💉 aceita seringas" : "💊 medicamentos"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            {cidade.pontos > pontos.length && (
              <p className="mt-4 text-center text-sm text-gray-500">
                + {cidade.pontos - pontos.length} outros pontos —{" "}
                <Link href="/mapa" className="font-semibold text-eco-teal hover:underline">
                  veja todos no mapa
                </Link>
              </p>
            )}
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-gray-50 py-14">
          <div className="container mx-auto max-w-3xl px-4">
            <h2 className="mb-6 font-sans text-2xl font-bold text-gray-900">
              Perguntas frequentes
            </h2>
            <div className="space-y-4">
              {faq.map((f, i) => (
                <div key={i} className="rounded-xl border border-gray-200 bg-white p-5">
                  <h3 className="mb-2 font-semibold text-gray-900">{f.q}</h3>
                  <p className="text-sm leading-relaxed text-gray-600">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#1A736A] py-14 text-center">
          <div className="container mx-auto max-w-xl px-4">
            <h2 className="mb-3 font-sans text-2xl font-extrabold text-white">
              Descarte certo, ganhe EcoCoins 🪙
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-[#D9D6D0]">
              Crie sua conta gratuita, confirme seus descartes e acompanhe o impacto
              ambiental que você gera em {cidade.city}.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/cadastrar"
                className="rounded-lg bg-eco-green px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-eco-green/90"
              >
                Criar conta grátis
              </Link>
              <Link
                href="/mapa"
                className="rounded-lg border-2 border-white px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
              >
                Abrir o mapa
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
