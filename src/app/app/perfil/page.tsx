import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Heart, Flag, Calendar, ShieldCheck, Building2, Coins, Flame, Trophy, ChevronRight, Medal } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { QRCodeDisplay } from "@/components/coins/QRCodeDisplay";
import { CoinDisclaimer } from "@/components/coins/CoinDisclaimer";
import { ShareBadgeButton } from "@/components/coins/ShareBadgeButton";

export const metadata = { title: "Meu Perfil | EcoMed" };

const ROLE_LABEL: Record<string, string> = { CITIZEN: "Cidadão", PARTNER: "Parceiro", ADMIN: "Administrador" };

const NIVEL_INFO: Record<string, { label: string; icon: string; cor: string; max: number }> = {
  SEMENTE:   { label: "Semente",    icon: "🌱", cor: "bg-[#C7D93D]", max: 100 },
  BROTO:     { label: "Broto",      icon: "🌿", cor: "bg-[#24A645]", max: 500 },
  ARVORE:    { label: "Árvore",     icon: "🌳", cor: "bg-[#3E8C8C]", max: 2000 },
  GUARDIAO:  { label: "Guardião",   icon: "🌍", cor: "bg-[#1A736A]", max: 5000 },
  LENDA_ECO: { label: "Lenda Eco",  icon: "⭐", cor: "bg-[#D4A017]", max: Infinity },
};

const NIVEL_MIN_ANTERIOR: Record<string, number> = {
  SEMENTE: 0, BROTO: 101, ARVORE: 501, GUARDIAO: 2001, LENDA_ECO: 5001,
};

const EVENT_LABEL: Record<string, string> = {
  SIGNUP: "Cadastro realizado",
  ONBOARDING_PROFILE: "Perfil completado",
  ONBOARDING_SCREENS: "Tutorial concluído",
  ONBOARDING_GEO: "Localização ativada",
  ONBOARDING_PUSH: "Notificações ativadas",
  CHECKIN: "Check-in em ponto de coleta",
  CHECKIN_FIRST_MONTH: "Primeiro check-in do mês",
  CHECKIN_NEW_POINT: "Check-in em novo ponto",
  ARTICLE_READ: "Artigo lido",
  QUIZ: "Quiz respondido",
  QUIZ_PERFECT: "Quiz com nota perfeita",
  ECOBOT_QUESTION: "Pergunta ao EcoBot",
  ECOBOT_RATING: "Avaliação do EcoBot",
  REFERRAL: "Indicação de amigo",
  SHARE_ARTICLE: "Artigo compartilhado",
  SHARE_BADGE: "Badge compartilhado",
  STREAK_3_DAYS: "Streak de 3 dias",
  STREAK_7_DAYS: "Streak de 7 dias",
  STREAK_30_DAYS: "Streak de 30 dias",
  REDEMPTION: "Resgate de recompensa",
};

function labelTransacao(note: string | null, event: string): string {
  // Sem nota: usa label do evento
  if (!note) return EVENT_LABEL[event] ?? event;

  const eventLabel = EVENT_LABEL[event];

  // Nota no formato legado "EVENT · <id>" (cuid ou UUID) — descarta o ID e exibe só o label
  // Exemplos: "ECOBOT_RATING · bd4a69ef-…", "QUIZ · cma1b2c3d4…"
  if (eventLabel && /^[A-Z_]+ · [a-z0-9-]+$/i.test(note)) return eventLabel;

  // Nota é só um ID solto (sem prefixo de evento) — usa label do evento
  if (eventLabel && /^[a-z0-9-]{8,}$/i.test(note)) return eventLabel;

  // Nota já é texto legível gravado após os fixes
  return note;
}

