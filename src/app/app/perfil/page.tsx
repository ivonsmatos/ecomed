import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, Flag, Calendar, ShieldCheck } from "lucide-react";

export const metadata = { title: "Meu Perfil | EcoMed" };

const ROLE_LABEL: Record<string, string> = { CITIZEN: "Cidadão", PARTNER: "Parceiro", ADMIN: "Administrador" };

export default async function PerfilPage() {
  const session = await requireSession();
  const userId = session.user!.id!;

  const [user, favoritesCount, reportsCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, image: true, role: true, createdAt: true },
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
    </div>
  );
}
