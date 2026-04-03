import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { MapPin, Heart, MessageCircle, Leaf } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Minha área | EcoMed" };

export default async function AppPage() {
  const session = await requireSession();

  const [favoritesCount, reportsCount] = await Promise.all([
    prisma.favorite.count({ where: { userId: session.user!.id! } }),
    prisma.report.count({ where: { userId: session.user!.id! } }),
  ]);

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
