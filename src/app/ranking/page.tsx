import { prisma } from "@/lib/db/prisma"

export const dynamic = "force-dynamic"
export const metadata = { title: "Ranking EcoMed" }

export default async function RankingPage() {
  const top = await prisma.wallet.findMany({
    take: 10,
    orderBy: { weeklyCoins: "desc" },
    include: {
      user: { select: { name: true, image: true } },
    },
  })

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-medium mb-6 text-center">Ranking semanal 🏆</h1>

      <div className="space-y-3">
        {top.map((wallet, i) => (
          <div
            key={wallet.id}
            className="flex items-center gap-4 p-3 bg-card border border-border rounded-xl"
          >
            <span
              className={`text-lg font-bold w-8 text-center ${
                i === 0
                  ? "text-amber-500"
                  : i === 1
                    ? "text-gray-400"
                    : i === 2
                      ? "text-amber-700"
                      : "text-muted-foreground"
              }`}
            >
              {i + 1}
            </span>
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
              {wallet.user.name?.[0] ?? "?"}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{wallet.user.name ?? "Usuário"}</p>
              <p className="text-xs text-muted-foreground">{wallet.level}</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-sm text-amber-600">
                {wallet.weeklyCoins.toLocaleString("pt-BR")}
              </p>
              <p className="text-xs text-muted-foreground">EcoCoins (semana)</p>
            </div>
          </div>
        ))}
      </div>

      {top.length === 0 && (
        <p className="text-center text-muted-foreground text-sm mt-8">
          Seja o primeiro a aparecer no ranking!
        </p>
      )}
    </main>
  )
}