export default async function PerfilPage() {
  const session = await requireSession();
  const userId = session.user!.id!;

  const [user, favoritesCount, reportsCount, wallet, top10] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, image: true, role: true, createdAt: true, partner: { select: { id: true } } },
    }),
    prisma.favorite.count({ where: { userId } }),
    prisma.report.count({ where: { userId } }),
    prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    }),
    // Top 10 por totalEarned (lifetime)
    prisma.wallet.findMany({
      orderBy: { totalEarned: "desc" },
      take: 10,
      select: {
        totalEarned: true,
        level: true,
        user: { select: { id: true, name: true, image: true } },
      },
    }),
  ]);

  if (!user) return null;

  const initials = user.name
    ?.split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase() ?? "?";

  const nivel = wallet?.level ?? "SEMENTE";
  const nivelInfo = NIVEL_INFO[nivel];
  const totalEarned = wallet?.totalEarned ?? 0;
  const balance = wallet?.balance ?? 0;
  const minAnterior = NIVEL_MIN_ANTERIOR[nivel];
  const progressoPct =
    nivelInfo.max === Infinity
      ? 100
      : Math.min(100, Math.round(((totalEarned - minAnterior) / (nivelInfo.max - minAnterior)) * 100));

  return (
    <div className="max-w-lg space-y-8">
      <h1 className="text-2xl font-bold">Meu perfil</h1>

      {/* Avatar e dados */}
      <section className="rounded-xl border p-6 flex items-center gap-5">
        <Avatar className="size-16">
          <AvatarImage src={user.image ?? undefined} />
          <AvatarFallback className="bg-eco-teal/10 text-eco-teal-dark text-xl">{initials}</AvatarFallback>
        </Avatar>
        <div className="space-y-1 min-w-0">
          <p className="font-semibold text-lg truncate">{user.name ?? "Sem nome"}</p>
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
            <ShieldCheck className="size-3" />
            {ROLE_LABEL[user.role]}
          </Badge>
        </div>
      </section>

      {/* ---- EcoMed Coins ---- */}
      <section className="rounded-xl border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Coins className="size-5 text-yellow-500" />
            EcoMed Coins
          </h2>
          <span className="text-2xl font-bold text-yellow-600">{balance}</span>
        </div>

        {/* Nível e barra de progresso */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{nivelInfo.icon} {nivelInfo.label}</span>
            {nivelInfo.max !== Infinity && (
              <span className="text-muted-foreground">{totalEarned} / {nivelInfo.max} Coins</span>
            )}
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", nivelInfo.cor)}
              style={{ width: `${progressoPct}%` }}
            />
          </div>
          {nivelInfo.max !== Infinity && (
            <p className="text-xs text-muted-foreground">
              Faltam {nivelInfo.max - totalEarned} Coins para o próximo nível
            </p>
          )}
        </div>

        {/* Streak */}
        {(wallet?.streakCurrent ?? 0) > 0 && (
          <div className="flex items-center gap-2 text-sm rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 px-3 py-2">
            <Flame className="size-4 text-orange-500" />
            <span className="font-medium text-orange-800 dark:text-orange-300">
              Streak de {wallet!.streakCurrent} dia{wallet!.streakCurrent !== 1 ? "s" : ""}
            </span>
            {wallet!.streakBest > 1 && (
              <span className="text-orange-600 dark:text-orange-400 ml-auto text-xs">
                Recorde: {wallet!.streakBest} dias
              </span>
            )}
          </div>
        )}

        {/* Últimas transações */}
        {wallet?.transactions && wallet.transactions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Últimas movimentações</p>
            <ul className="divide-y text-sm">
              {wallet.transactions.map((t) => (
                <li key={t.id} className="py-2 flex items-center justify-between gap-2">
                  <span className="text-muted-foreground truncate">{labelTransacao(t.note, t.event)}</span>
                  <span className={cn("font-semibold shrink-0", t.amount > 0 ? "text-eco-green" : "text-red-500")}>
                    {t.amount > 0 ? "+" : ""}{t.amount}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Links rápidos */}
        {/* Compartilhar conquista */}
        <ShareBadgeButton
          nome={user.name ?? "Eco-Cidadão"}
          nivel={nivel}
          nivelLabel={nivelInfo.label}
        />

        <div className="flex gap-2 pt-1">
          <Link
            href="/app/conquistas"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "flex-1 justify-between")}
          >
            <Medal className="size-4" /> Conquistas <ChevronRight className="size-4" />
          </Link>
          <Link
            href="/app/missoes"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "flex-1 justify-between")}
          >
            <Trophy className="size-4" /> Missões <ChevronRight className="size-4" />
          </Link>
          <Link
            href="/app/recompensas"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "flex-1 justify-between")}
          >
            <Coins className="size-4" /> Recompensas <ChevronRight className="size-4" />
          </Link>
        </div>

        <CoinDisclaimer />
      </section>

      {/* Estatísticas */}
      <section className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border p-5 flex gap-3 items-center">
          <Heart className="size-7 text-red-500 fill-red-100 shrink-0" />
          <div>
            <p className="text-2xl font-bold">{favoritesCount}</p>
            <p className="text-xs text-muted-foreground">Favorito{favoritesCount !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="rounded-xl border p-5 flex gap-3 items-center">
          <Flag className="size-7 text-orange-500 shrink-0" />
          <div>
            <p className="text-2xl font-bold">{reportsCount}</p>
            <p className="text-xs text-muted-foreground">Reporte{reportsCount !== 1 ? "s" : ""} enviado{reportsCount !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </section>

      {/* Info da conta */}
      <section className="rounded-xl border p-5 space-y-3">
        <h2 className="font-semibold">Conta</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="size-4" />
          Membro desde {new Date(user.createdAt).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
        </div>
      </section>

      {/* CTA Seja Parceiro — apenas para cidadãos sem registro de parceiro */}
      {user.role === "CITIZEN" && !user.partner && (
        <section className="rounded-xl border border-eco-teal/20 bg-eco-teal/10 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-eco-teal-dark" />
            <h2 className="font-semibold text-eco-teal-dark">Você tem uma farmácia ou UBS?</h2>
          </div>
          <p className="text-sm text-eco-teal-dark">
            Cadastre seu ponto de coleta de medicamentos gratuitamente e apareça no mapa do EcoMed.
          </p>
          <Link
            href="/app/seja-parceiro"
            className={cn(buttonVariants({ size: "sm" }), "bg-eco-green hover:bg-eco-green/90 text-white")}
          >
            Quero ser parceiro
          </Link>
        </section>
      )}

      {/* Status solicitação parceiro pendente */}
      {user.role === "CITIZEN" && user.partner && (
        <section className="rounded-xl border border-yellow-200 bg-yellow-50 p-5 space-y-1">
          <p className="text-sm font-medium text-yellow-800">Solicitação de parceiro em análise</p>
          <p className="text-xs text-yellow-700">Você receberá um e-mail em até 48 horas úteis.</p>
        </section>
      )}

      {/* QR Code de descarte — apenas para cidadãos */}
      {user.role === "CITIZEN" && (
        <section className="rounded-xl border p-5 space-y-2">
          <h2 className="font-semibold">Meu QR Code de descarte</h2>
          <p className="text-sm text-muted-foreground">
            Apresente ao parceiro no momento do descarte para ganhar EcoCoins.
          </p>
          <QRCodeDisplay />
        </section>
      )}

      {/* ---- Top 10 EcoCoins ---- */}
      <section className="rounded-xl border p-5 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Medal className="size-5 text-yellow-500" />
          Top 10 EcoWarriors
        </h2>
        <ol className="space-y-2">
          {top10.map((entry, i) => {
            const isMe = entry.user.id === userId;
            const initials = entry.user.name
              ?.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase() ?? "?";
            const medalColor =
              i === 0 ? "text-yellow-500" :
              i === 1 ? "text-slate-400" :
              i === 2 ? "text-amber-600" : "text-muted-foreground";
            const nivelEmoji = NIVEL_INFO[entry.level]?.icon ?? "🌱";

            return (
              <li
                key={entry.user.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                  isMe
                    ? "bg-eco-teal/10 border border-eco-teal/30 font-semibold"
                    : "border border-transparent",
                )}
              >
                <span className={cn("w-5 text-center font-bold shrink-0", medalColor)}>
                  {i < 3 ? ["🥇", "🥈", "🥉"][i] : `${i + 1}º`}
                </span>
                <Avatar className="size-7 shrink-0">
                  <AvatarImage src={entry.user.image ?? undefined} />
                  <AvatarFallback className="text-[10px] bg-eco-teal/10">{initials}</AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate">
                  {isMe ? "Você" : (entry.user.name ?? "Eco-Cidadão")}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{nivelEmoji}</span>
                <span className="shrink-0 font-semibold text-yellow-600">{entry.totalEarned}</span>
              </li>
            );
          })}
        </ol>
        <p className="text-xs text-muted-foreground text-center">
          Ranking por total de EcoCoins ganhos ao longo do tempo
        </p>
      </section>
    </div>
  );
}
