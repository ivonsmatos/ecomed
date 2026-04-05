import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { CheckCircle2, Clock, Trophy, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { CoinDisclaimer } from "@/components/coins/CoinDisclaimer";

export const metadata = { title: "Missões | EcoMed" };

function diaUTC0(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}
function inicioSemanaUTC0(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d;
}

export default async function MissoesPage() {
  const session = await requireSession();
  const userId = session.user!.id!;

  const hoje = diaUTC0();
  const amanha = new Date(hoje);
  amanha.setUTCDate(amanha.getUTCDate() + 1);
  const inicioSemana = inicioSemanaUTC0();
  const fimSemana = new Date(inicioSemana);
  fimSemana.setUTCDate(fimSemana.getUTCDate() + 7);

  const [wallet, missoesHoje, missoesSemanais] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId } }),
    prisma.userMission.findMany({
      where: { userId, expiresAt: { gte: hoje, lt: amanha } },
      include: { mission: true },
      orderBy: { mission: { type: "asc" } },
    }),
    prisma.userMission.findMany({
      where: { userId, expiresAt: { gte: inicioSemana, lt: fimSemana }, mission: { type: "WEEKLY" } },
      include: { mission: true },
    }),
  ]);

  const nivel = wallet?.level ?? "SEMENTE";
  const podeSemanais = nivel !== "SEMENTE";
  const completasHoje = missoesHoje.filter((m) => m.completed).length;
  const bonusDiarioGanho = completasHoje === missoesHoje.length && missoesHoje.length > 0;

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Missões</h1>
        <p className="text-sm text-muted-foreground mt-1">Complete as missões do dia para ganhar Coins extras.</p>
      </div>

      {/* Missões Diárias */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Clock className="size-4 text-blue-500" />
            Missões do dia
          </h2>
          <span className="text-xs text-muted-foreground">
            {completasHoje}/{missoesHoje.length} completas
          </span>
        </div>

        {missoesHoje.length === 0 ? (
          <div className="rounded-xl border p-6 text-center text-sm text-muted-foreground">
            Suas missões serão geradas na próxima visita.{" "}
            <Link href="/app/missoes" className="underline">Recarregar?</Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {missoesHoje.map((m) => (
              <li
                key={m.id}
                className={cn(
                  "rounded-xl border p-4 flex items-center gap-4",
                  m.completed && "bg-eco-teal/10 border-eco-teal/20 dark:bg-eco-teal/10 dark:border-eco-teal/30",
                )}
              >
                {m.completed ? (
                  <CheckCircle2 className="size-6 text-eco-green shrink-0" />
                ) : (
                  <div className="size-6 rounded-full border-2 border-muted-foreground/40 shrink-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-muted-foreground">{m.progress}/{m.mission.targetCount}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className={cn("font-medium text-sm", m.completed && "line-through text-muted-foreground")}>
                    {m.mission.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{m.mission.description}</p>
                </div>
                <span className={cn(
                  "shrink-0 text-sm font-bold",
                  m.completed ? "text-eco-green" : "text-yellow-600",
                )}>
                  +{m.mission.coinReward}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Bônus das 3 missões */}
        <div className={cn(
          "rounded-xl border p-3 flex items-center gap-3 text-sm",
          bonusDiarioGanho
            ? "bg-eco-teal/10 border-eco-teal/20 dark:bg-eco-teal/10 dark:border-eco-teal/30"
            : "bg-muted/40",
        )}>
          <Trophy className={cn("size-5 shrink-0", bonusDiarioGanho ? "text-eco-green" : "text-muted-foreground")} />
          <span className={bonusDiarioGanho ? "text-eco-teal-dark dark:text-green-300" : "text-muted-foreground"}>
            Bônus por completar todas as 3 missões
          </span>
          <span className={cn("ml-auto font-bold", bonusDiarioGanho ? "text-eco-green" : "text-muted-foreground")}>
            {bonusDiarioGanho ? "✓ " : ""}+10
          </span>
        </div>
      </section>

      {/* Missões Semanais */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Trophy className="size-4 text-purple-500" />
            Missões semanais
          </h2>
          {!podeSemanais && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Lock className="size-3" /> Disponível a partir de Broto
            </span>
          )}
        </div>

        {!podeSemanais ? (
          <div className="rounded-xl border border-dashed p-6 text-center space-y-1">
            <Lock className="size-8 mx-auto text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">Missões semanais bloqueadas</p>
            <p className="text-xs text-muted-foreground">
              Atinja o nível 🌿 Broto (101 Coins no total) para desbloquear.
            </p>
          </div>
        ) : missoesSemanais.length === 0 ? (
          <div className="rounded-xl border p-6 text-center text-sm text-muted-foreground">
            Suas missões semanais serão geradas na próxima visita.
          </div>
        ) : (
          <ul className="space-y-3">
            {missoesSemanais.map((m) => {
              const pct = Math.min(100, Math.round((m.progress / m.mission.targetCount) * 100));
              return (
                <li
                  key={m.id}
                  className={cn(
                    "rounded-xl border p-4 space-y-3",
                    m.completed && "bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-900",
                  )}
                >
                  <div className="flex items-center gap-4">
                    {m.completed ? (
                      <CheckCircle2 className="size-6 text-purple-600 shrink-0" />
                    ) : (
                      <div className="size-6 rounded-full border-2 border-purple-300 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={cn("font-medium text-sm", m.completed && "line-through text-muted-foreground")}>
                        {m.mission.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{m.mission.description}</p>
                    </div>
                    <span className={cn("shrink-0 text-sm font-bold", m.completed ? "text-purple-600" : "text-yellow-600")}>
                      +{m.mission.coinReward}
                    </span>
                  </div>
                  {!m.completed && (
                    <div className="space-y-1">
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                      className="h-full bg-purple-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                      </div>
                      <p className="text-xs text-muted-foreground text-right">
                        {m.progress} / {m.mission.targetCount}
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {podeSemanais && (
          <div className="rounded-xl border p-3 flex items-center gap-3 text-sm bg-muted/40">
            <Trophy className="size-5 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">Bônus por completar as 2 missões semanais</span>
            <span className="ml-auto font-bold text-muted-foreground">+15</span>
          </div>
        )}
      </section>

      <CoinDisclaimer />
    </div>
  );
}
