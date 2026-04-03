import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { ReviewActions } from "./ReviewActions";
import { MapPin, Phone, Mail, Calendar } from "lucide-react";

export const metadata = { title: "Revisar Ponto | Admin EcoMed" };

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const STATUS_LABEL: Record<string, string> = { PENDING: "Pendente", APPROVED: "Aprovado", REJECTED: "Rejeitado" };
const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = { PENDING: "secondary", APPROVED: "default", REJECTED: "destructive" };

export default async function ReviewPointPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  const { id } = await params;
  const point = await prisma.point.findUnique({
    where: { id },
    include: {
      partner: { include: { user: { select: { name: true, email: true } } } },
      schedules: { orderBy: { dayOfWeek: "asc" } },
      _count: { select: { favorites: true, reports: true } },
    },
  });

  if (!point) notFound();

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/admin/pontos" className={buttonVariants({ variant: "ghost", size: "sm" }) + " mb-3 -ml-2"}>
            ← Voltar
          </Link>
          <h1 className="text-2xl font-bold">{point.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Enviado por {point.partner.user.name} ({point.partner.user.email}) em {new Date(point.createdAt).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <Badge variant={STATUS_VARIANT[point.status]}>{STATUS_LABEL[point.status]}</Badge>
      </div>

      {/* Informações do ponto */}
      <section className="rounded-xl border p-5 space-y-3">
        <h2 className="font-semibold">Informações</h2>
        <div className="grid gap-2 text-sm">
          <div className="flex items-start gap-2">
            <MapPin className="size-4 mt-0.5 text-muted-foreground shrink-0" />
            <span>{point.address}, {point.city}/{point.state} — CEP {point.zipCode}</span>
          </div>
          {point.phone && (
            <div className="flex items-center gap-2">
              <Phone className="size-4 text-muted-foreground" />
              <a href={`tel:${point.phone}`} className="hover:underline">{point.phone}</a>
            </div>
          )}
          {point.email && (
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" />
              <a href={`mailto:${point.email}`} className="hover:underline">{point.email}</a>
            </div>
          )}
          <div>
            <span className="text-muted-foreground">Coordenadas: </span>
            {point.latitude}, {point.longitude}
            <a
              href={`https://www.google.com/maps?q=${point.latitude},${point.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-green-600 hover:underline text-xs"
            >
              Ver no Maps ↗
            </a>
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-1">Tipos de resíduo aceitos:</p>
          <div className="flex flex-wrap gap-1">
            {point.residueTypes.map((t) => (
              <Badge key={t} variant="secondary">{t}</Badge>
            ))}
          </div>
        </div>

        <div className="flex gap-4 text-sm text-muted-foreground pt-1">
          <span>{point._count.favorites} favorito{point._count.favorites !== 1 ? "s" : ""}</span>
          <span>{point._count.reports} reporte{point._count.reports !== 1 ? "s" : ""}</span>
        </div>
      </section>

      {/* Parceiro */}
      <section className="rounded-xl border p-5 space-y-2">
        <h2 className="font-semibold">Parceiro</h2>
        <p className="text-sm">{point.partner.companyName}{point.partner.tradeName ? ` (${point.partner.tradeName})` : ""}</p>
        <p className="text-sm text-muted-foreground">CNPJ: {point.partner.cnpj}</p>
      </section>

      {/* Horários */}
      {point.schedules.length > 0 && (
        <section className="rounded-xl border p-5 space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Calendar className="size-4" /> Horários
          </h2>
          <ul className="text-sm space-y-1">
            {point.schedules.map((s) => (
              <li key={s.id} className="flex justify-between text-muted-foreground">
                <span className="font-medium text-foreground w-10">{DAYS[s.dayOfWeek]}</span>
                {s.closed ? <span className="text-destructive">Fechado</span> : <span>{s.opens} – {s.closes}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Motivo de rejeição */}
      {point.rejectedReason && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <strong>Motivo da rejeição:</strong> {point.rejectedReason}
        </div>
      )}

      {/* Ações */}
      <section className="rounded-xl border p-5 space-y-3">
        <h2 className="font-semibold">Ações</h2>
        <ReviewActions pointId={point.id} currentStatus={point.status} />
      </section>
    </div>
  );
}
