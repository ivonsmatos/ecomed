"use client";

import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { useState } from "react";

type RankingMode = "geral" | "semanal";

export type RankingEntry = {
  id: string;
  name: string;
  level: string;
  balance: number;
  weeklyCoins: number;
};

export type RankingCard = {
  position: number;
  score: number;
  name: string;
};

type RankingModeSwitcherProps = {
  topGeneral: RankingEntry[];
  topWeekly: RankingEntry[];
  myGeneral: RankingCard | null;
  myWeekly: RankingCard | null;
};

export function RankingModeSwitcher({
  topGeneral,
  topWeekly,
  myGeneral,
  myWeekly,
}: RankingModeSwitcherProps) {
  const [mode, setMode] = useState<RankingMode>("geral");
  const isWeekly = mode === "semanal";

  const title = isWeekly ? "Ranking semanal" : "Ranking geral";
  const subtitle = isWeekly
    ? "Classificação por EcoCoins ganhos na semana"
    : "Classificação por saldo total de EcoCoins";
  const metricLabel = isWeekly ? "EcoCoins (semana)" : "EcoCoins (total)";
  const myRankSuffix = isWeekly ? "EcoCoins na semana" : "EcoCoins no total";

  const top = isWeekly ? topWeekly : topGeneral;
  const myRankCard = isWeekly ? myWeekly : myGeneral;

  return (
    <>
      <div className="mb-6 flex justify-center gap-2">
        <button
          type="button"
          onClick={() => setMode("geral")}
          className={cn(buttonVariants({ variant: !isWeekly ? "default" : "outline", size: "sm" }))}
        >
          Geral
        </button>
        <button
          type="button"
          onClick={() => setMode("semanal")}
          className={cn(buttonVariants({ variant: isWeekly ? "default" : "outline", size: "sm" }))}
        >
          Semanal
        </button>
      </div>

      <h1 className="text-2xl font-semibold mb-2 text-center">{title}</h1>
      <p className="text-sm text-muted-foreground text-center mb-8">{subtitle}</p>

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
              {wallet.name[0] ?? "?"}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{wallet.name}</p>
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
    </>
  );
}
