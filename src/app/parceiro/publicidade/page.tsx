import type { Metadata } from "next";
import { requirePartner } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, MousePointerClick, Percent, Megaphone } from "lucide-react";

export const metadata: Metadata = { title: "Publicidade | EcoMed Parceiro" };
export const revalidate = 300; // 5 min

const PLACEMENT_LABEL: Record<string, string> = {
  MAP_LIST: "Lista do mapa",
  CITY_DISCARD: "Página da cidade",
  IMPACT: "Página de impacto",
  BLOG_ARTICLE: "Blog",
};

export default async function ParceiroPublicidadePage() {
  const session = await requirePartner();

  const partner = await prisma.partner.findUnique({
    where: { userId: session.user!.id! },
    select: { id: true },
  });

  if (!partner) {
    return <div className="py-20 text-center text-muted-foreground">Parceiro não encontrado.</div>;
  }

  const campanhas = await prisma.adCampaign.findMany({
    where: { partnerId: partner.id },
    orderBy: { createdAt: "desc" },
    include: { events: { select: { impressions: true, clicks: true } } },
  });

  // Estado vazio — convida a anunciar
  if (campanhas.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Publicidade</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhe o desempenho dos seus banners no EcoMed.
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Megaphone className="size-10 text-muted-foreground" />
            <div>
              <p className="font-medium">Você ainda não tem campanhas ativas</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Anuncie sua loja para quem já procura onde descartar medicamentos na sua cidade.
                Fale com a gente em{" "}
                <a href="mailto:parcerias@ecomed.eco.br" className="font-medium text-eco-teal hover:underline">
                  parcerias@ecomed.eco.br
                </a>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalImpr = campanhas.reduce((s, c) => s + c.events.reduce((a, e) => a + e.impressions, 0), 0);
  const totalClicks = campanhas.reduce((s, c) => s + c.events.reduce((a, e) => a + e.clicks, 0), 0);
  const ctrGeral = totalImpr > 0 ? ((totalClicks / totalImpr) * 100).toFixed(1) : "0.0";

  const stats = [
    { label: "Impressões", value: totalImpr.toLocaleString("pt-BR"), icon: Eye },
    { label: "Cliques", value: totalClicks.toLocaleString("pt-BR"), icon: MousePointerClick },
    { label: "CTR médio", value: `${ctrGeral}%`, icon: Percent },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Publicidade</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Desempenho dos seus banners no EcoMed atualizado diariamente.
        </p>
      </div>

      {/* Totais */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Por campanha */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Suas campanhas</h2>
        <div className="space-y-3">
          {campanhas.map((c) => {
            const impr = c.events.reduce((a, e) => a + e.impressions, 0);
            const clk = c.events.reduce((a, e) => a + e.clicks, 0);
            const ctr = impr > 0 ? ((clk / impr) * 100).toFixed(1) : "0.0";
            return (
              <Card key={c.id}>
                <CardContent className="flex flex-wrap items-center gap-4 py-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.imageUrl} alt={c.advertiser} className="h-12 w-24 shrink-0 rounded border object-contain bg-muted/30" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{c.title}</p>
                      <Badge variant={c.active ? "default" : "secondary"}>
                        {c.active ? "Ativa" : "Pausada"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {PLACEMENT_LABEL[c.placement] ?? c.placement}
                      {c.radiusKm && c.centerLat != null
                        ? ` · raio ${c.radiusKm} km`
                        : c.targetCity
                          ? ` · ${c.targetCity}`
                          : c.targetState
                            ? ` · ${c.targetState}`
                            : " · nacional"}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="font-semibold tabular-nums">{impr.toLocaleString("pt-BR")}</p>
                      <p className="text-xs text-muted-foreground">impressões</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold tabular-nums">{clk.toLocaleString("pt-BR")}</p>
                      <p className="text-xs text-muted-foreground">cliques</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold tabular-nums">{ctr}%</p>
                      <p className="text-xs text-muted-foreground">CTR</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Quer ajustar ou criar uma campanha? Fale com{" "}
        <a href="mailto:parcerias@ecomed.eco.br" className="underline">parcerias@ecomed.eco.br</a>.
      </p>
    </div>
  );
}
