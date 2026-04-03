import { requirePartner } from "@/lib/auth/session";
import { PointForm } from "@/components/parceiro/PointForm";

export const metadata = { title: "Novo Ponto | EcoMed Parceiro" };

export default async function NovoPontoPage() {
  await requirePartner();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cadastrar novo ponto de coleta</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Após o cadastro, o ponto será revisado pela equipe EcoMed antes de aparecer no mapa.
        </p>
      </div>
      <PointForm />
    </div>
  );
}
