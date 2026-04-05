import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Heart, Flag, Calendar, ShieldCheck, Building2, Coins, Flame, Trophy, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { QRCodeDisplay } from "@/components/coins/QRCodeDisplay";
import { CoinDisclaimer } from "@/components/coins/CoinDisclaimer";

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
  if (!note) return EVENT_LABEL[event] ?? event;
  // Transações antigas: "QUIZ · cuid" ou "QUIZ_PERFECT · cuid" — mostrar label limpo
  const eventLabel = EVENT_LABEL[event];
  if (eventLabel && /^[A-Z_]+ · c[a-z0-9]+$/.test(note)) return eventLabel;
  // Nota legível gravada após o fix
  return note;
}

export default async function PerfilPage() {
  const session = await requireSession();
  const userId = session.user!.id!;

  const [user, favoritesCount, reportsCount, wallet] = await Promise.all([
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
          <AvatarFallback className="bg-green-100 text-green-800 text-xl">{initials}</AvatarFallback>
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
                  <span className={cn("font-semibold shrink-0", t.amount > 0 ? "text-green-600" : "text-red-500")}>
                    {t.amount > 0 ? "+" : ""}{t.amount}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Links rápidos */}
        <div className="flex gap-2 pt-1">
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
        <section className="rounded-xl border border-green-200 bg-green-50 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-green-700" />
            <h2 className="font-semibold text-green-800">Você tem uma farmácia ou UBS?</h2>
          </div>
          <p className="text-sm text-green-700">
            Cadastre seu ponto de coleta de medicamentos gratuitamente e apareça no mapa do EcoMed.
          </p>
          <Link
            href="/app/seja-parceiro"
            className={cn(buttonVariants({ size: "sm" }), "bg-green-700 hover:bg-green-800 text-white")}
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
    </div>
  );
}
