import Link from "next/link";
import { MapPin, Leaf, ShieldCheck, Smartphone, ArrowRight, ChevronDown } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "https://ecomed.eco.br" },
};

const faqItems = [
  {
    question: "Onde posso descartar medicamentos vencidos?",
    answer:
      "Medicamentos vencidos ou sem uso devem ser descartados em farmácias e drogarias participantes do programa de logística reversa, Unidades Básicas de Saúde (UBS), hospitais e ecopontos municipais. O EcoMed mapeia todos esses pontos verificados — use o mapa para encontrar o mais próximo de você.",
  },
  {
    question: "Posso jogar remédio no lixo comum ou no vaso sanitário?",
    answer:
      "Não. O descarte de medicamentos no lixo doméstico ou vaso sanitário é proibido e prejudicial. Substâncias farmacêuticas podem contaminar o lençol freático, rios e solos, afetando toda a cadeia alimentar. O descarte correto em pontos de coleta é obrigatório no Brasil pela Lei 12.305/2010.",
  },
  {
    question: "Quais medicamentos posso entregar nos pontos de coleta?",
    answer:
      "São aceitos medicamentos vencidos, sobras de tratamento, comprimidos, cápsulas, xaropes, pomadas, ampolas, injetáveis de uso domiciliar e suas embalagens. Alguns pontos também aceitam seringas e termômetros quebrados. Não é necessário retirar bulas ou abrir embalagens.",
  },
  {
    question: "Farmácias são obrigadas a aceitar medicamentos para descarte?",
    answer:
      "Sim. O Decreto nº 10.388/2020 regulamenta a logística reversa de medicamentos domiciliares e obriga fabricantes, distribuidores e importadores a manter pontos de coleta. Farmácias e drogarias são os principais pontos de recebimento no Brasil.",
  },
  {
    question: "O serviço do EcoMed é gratuito?",
    answer:
      "Sim, o EcoMed é totalmente gratuito para cidadãos. Basta criar uma conta para acessar o mapa completo, favoritar pontos e usar o assistente de IA especializado em descarte de medicamentos.",
  },
  {
    question: "Como minha farmácia pode aparecer no mapa do EcoMed?",
    answer:
      "Farmácias e estabelecimentos de saúde que sejam pontos de coleta de medicamentos podem se cadastrar gratuitamente no EcoMed. Após uma verificação pela nossa equipe, o ponto aparece no mapa e fica visível para todos os usuários da plataforma.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

const stats = [
  { value: "1 bilhão", label: "de embalagens de medicamentos descartadas por ano no Brasil" },
  { value: "70%", label: "dos brasileiros descartam remédios no lixo comum ou esgoto" },
  { value: "Decreto 10.388/2020", label: "obriga logística reversa de medicamentos domiciliares" },
  { value: "Gratuito", label: "para cidadãos e pontos de coleta cadastrados no EcoMed" },
];

const features = [
  {
    icon: MapPin,
    title: "Mapa interativo",
    description:
      "Encontre pontos de coleta de medicamentos em farmácias, UBS e ecopontos perto de você.",
  },
  {
    icon: Leaf,
    title: "Impacto ambiental",
    description:
      "Medicamentos descartados incorretamente contaminam rios e solos. Descarte correto salva o meio ambiente.",
  },
  {
    icon: ShieldCheck,
    title: "Pontos verificados",
    description:
      "Todos os pontos de coleta são verificados e aprovados pela equipe do EcoMed antes de aparecer no mapa.",
  },
  {
    icon: Smartphone,
    title: "Funciona offline",
    description:
      "Salve pontos favoritos e acesse mesmo sem conexão com a internet. Perfeito para uso no dia a dia.",
  },
];

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Header />
      <main className="flex flex-col">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 py-20 md:py-32">
          <div className="container mx-auto px-4 text-center">
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-green-700 text-white shadow-lg">
              <Leaf className="size-8" />
            </div>
            <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight text-green-950 dark:text-green-50 md:text-5xl lg:text-6xl">
              Seu remédio tem destino certo.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-green-900/70 dark:text-green-100/70">
              Encontre pontos de coleta de medicamentos vencidos ou sem uso próximos a você.
              Proteja o meio ambiente e a saúde pública.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/mapa"
                className={cn(buttonVariants({ size: "lg" }), "bg-green-700 hover:bg-green-800 text-white gap-2")}
              >
                <MapPin className="size-4" />
                Encontrar ponto próximo
              </Link>
              <Link href="/cadastrar" className={buttonVariants({ size: "lg", variant: "outline" })}>
                Cadastrar meu ponto
                <ArrowRight className="size-4 ml-2" />
              </Link>
            </div>
          </div>
        </section>

        {/* Stats — citabilidade para IA */}
        <section className="border-b bg-white dark:bg-zinc-900 py-12">
          <div className="container mx-auto px-4">
            <dl className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-center">
              {stats.map((s) => (
                <div key={s.value}>
                  <dt className="text-2xl font-bold text-green-700">{s.value}</dt>
                  <dd className="mt-1 text-sm text-muted-foreground">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Features */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-3xl font-bold">Por que usar o EcoMed?</h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <div key={feature.title} className="flex flex-col items-center text-center">
                  <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                    <feature.icon className="size-6" />
                  </div>
                  <h3 className="mb-2 font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t bg-green-700 py-16 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-4 text-3xl font-bold">Sua farmácia já é um ponto de coleta?</h2>
            <p className="mb-8 text-green-100">
              Cadastre gratuitamente e apareça no mapa do EcoMed. Ajude sua comunidade com o
              descarte correto.
            </p>
            <Link
              href="/cadastrar"
              className={cn(buttonVariants({ size: "lg", variant: "outline" }), "border-white text-white hover:bg-white hover:text-green-700")}
            >
              Cadastrar minha farmácia
            </Link>
          </div>
        </section>

        {/* FAQ — schema FAQPage + citabilidade para IA */}
        <section id="faq" className="py-20 bg-zinc-50 dark:bg-zinc-900">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="mb-2 text-center text-3xl font-bold">Perguntas Frequentes</h2>
            <p className="mb-10 text-center text-muted-foreground">
              Tudo que você precisa saber sobre o descarte correto de medicamentos no Brasil.
            </p>
            <dl className="space-y-6">
              {faqItems.map((item) => (
                <div key={item.question} className="rounded-xl border bg-white dark:bg-zinc-800 p-6 shadow-sm">
                  <dt className="flex items-start justify-between gap-4">
                    <span className="font-semibold text-base">{item.question}</span>
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground mt-0.5" />
                  </dt>
                  <dd className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    {item.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

