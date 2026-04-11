import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { buscarProgressoMilestones, GRUPOS_METAS } from "@/lib/goals/milestones";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import ConquistasGrid from "./ConquistasGrid";

export const metadata = { title: "Conquistas | EcoMed" };

export default async function ConquistasPage() {
  const session = await requireSession();
  const userId = session.user!.id!;

  // Buscar badges ganhos pelo usuário
  const [userBadges, progresso, allBadges] = await Promise.all([
    prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: "desc" },
    }),
    buscarProgressoMilestones(userId),
    prisma.badge.findMany({ where: { active: true } }),
  ]);

  const badgesGanhos = new Map(userBadges.map((ub) => [ub.badge.slug, ub.earnedAt]));
  const badgesPorSlug = new Map(allBadges.map((b) => [b.slug, b]));

  // Serializar para o Client Component (sem Date direto)
  const gruposSerializados = GRUPOS_METAS.map((grupo) => ({
    id: grupo.id,
    titulo: grupo.titulo,
    emoji: grupo.emoji,
    descricao: grupo.descricao,
    progressoAtual: progresso[grupo.progressoKey],
    marcos: grupo.marcos.map((m) => {
      const badge = badgesPorSlug.get(m.slug);
      const ganho = badgesGanhos.get(m.slug);
      return {
        n: m.n,
        slug: m.slug,
        label: m.label,
        name: badge?.name ?? m.label,
        description: badge?.description ?? "",
        coinReward: badge?.coinReward ?? 0,
        earned: !!ganho,
        earnedAt: ganho ? ganho.toISOString() : null,
      };
    }),
  }));

  // Outros badges (nível de quiz, conquistas gerais)
  const SLUGS_MILESTONES = new Set(
    GRUPOS_METAS.flatMap((g) => g.marcos.map((m) => m.slug)),
  );

  const outrosBadgesGanhos = userBadges
    .filter((ub) => !SLUGS_MILESTONES.has(ub.badge.slug))
    .map((ub) => ({
      slug: ub.badge.slug,
      name: ub.badge.name,
      description: ub.badge.description,
      coinReward: ub.badge.coinReward,
      earnedAt: ub.earnedAt.toISOString(),
    }));

  const totalBadges = userBadges.length;
  const totalMilestones = GRUPOS_METAS.flatMap((g) => g.marcos).length;
  const milestonesGanhos = GRUPOS_METAS.flatMap((g) =>
    g.marcos.filter((m) => badgesGanhos.has(m.slug)),
  ).length;

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Link
            href="/app/perfil"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="size-4" />
            Perfil
          </Link>
        </div>
        <h1 className="text-2xl font-bold">Conquistas</h1>
        <p className="text-sm text-muted-foreground">
          Seus selos e metas do EcoMed
        </p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-2xl font-bold">{totalBadges}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Selos ganhos</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-2xl font-bold">{milestonesGanhos}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Metas atingidas</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-2xl font-bold">{totalMilestones - milestonesGanhos}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Metas restantes</p>
        </div>
      </div>

      {/* Grupos de metas */}
      <ConquistasGrid grupos={gruposSerializados} />

      {/* Outros selos ganhos */}
      {outrosBadgesGanhos.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            🎖️ Outros Selos
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {outrosBadgesGanhos.map((b) => (
              <div
                key={b.slug}
                className="rounded-xl border bg-card p-4 space-y-2 text-center"
              >
                <div className="mx-auto size-12 rounded-full bg-eco-teal/10 flex items-center justify-center text-2xl">
                  🏅
                </div>
                <p className="text-sm font-semibold leading-tight">{b.name}</p>
                <p className="text-xs text-muted-foreground leading-snug">{b.description}</p>
                {b.coinReward > 0 && (
                  <p className="text-xs font-medium text-yellow-600">+{b.coinReward} EcoCoins</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
