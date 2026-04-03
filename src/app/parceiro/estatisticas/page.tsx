import { requirePartner } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Star, Flag, MapPin, TrendingUp } from "lucide-react";
import { notFound } from "next/navigation";

export const metadata = { title: "Estatísticas | EcoMed Parceiro" };

export default async function ParceiroEstatisticasPage() {
  const session = await requirePartner();

  const partner = await prisma.partner.findUnique({
    where: { userId: session.user!.id! },
    include: {
      points: {
        include: {
          _count: { select: { views: true, favorites: true, reports: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!partner) notFound();

  const approvedPoints = partner.points.filter((p) => p.status === "APPROVED");
  const totalViews = partner.points.reduce((s, p) => s + p._count.views, 0);
  const totalFavorites = partner.points.reduce((s, p) => s + p._count.favorites, 0);
  const totalReports = partner.points.reduce((s, p) => s + p._count.reports, 0);

  const STATUS_LABEL: Record<string, string> = {
    PENDING: "Aguardando",
    APPROVED: "Aprovado",
    REJECTED: "Rejeitado",
  };
  const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
    PENDING: "secondary",
    APPROVED: "default",
    REJECTED: "destructive",
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Estatísticas</h1>

      {/* Resumo geral */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <MapPin className="size-4" /> Pontos ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{approvedPoints.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              de {partner.points.length} cadastrado{partner.points.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Eye className="size-4" /> Visualizações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalViews.toLocaleString("pt-BR")}</p>
            <p className="text-xs text-muted-foreground mt-1">total acumulado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Star className="size-4" /> Favoritos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalFavorites.toLocaleString("pt-BR")}</p>
            <p className="text-xs text-muted-foreground mt-1">cidadãos salvaram</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Flag className="size-4" /> Reportes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalReports.toLocaleString("pt-BR")}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {totalReports === 0 ? "nenhum problema" : "verificar pontos"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detalhamento por ponto */}
      {partner.points.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
          <TrendingUp className="size-10 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">
            Cadastre um ponto para ver as estatísticas aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Desempenho por ponto</h2>

          <div className="divide-y rounded-xl border overflow-hidden">
            {partner.points.map((p) => {
              const maxViews = Math.max(...partner.points.map((x) => x._count.views), 1);
              const pct = Math.round((p._count.views / maxViews) * 100);

              return (
                <div key={p.id} className="px-4 py-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="font-medium truncate">{p.name}</p>
                      <Badge variant={STATUS_VARIANT[p.status]} className="text-xs shrink-0">
                        {STATUS_LABEL[p.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground shrink-0">
                      <span className="flex items-center gap-1" title="Visualizações">
                        <Eye className="size-3.5" /> {p._count.views.toLocaleString("pt-BR")}
                      </span>
                      <span className="flex items-center gap-1" title="Favoritos">
                        <Star className="size-3.5" /> {p._count.favorites.toLocaleString("pt-BR")}
                      </span>
                      <span className="flex items-center gap-1" title="Reportes">
                        <Flag className="size-3.5" /> {p._count.reports}
                      </span>
                    </div>
                  </div>

                  {/* Barra de progresso relativa de visualizações */}
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
