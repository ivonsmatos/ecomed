import { auth } from "@/../auth";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ranking EcoMed" };

const rankingOrder = [
  { balance: "desc" as const },
  { totalEarned: "desc" as const },
  { weeklyCoins: "desc" as const },
  { updatedAt: "asc" as const },
];

export default async function RankingPage() {
  const session = await auth();

  const top = await prisma.wallet.findMany({
    take: 10,
    where: {
      balance: { gt: 0 },
    },
    orderBy: rankingOrder,
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
  });

  let myRankCard: {
    position: number;
    balance: number;
    level: string;
    name: string;
  } | null = null;

  if (session?.user?.id) {
    const me = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
      include: { user: { select: { name: true } } },
    });

    const alreadyInTop = top.some((wallet) => wallet.user.id === session.user?.id);

    if (me && !alreadyInTop && me.balance > 0) {
      const ahead = await prisma.wallet.count({
        where: {
          OR: [
            { balance: { gt: me.balance } },
            {
              balance: me.balance,
              totalEarned: { gt: me.totalEarned },
            },
            {
              balance: me.balance,
              totalEarned: me.totalEarned,
              weeklyCoins: { gt: me.weeklyCoins },
            },
            {
              balance: me.balance,
              totalEarned: me.totalEarned,
              weeklyCoins: me.weeklyCoins,
              updatedAt: { lt: me.updatedAt },
            },
          ],
        },
      });

      myRankCard = {
        position: ahead + 1,
        balance: me.balance,
        level: me.level,
        name: me.user.name ?? "Você",
      };
    }
  }

  return (
    <>
      <Header />
      <main className="container mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-semibold mb-2 text-center">Ranking geral</h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          Classificação por saldo total de EcoCoins
        </p>

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
                  {wallet.balance.toLocaleString("pt-BR")}
                </p>
                <p className="text-xs text-muted-foreground">EcoCoins (total)</p>
              </div>
            </div>
          ))}
        </div>

        {myRankCard && (
          <div className="mt-6 rounded-xl border border-eco-teal/30 bg-eco-teal/10 p-4">
            <p className="text-sm font-semibold text-eco-teal-dark mb-1">Sua posição no ranking</p>
            <p className="text-sm text-foreground">
              {myRankCard.position}º lugar - {myRankCard.name} - {myRankCard.balance.toLocaleString("pt-BR")} EcoCoins no total
            </p>
          </div>
        )}

        {top.length === 0 && (
          <p className="text-center text-muted-foreground text-sm mt-8">
            Seja o primeiro a aparecer no ranking.
          </p>
        )}
      </main>
      <Footer />
    </>
  );
}
