import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { MapPin, Heart, MessageCircle, Leaf, Coins, Trophy, Gift, ChevronRight, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Minha área | EcoMed" };

const NIVEL_INFO: Record<string, { label: string; icon: string }> = {
  SEMENTE:   { label: "Semente",  icon: "🌱" },
  BROTO:     { label: "Broto",    icon: "🌿" },
  ARVORE:    { label: "Árvore",   icon: "🌳" },
  GUARDIAO:  { label: "Guardião", icon: "🌍" },
  LENDA_ECO: { label: "Lenda Eco",icon: "⭐" },
};

export default async function AppPage() {
  const session = await requireSession();
  const userId = session.user!.id!;

  const [favoritesCount, reportsCount, wallet, missoesHoje] = await Promise.all([
    prisma.favorite.count({ where: { userId } }),
    prisma.report.count({ where: { userId } }),
    prisma.wallet.findUnique({ where: { userId } }),
    prisma.userMission.findMany({
      where: { userId, expiresAt: { gte: new Date(new Date().setUTCHours(0,0,0,0)) } },
      include: { mission: true },
    }),
  ]);

  const balance = wallet?.balance ?? 0;
  const nivel = wallet?.level ?? "SEMENTE";
  const nivelInfo = NIVEL_INFO[nivel];
  const missoesCompletas = missoesHoje.filter((m) => m.completed).length;
  const missoesTotal = missoesHoje.length;

  const cards = [
    {
      title: "Encontrar ponto",
      description: "Veja o mapa com os pontos de coleta próximos a você.",
      icon: MapPin,
      href: "/mapa",
      cta: "Abrir mapa",
      color: "text-green-700",
    },
    {
      title: "Favoritos",
      description: `${favoritesCount} ponto${favoritesCount !== 1 ? "s" : ""} salvos.`,
      icon: Heart,
      href: "/app/favoritos",
      cta: "Ver favoritos",
      color: "text-red-500",
    },
    {
      title: "Assistente IA",
      description: "Tire dúvidas sobre descarte correto de medicamentos.",
      icon: MessageCircle,
      href: "/app/chat",
      cta: "Conversar",
      color: "text-blue-600",
    },
    {
      title: "Quiz Ambiental",
      description: "Responda quizzes e ganhe EcoCoins. Até 10 Coins por quiz!",
      icon: BookOpen,
      href: "/app/quiz",
      cta: "Jogar",
      color: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Olá, {session.user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Você ajudou a reportar {reportsCount} problema{reportsCount !== 1 ? "s" : ""}. Obrigado!
        </p>
      </div>

      {/* Banner EcoMed Coins */}
      <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/40 dark:to-amber-950/40">
        <CardContent className="flex items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3">
            <Coins className="size-8 text-yellow-500 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Seu saldo</p>
              <p className="text-2xl font-bold text-yellow-700">{balance} <span className="text-sm font-normal">EcoCoins</span></p>
              <p className="text-xs text-muted-foreground mt-0.5">{nivelInfo.icon} Nível {nivelInfo.label}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <Link href="/app/missoes" className={cn(buttonVariants({ size: "sm", variant: "outline" }), "gap-1.5 border-yellow-300 hover:bg-yellow-100")}>
              <Trophy className="size-3.5" />
              Missões {missoesTotal > 0 && <span className="text-xs text-muted-foreground">({missoesCompletas}/{missoesTotal})</span>}
            </Link>
            <Link href="/app/recompensas" className={cn(buttonVariants({ size: "sm", variant: "outline" }), "gap-1.5 border-yellow-300 hover:bg-yellow-100")}>
              <Gift className="size-3.5" />
              Recompensas
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <card.icon className={`size-5 ${card.color}`} />
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{card.description}</p>
              <Link href={card.href} className={cn(buttonVariants({ size: "sm", variant: "outline" }), "w-full")}>
                {card.cta}
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Links rápidos (desktop) */}
      <div className="hidden md:flex gap-3">
        <Link href="/app/perfil" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2 text-muted-foreground")}>
          <ChevronRight className="size-3.5" />Ver meu perfil completo
        </Link>
        <Link href="/ranking" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2 text-muted-foreground")}>
          <Trophy className="size-3.5" />Ranking semanal
        </Link>
      </div>

      {/* Educação */}
      <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
        <CardContent className="flex items-center gap-4 pt-4">
          <Leaf className="size-8 text-green-700 shrink-0" />
          <div>
            <p className="font-medium text-green-900 dark:text-green-100">Sabia que...?</p>
            <p className="text-sm text-green-800 dark:text-green-200">
              Medicamentos descartados no lixo comum ou vaso sanitário contaminam o solo e a água.
              Sempre leve ao ponto de coleta mais próximo.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

