import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Flag, Calendar, ShieldCheck, Building2 } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Meu Perfil | EcoMed" };

const ROLE_LABEL: Record<string, string> = { CITIZEN: "Cidadão", PARTNER: "Parceiro", ADMIN: "Administrador" };

export default async function PerfilPage() {
  const session = await requireSession();
  const userId = session.user!.id!;

  const [user, favoritesCount, reportsCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, image: true, role: true, createdAt: true, partner: { select: { id: true } } },
    }),
    prisma.favorite.count({ where: { userId } }),
    prisma.report.count({ where: { userId } }),
  ]);

  if (!user) return null;

  const initials = user.name
    ?.split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase() ?? "?";

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
          <Button asChild size="sm" className="bg-green-700 hover:bg-green-800">
            <Link href="/app/seja-parceiro">Quero ser parceiro</Link>
          </Button>
        </section>
      )}

      {/* Status solicitação parceiro pendente */}
      {user.role === "CITIZEN" && user.partner && (
        <section className="rounded-xl border border-yellow-200 bg-yellow-50 p-5 space-y-1">
          <p className="text-sm font-medium text-yellow-800">Solicitação de parceiro em análise</p>
          <p className="text-xs text-yellow-700">Você receberá um e-mail em até 48 horas úteis.</p>
        </section>
      )}
    </div>
  );
}
