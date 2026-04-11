import { auth } from "@/../auth";
import { buttonVariants } from "@/components/ui/button-variants";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { prisma } from "@/lib/db/prisma";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ranking EcoMed" };

const rankingOrderGeneral = [
  { balance: "desc" as const },
  { totalEarned: "desc" as const },
  { weeklyCoins: "desc" as const },
  { updatedAt: "asc" as const },
];

const rankingOrderWeekly = [
  { weeklyCoins: "desc" as const },
  { balance: "desc" as const },
  { totalEarned: "desc" as const },
  { updatedAt: "asc" as const },
];

type RankingMode = "geral" | "semanal";

function parseMode(mode?: string): RankingMode {
  return mode === "semanal" ? "semanal" : "geral";
}

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const session = await auth();
  const { mode: rawMode } = await searchParams;
  const mode = parseMode(rawMode);
  const isWeekly = mode === "semanal";

  const title = isWeekly ? "Ranking semanal" : "Ranking geral";
  const subtitle = isWeekly
    ? "Classificação por EcoCoins ganhos na semana"
    : "Classificação por saldo total de EcoCoins";
  const metricLabel = isWeekly ? "EcoCoins (semana)" : "EcoCoins (total)";
  const myRankSuffix = isWeekly ? "EcoCoins na semana" : "EcoCoins no total";

  const top = await prisma.wallet.findMany({
    take: 10,
    where: isWeekly ? { weeklyCoins: { gt: 0 } } : { balance: { gt: 0 } },
    orderBy: isWeekly ? rankingOrderWeekly : rankingOrderGeneral,
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
  });

  let myRankCard: {
    position: number;
    score: number;
    level: string;
    name: string;
  } | null = null;

  if (session?.user?.id) {
    const me = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
      include: { user: { select: { name: true } } },
    });

    const alreadyInTop = top.some((wallet) => wallet.user.id === session.user?.id);

    const hasScore = me ? (isWeekly ? me.weeklyCoins > 0 : me.balance > 0) : false;

    if (me && !alreadyInTop && hasScore) {
      const ahead = await prisma.wallet.count({
        where: {
          OR: isWeekly
            ? [
                { weeklyCoins: { gt: me.weeklyCoins } },
                { weeklyCoins: me.weeklyCoins, balance: { gt: me.balance } },
                {
                  weeklyCoins: me.weeklyCoins,
                  balance: me.balance,
                  totalEarned: { gt: me.totalEarned },
                },
                {
                  weeklyCoins: me.weeklyCoins,
                  balance: me.balance,
                  totalEarned: me.totalEarned,
                  updatedAt: { lt: me.updatedAt },
                },
              ]
            : [
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
        score: isWeekly ? me.weeklyCoins : me.balance,
        level: me.level,
        name: me.user.name ?? "Você",
      };
    }
  }

  return (
    <>
      <Header />
      <main className="container mx-auto max-w-2xl px-4 py-10">
        <div className="mb-6 flex justify-center gap-2">
          <Link
            href="/ranking?mode=geral"
            className={cn(buttonVariants({ variant: !isWeekly ? "default" : "outline", size: "sm" }))}
          >
            Geral
          </Link>
          <Link
            href="/ranking?mode=semanal"
            className={cn(buttonVariants({ variant: isWeekly ? "default" : "outline", size: "sm" }))}
          >
            Semanal
          </Link>
        </div>

        <h1 className="text-2xl font-semibold mb-2 text-center">{title}</h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          {subtitle}
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
                  {(isWeekly ? wallet.weeklyCoins : wallet.balance).toLocaleString("pt-BR")}
                </p>
                <p className="text-xs text-muted-foreground">{metricLabel}</p>
              </div>
            </div>
          ))}
        </div>

        {myRankCard && (
          <div className="mt-6 rounded-xl border border-eco-teal/30 bg-eco-teal/10 p-4">
            <p className="text-sm font-semibold text-eco-teal-dark mb-1">Sua posição no ranking</p>
            <p className="text-sm text-foreground">
              {myRankCard.position}º lugar - {myRankCard.name} - {myRankCard.score.toLocaleString("pt-BR")} {myRankSuffix}
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
