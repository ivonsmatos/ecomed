import type { Metadata } from "next"
import { IMPACT_ASSUMPTIONS } from "@/lib/impacto"

export const metadata: Metadata = {
  title: "Metodologia de Impacto",
  description: "Hipóteses, limites e versão das estimativas ambientais exibidas pelo EcoMed.",
}

export default function MetodologiaImpactoPage() {
  return (
    <main className="container mx-auto max-w-3xl space-y-8 px-4 py-16">
      <div>
        <p className="text-sm font-medium text-eco-teal">Versão {IMPACT_ASSUMPTIONS.version}</p>
        <h1 className="mt-2 text-4xl font-bold">Metodologia de impacto</h1>
        <p className="mt-4 text-muted-foreground">
          Atualizada em {new Date(IMPACT_ASSUMPTIONS.updatedAt).toLocaleDateString("pt-BR")}.
        </p>
      </div>
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">O que é medido</h2>
        <p>
          O EcoMed mede check-ins confirmados em pontos de coleta. O check-in comprova uma
          interação com o ponto, mas ainda não mede massa, volume ou composição da entrega.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">O que é estimado</h2>
        <p>
          A proteção hídrica é apresentada como potencial, usando o cenário de até{" "}
          {IMPACT_ASSUMPTIONS.litersWaterPotentialPerCheckin.toLocaleString("pt-BR")} litros por
          check-in. Não representa água efetivamente medida ou descontaminada.
        </p>
        <p>
          CO₂ evitado e massa de resíduos não são publicados como resultados enquanto não houver
          medição ou metodologia validada.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Limitações</h2>
        <p>
          A quantidade de itens varia por entrega. As estimativas não substituem pesagem no ponto,
          inventário ambiental ou auditoria independente.
        </p>
      </section>
    </main>
  )
}
