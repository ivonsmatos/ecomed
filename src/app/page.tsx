import Link from "next/link";
import { MapPin, Leaf, ShieldCheck, Smartphone, ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

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
      <Header />
      <main className="flex flex-col">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 py-20 md:py-32">
          <div className="container mx-auto px-4 text-center">
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-green-700 text-white shadow-lg">
              <Leaf className="size-8" />
            </div>
            <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight text-green-950 dark:text-green-50 md:text-5xl lg:text-6xl">
              Descarte seus medicamentos de forma correta
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
      </main>
      <Footer />
    </>
  );
}

