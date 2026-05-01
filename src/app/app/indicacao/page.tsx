import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import type { Metadata } from "next";
import { ReferralPanel } from "./ReferralPanel";

export const metadata: Metadata = {
  title: "Indicar amigos | EcoMed",
  description: "Compartilhe seu código e ganhe EcoCoins por cada amigo que se cadastrar.",
};

export default async function IndicacaoPage() {
  const session = await requireSession();
  const userId = session.user!.id!;

  const [user] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        referralCode: true,
        referrals: {
          select: {
            id: true,
            name: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    }),
  ]);

  if (!user) return null;

  const indicacoesConfirmadas = await prisma.coinTransaction.count({
    where: {
      event: "REFERRAL",
      wallet: { userId },
    },
  });

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Indicar amigos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Convide amigos para o EcoMed e ganhe <span className="font-semibold text-eco-teal-dark">+10 EcoCoins</span> por cada um que se cadastrar.
        </p>
      </div>

      <ReferralPanel
        referralCode={user.referralCode}
        referidos={user.referrals.map((r) => ({
          id: r.id,
          name: r.name ?? "Eco-Cidadão",
          createdAt: r.createdAt.toISOString(),
        }))}
        indicacoesConfirmadas={indicacoesConfirmadas}
        coinsGanhos={indicacoesConfirmadas * 10}
      />
    </div>
  );
}
