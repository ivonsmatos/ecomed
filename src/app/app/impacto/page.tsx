import { requireSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import { calcularImpacto } from "@/lib/impacto"

export const metadata = { title: "Meu Impacto Ambiental" }

export default async function ImpactoPage() {
  const session = await requireSession()
  const userId = session.user!.id!

  const [checkinsCount, wallet] = await Promise.all([
    prisma.checkin.count({ where: { userId } }),
    prisma.wallet.findUnique({ where: { userId } }),
  ])

  const impacto = calcularImpacto(checkinsCount)

  return (
    <main className="max-w-md mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-medium text-primary">Seu Impacto Ambiental</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Baseado nos seus {checkinsCount} descartes corretos
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
          <p className="text-4xl font-bold text-blue-700">
            {impacto.litrosAguaProtegidos.toLocaleString("pt-BR")}
          </p>
          <p className="text-blue-600 text-sm mt-1">litros de água protegidos</p>
          <p className="text-blue-500 text-xs mt-2">
            Medicamentos descartados incorretamente contaminam rios e lençóis freáticos
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-eco-teal/10 border border-eco-teal/20 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-eco-teal-dark">{impacto.kgResiduoDescartado} kg</p>
            <p className="text-eco-green text-xs mt-1">resíduos corretamente destinados</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{impacto.co2EvitadoKg} kg</p>
            <p className="text-amber-600 text-xs mt-1">CO₂ evitado na natureza</p>
          </div>
        </div>
      </div>

      {wallet && (
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-sm text-muted-foreground">Seus EcoCoins</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">
            {wallet.balance.toLocaleString("pt-BR")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Nível: {wallet.level}</p>
        </div>
      )}

      {checkinsCount === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Faça seu primeiro check-in em um ponto de coleta para ver seu impacto!
        </p>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Cálculos baseados em dados ANVISA e estudos de logística reversa (PNRS 2020)
      </p>
    </main>
  )
}
