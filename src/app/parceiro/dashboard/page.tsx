import type { Metadata } from "next";
import { requirePartner } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { MapPin, Eye, Flag, Plus } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Dashboard Parceiro | EcoMed" };

export default async function ParceiroDashboardPage() {
  const session = await requirePartner();

  const partner = await prisma.partner.findUnique({
    where: { userId: session.user!.id! },
    include: {
      points: {
        include: { _count: { select: { views: true, reports: true, favorites: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!partner) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <MapPin className="size-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Cadastro pendente</h2>
        <p className="text-muted-foreground">Seu perfil de parceiro está sendo aprovado.</p>
      </div>
    );
  }

  const totalViews = partner.points.reduce((s, p) => s + p._count.views, 0);
  const totalFavs = partner.points.reduce((s, p) => s + p._count.favorites, 0);
  const totalReports = partner.points.reduce((s, p) => s + p._count.reports, 0);

  const statusLabel: Record<string, string> = {
    PENDING: "Aguardando",
    APPROVED: "Aprovado",
    REJECTED: "Rejeitado",
  };
  const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
    PENDING: "secondary",
    APPROVED: "default",
    REJECTED: "destructive",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{partner.tradeName ?? partner.companyName}</h1>
        <Link href="/parceiro/pontos/novo" className={buttonVariants({ size: "sm" })}>
          <Plus className="mr-1.5 size-4" />
          Novo ponto
        </Link>
      </div>

      {/* Métricas */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Visualizações", value: totalViews, icon: Eye },
          { label: "Favoritos", value: totalFavs, icon: MapPin },
          { label: "Reportes", value: totalReports, icon: Flag },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 pt-4">
              <Icon className="size-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pontos */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Meus pontos</h2>
        {partner.points.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum ponto cadastrado ainda.</p>
        ) : (
          <div className="space-y-3">
            {partner.points.map((point) => (
              <Card key={point.id}>
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{point.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {point.address} — {point.city}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={statusVariant[point.status]}>
                      {statusLabel[point.status]}
                    </Badge>
                    <Link href={`/parceiro/pontos/${point.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>Editar</Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

