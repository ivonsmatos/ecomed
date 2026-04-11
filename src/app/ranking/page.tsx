import { auth } from "@/../auth";
import {
  RankingModeSwitcher,
  type RankingCard,
  type RankingEntry,
} from "@/components/ranking/RankingModeSwitcher";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { prisma } from "@/lib/db/prisma";

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

function toRankingEntry(wallet: {
  id: string;
  level: string;
  balance: number;
  weeklyCoins: number;
  user: { name: string | null };
}): RankingEntry {
  return {
    id: wallet.id,
    name: wallet.user.name ?? "Usuário",
    level: wallet.level,
    balance: wallet.balance,
    weeklyCoins: wallet.weeklyCoins,
  };
}

export default async function RankingPage() {
  const session = await auth();

  const [topGeneralWallets, topWeeklyWallets] = await Promise.all([
    prisma.wallet.findMany({
      take: 10,
      where: { balance: { gt: 0 } },
      orderBy: rankingOrderGeneral,
      include: {
        user: { select: { id: true, name: true } },
      },
    }),
    prisma.wallet.findMany({
      take: 10,
      where: { weeklyCoins: { gt: 0 } },
      orderBy: rankingOrderWeekly,
      include: {
        user: { select: { id: true, name: true } },
      },
    }),
  ]);

  let myGeneral: RankingCard | null = null;
  let myWeekly: RankingCard | null = null;

  if (session?.user?.id) {
    const me = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
      include: { user: { select: { name: true } } },
    });

    if (me) {
      const alreadyInTopGeneral = topGeneralWallets.some(
        (wallet) => wallet.user.id === session.user?.id,
      );

      if (!alreadyInTopGeneral && me.balance > 0) {
        const aheadGeneral = await prisma.wallet.count({
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

        myGeneral = {
          position: aheadGeneral + 1,
          score: me.balance,
          name: me.user.name ?? "Você",
        };
      }

      const alreadyInTopWeekly = topWeeklyWallets.some(
        (wallet) => wallet.user.id === session.user?.id,
      );

      if (!alreadyInTopWeekly && me.weeklyCoins > 0) {
        const aheadWeekly = await prisma.wallet.count({
          where: {
            OR: [
              { weeklyCoins: { gt: me.weeklyCoins } },
              {
                weeklyCoins: me.weeklyCoins,
                balance: { gt: me.balance },
              },
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
            ],
          },
        });

        myWeekly = {
          position: aheadWeekly + 1,
          score: me.weeklyCoins,
          name: me.user.name ?? "Você",
        };
      }
    }
  }

  return (
    <>
      <Header />
      <main className="container mx-auto max-w-2xl px-4 py-10">
        <RankingModeSwitcher
          topGeneral={topGeneralWallets.map(toRankingEntry)}
          topWeekly={topWeeklyWallets.map(toRankingEntry)}
          myGeneral={myGeneral}
          myWeekly={myWeekly}
        />
      </main>
      <Footer />
    </>
  );
}
