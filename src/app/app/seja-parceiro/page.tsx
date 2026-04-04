import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import { PartnerRegistrationForm } from "@/components/parceiro/PartnerRegistrationForm";
import { Building2, Clock, CheckCircle } from "lucide-react";

export const metadata = { title: "Seja um Parceiro | EcoMed" };

export default async function SejaParceiroPage() {
  const session = await requireSession();
  const userId = session.user!.id!;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, partner: { select: { id: true } } },
  });

  // Já é parceiro aprovado → redireciona para dashboard
  if (user?.role === "PARTNER" || user?.role === "ADMIN") {
    redirect("/parceiro/dashboard");
  }

  // Já enviou solicitação (tem registro Partner mas ainda é CITIZEN)
  if (user?.partner) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-6 text-center space-y-3">
          <Clock className="size-10 text-yellow-600 mx-auto" />
          <h1 className="text-xl font-bold text-yellow-800">Solicitação em análise</h1>
          <p className="text-sm text-yellow-700">
            Sua solicitação de cadastro como parceiro foi enviada e está em análise pela nossa equipe.
            Você receberá um e-mail em até <strong>48 horas úteis</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Building2 className="size-6 text-green-700" />
          <h1 className="text-2xl font-bold">Seja um parceiro EcoMed</h1>
        </div>
        <p className="text-muted-foreground">
          Farmácias e Unidades de Saúde podem cadastrar seus pontos de coleta gratuitamente
          e aparecer no mapa para milhares de usuários.
        </p>
      </div>

      {/* Benefícios */}
      <div className="rounded-xl border bg-green-50 p-5 space-y-3">
        <h2 className="font-semibold text-green-800 text-sm uppercase tracking-wide">
          Por que ser parceiro?
        </h2>
        <ul className="space-y-2">
          {[
            "Apareça no mapa e atraia mais clientes",
            "Contribua com o descarte correto de medicamentos",
            "Painel de estatísticas com visualizações e favoritos",
            "Gratuito — sem taxas ou mensalidades",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-green-900">
              <CheckCircle className="size-4 text-green-600 shrink-0 mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Formulário */}
      <div className="rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold">Dados da empresa</h2>
        <PartnerRegistrationForm />
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Após o envio, nossa equipe analisará os dados em até 48 horas úteis.
        Você receberá um e-mail com a confirmação do cadastro.
      </p>
    </div>
  );
}
