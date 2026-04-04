import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { Coins, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { CoinDisclaimer } from "@/components/coins/CoinDisclaimer";
import { RedeemButton } from "@/components/coins/RedeemButton";

export const metadata = { title: "Recompensas | EcoMed" };

const NIVEL_ORDEM = ["SEMENTE", "BROTO", "ARVORE", "GUARDIAO", "LENDA_ECO"];
const NIVEL_LABEL: Record<string, string> = {
  SEMENTE: "🌱 Semente",
  BROTO: "🌿 Broto",
  ARVORE: "🌳 Árvore",
  GUARDIAO: "🌍 Guardião",
  LENDA_ECO: "⭐ Lenda Eco",
};

function nivelAtingido(nivelUsuario: string, nivelMin: string): boolean {
  return NIVEL_ORDEM.indexOf(nivelUsuario) >= NIVEL_ORDEM.indexOf(nivelMin);
}

export default async function RecompensasPage() {
  const session = await requireSession();
  const userId = session.user!.id!;

  const [wallet, catalog, resgatesRecentes] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId } }),
    prisma.rewardCatalog.findMany({
      where: { active: true },
      orderBy: [{ minLevel: "asc" }, { cost: "asc" }],
    }),
    prisma.userReward.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const balance = wallet?.balance ?? 0;
  const nivel = wallet?.level ?? "SEMENTE";

  // Agrupar por tier
  const grupos = { digital: "Digital (entrega instantânea)", physical: "Físico / Parceiro" };

  const recompendasComStatus = catalog.map((r) => {
    const pode = balance >= r.cost && nivelAtingido(nivel, r.minLevel) && (r.stock === null || r.stock > 0);
    const ultimoResgate = resgatesRecentes.find((ur) => ur.rewardId === r.id);
    let emCooldown = false;
    let proxDisponivel: Date | undefined;
    if (ultimoResgate && r.cooldownDays > 0) {
      proxDisponivel = new Date(ultimoResgate.createdAt);
      proxDisponivel.setDate(proxDisponivel.getDate() + r.cooldownDays);
      emCooldown = new Date() < proxDisponivel;
    }
    return { ...r, pode, emCooldown, proxDisponivel };
  });

  const digital = recompendasComStatus.filter((r) => r.tier === "digital");
  const physical = recompendasComStatus.filter((r) => r.tier !== "digital");

  const grupos2 = [
    { label: grupos.digital, items: digital },
    { label: grupos.physical, items: physical },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="max-w-lg space-y-8">
      {/* Header com saldo */}
      <div>
        <h1 className="text-2xl font-bold">Recompensas</h1>
        <p className="text-sm text-muted-foreground mt-1">Troque seus EcoCoins por recompensas exclusivas.</p>
      </div>

      <div className="rounded-xl border bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900 p-4 flex items-center gap-3">
        <Coins className="size-6 text-yellow-500 shrink-0" />
        <div>
          <p className="text-xs text-yellow-700 dark:text-yellow-400">Seu saldo</p>
          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{balance} Coins</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-yellow-700 dark:text-yellow-400">Nível</p>
          <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">{NIVEL_LABEL[nivel]}</p>
        </div>
      </div>

      {/* Catálogo vazio */}
      {catalog.length === 0 && (
        <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          <Coins className="size-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Catálogo em breve</p>
          <p className="text-xs mt-1">As primeiras recompensas estarão disponíveis em breve.</p>
        </div>
      )}

      {/* Grupos de recompensas */}
      {grupos2.map((grupo) => (
        <section key={grupo.label} className="space-y-3">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            {grupo.label}
          </h2>
          <ul className="space-y-3">
            {grupo.items.map((r) => {
              const bloqueadoPorNivel = !nivelAtingido(nivel, r.minLevel);
              const semSaldo = balance < r.cost;
              const esgotado = r.stock !== null && r.stock <= 0;

              return (
                <li
                  key={r.id}
                  className={cn(
                    "rounded-xl border p-4 flex items-start gap-4",
                    bloqueadoPorNivel && "opacity-60",
                  )}
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{r.name}</p>
                      {bloqueadoPorNivel && <Lock className="size-3 text-muted-foreground shrink-0" />}
                      {esgotado && (
                        <span className="text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                          Esgotado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{r.description}</p>
                    <div className="flex items-center gap-3 pt-1">
                      <span className="text-xs text-muted-foreground">
                        Nível mínimo: {NIVEL_LABEL[r.minLevel]}
                      </span>
                      {r.cooldownDays > 0 && (
                        <span className="text-xs text-muted-foreground">
                          · Cooldown: {r.cooldownDays} dias
                        </span>
                      )}
                    </div>
                    {r.emCooldown && r.proxDisponivel && (
                      <p className="text-xs text-amber-600">
                        Disponível após {r.proxDisponivel.toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 text-right space-y-2">
                    <p className={cn("font-bold text-sm", semSaldo ? "text-muted-foreground" : "text-yellow-600")}>
                      {r.cost} <span className="text-xs font-normal">Coins</span>
                    </p>
                    <RedeemButton
                      rewardId={r.id}
                      disabled={!r.pode || r.emCooldown || esgotado}
                      label={
                        bloqueadoPorNivel
                          ? "Nível insuficiente"
                          : esgotado
                          ? "Esgotado"
                          : r.emCooldown
                          ? "Em cooldown"
                          : semSaldo
                          ? "Saldo insuficiente"
                          : "Resgatar"
                      }
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {/* Histórico de resgates */}
      {resgatesRecentes.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Meus resgates
          </h2>
          <ul className="divide-y rounded-xl border overflow-hidden text-sm">
            {resgatesRecentes.slice(0, 5).map((r) => (
              <li key={r.id} className="flex items-center justify-between px-4 py-3 gap-2">
                <span className="text-muted-foreground truncate">{r.rewardId}</span>
                <span className={cn(
                  "shrink-0 text-xs font-medium rounded-full px-2 py-0.5",
                  r.status === "DELIVERED" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700",
                )}>
                  {r.status === "DELIVERED" ? "Entregue" : "Pendente"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <CoinDisclaimer />
    </div>
  );
}
