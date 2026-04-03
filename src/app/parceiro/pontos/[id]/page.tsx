import { requirePartner } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { PointForm } from "@/components/parceiro/PointForm";
import type { CreatePointInput } from "@/lib/schemas/point";

export const metadata = { title: "Editar Ponto | EcoMed Parceiro" };

export default async function EditarPontoPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePartner();
  const { id } = await params;

  const partner = await prisma.partner.findUnique({
    where: { userId: session.user!.id! },
    select: { id: true },
  });

  if (!partner) notFound();

  const point = await prisma.point.findFirst({
    where: { id, partnerId: partner.id },
    include: { schedules: true },
  });

  if (!point) notFound();

  const defaultValues: Partial<CreatePointInput> = {
    name: point.name,
    address: point.address,
    city: point.city,
    state: point.state,
    zipCode: point.zipCode,
    latitude: point.latitude,
    longitude: point.longitude,
    phone: point.phone ?? "",
    email: point.email ?? "",
    residueTypes: point.residueTypes,
    schedules: point.schedules.map((s) => ({
      dayOfWeek: s.dayOfWeek,
      opens: s.opens,
      closes: s.closes,
      closed: s.closed,
    })),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Editar ponto: {point.name}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Alterações voltam o ponto para status &quot;Pendente&quot; até nova revisão.
        </p>
      </div>
      <PointForm defaultValues={defaultValues} pointId={point.id} />
    </div>
  );
}
