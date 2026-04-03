import { requirePartner } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { MapPin, Plus, Pencil, Eye, Star, Flag } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Meus Pontos | EcoMed Parceiro" };

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Aguardando revisão",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
};
const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
};

export default async function ParceiroPontosPage() {
  const session = await requirePartner();

  const partner = await prisma.partner.findUnique({
    where: { userId: session.user!.id! },
    select: { id: true },
  });

  if (!partner) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <MapPin className="size-12 text-muted-foreground" />
        <p className="text-muted-foreground">Cadastro de parceiro não encontrado.</p>
      </div>
    );
  }

  const points = await prisma.point.findMany({
    where: { partnerId: partner.id },
    include: {
      _count: { select: { views: true, favorites: true, reports: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Meus pontos{" "}
          <span className="text-muted-foreground text-lg font-normal">({points.length})</span>
        </h1>
        <Link href="/parceiro/pontos/novo" className={buttonVariants({ size: "sm" })}>
          <Plus className="mr-1.5 size-4" />
          Novo ponto
        </Link>
      </div>

      {points.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-20 text-center">
          <MapPin className="size-12 text-muted-foreground" />
          <div>
            <p className="font-medium">Nenhum ponto cadastrado</p>
            <p className="text-muted-foreground text-sm mt-1">
              Cadastre um ponto de coleta para aparecer no mapa.
            </p>
          </div>
          <Link href="/parceiro/pontos/novo" className={buttonVariants()}>
            <Plus className="mr-1.5 size-4" />
            Cadastrar primeiro ponto
          </Link>
        </div>
      ) : (
        <div className="divide-y rounded-xl border overflow-hidden">
          {points.map((p) => (
            <div
              key={p.id}
              className="flex items-start justify-between gap-4 px-4 py-4 hover:bg-muted/40 transition-colors"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium">{p.name}</p>
                  <Badge variant={STATUS_VARIANT[p.status]} className="text-xs">
                    {STATUS_LABEL[p.status]}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground truncate">
                  {p.address}, {p.city} — {p.state}
                </p>

                {p.status === "REJECTED" && p.rejectedReason && (
                  <p className="text-xs text-destructive mt-1">
                    Motivo: {p.rejectedReason}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1">
                    <Eye className="size-3" /> {p._count.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="size-3" /> {p._count.favorites}
                  </span>
                  <span className="flex items-center gap-1">
                    <Flag className="size-3" /> {p._count.reports}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {p.status === "APPROVED" && (
                  <Link
                    href={`/mapa/ponto/${p.id}`}
                    target="_blank"
                    className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                  >
                    Ver no mapa
                  </Link>
                )}
                <Link
                  href={`/parceiro/pontos/${p.id}`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  <Pencil className="size-3.5 mr-1" />
                  Editar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
