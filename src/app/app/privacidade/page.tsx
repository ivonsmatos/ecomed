import { requireSession } from "@/lib/auth/session";
import type { Metadata } from "next";
import { LgpdPanel } from "./LgpdPanel";

export const metadata: Metadata = {
  title: "Privacidade e Dados | EcoMed",
  description: "Gerencie seus dados pessoais conforme a Lei Geral de Proteção de Dados (LGPD).",
};

export default async function LgpdPage() {
  await requireSession();

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Privacidade e Dados</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Conforme a Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018), você tem o direito de
          acessar, exportar e solicitar a exclusão dos seus dados.
        </p>
      </div>

      <LgpdPanel />
    </div>
  );
}
