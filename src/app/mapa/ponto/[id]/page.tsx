import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Clock,
  Flag,
  Navigation,
} from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { buttonVariants } from "@/components/ui/button-variants";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const point = await prisma.point.findFirst({
    where: { id, status: "APPROVED" },
    select: { name: true, city: true, state: true },
  });

  if (!point) return { title: "Ponto não encontrado | EcoMed" };

  return {
    title: `${point.name} — ${point.city}/${point.state} | EcoMed`,
    description: `Ponto de coleta de medicamentos em ${point.city}/${point.state}. Descarte correto e gratuito.`,
  };
}

export default async function PontoDetalhe({ params }: Props) {
  const { id } = await params;

  const point = await prisma.point.findFirst({
    where: { id, status: "APPROVED" },
    include: { schedules: { orderBy: { dayOfWeek: "asc" } } },
  });

  if (!point) notFound();

  // Registrar visualização (fire-and-forget)
  prisma.pointView.create({ data: { pointId: id } }).catch(() => {});

  return (
    <main className="min-h-dvh bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link
            href="/mapa"
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "shrink-0")}
            aria-label="Voltar ao mapa"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="truncate text-base font-semibold">{point.name}</h1>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        {/* Endereço e ações de mapa */}
        <section className="space-y-3">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 size-4 shrink-0 text-green-700" />
            <span>
              {point.address}, {point.city} — {point.state}, {point.zipCode}
            </span>
          </div>

          <div className="flex gap-2">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${point.latitude},${point.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-1.5")}
            >
              <Navigation className="size-4" />
              Como chegar
            </a>
            {point.phone && (
              <a
                href={`tel:${point.phone}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
              >
                <Phone className="size-4" />
                Ligar
              </a>
            )}
          </div>
        </section>

        <Separator />

        {/* Contatos */}
        {(point.phone || point.email) && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold">Contato</h2>
            {point.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="size-4 text-muted-foreground" />
                <a href={`tel:${point.phone}`} className="hover:underline">
                  {point.phone}
                </a>
              </div>
            )}
            {point.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="size-4 text-muted-foreground" />
                <a href={`mailto:${point.email}`} className="hover:underline">
                  {point.email}
                </a>
              </div>
            )}
          </section>
        )}

        {/* Tipos de resíduo */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Resíduos aceitos</h2>
          <div className="flex flex-wrap gap-1.5">
            {point.residueTypes.map((type) => (
              <Badge key={type} variant="secondary">
                {type.replace(/_/g, " ")}
              </Badge>
            ))}
          </div>
        </section>

        <Separator />

        {/* Horários */}
        {point.schedules.length > 0 && (
          <section className="space-y-2">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold">
              <Clock className="size-4" /> Horários de funcionamento
            </h2>
            <ul className="space-y-1.5">
              {point.schedules.map((s) => (
                <li key={s.dayOfWeek} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{DIAS[s.dayOfWeek]}</span>
                  {s.closed ? (
                    <span className="text-red-500">Fechado</span>
                  ) : (
                    <span>
                      {s.opens} – {s.closes}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <Separator />

        {/* Reportar */}
        <Link
          href={`/mapa/ponto/${point.id}/reportar`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "w-full text-muted-foreground text-xs gap-1.5"
          )}
        >
          <Flag className="size-3.5" />
          Reportar um problema neste ponto
        </Link>
      </div>
    </main>
  );
}
