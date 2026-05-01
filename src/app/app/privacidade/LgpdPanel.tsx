"use client";

import { useState } from "react";
import { Download, Trash2, AlertTriangle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { signOut } from "next-auth/react";

export function LgpdPanel() {
  const [excluindo, setExcluindo] = useState(false);
  const [confirmar, setConfirmar] = useState(false);

  async function exportarDados() {
    toast.info("Preparando seu arquivo de dados...");
    const res = await fetch("/api/lgpd/exportar");
    if (!res.ok) {
      toast.error("Erro ao exportar dados. Tente novamente.");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ecomed-meus-dados.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Dados exportados com sucesso!");
  }

  async function excluirConta() {
    setExcluindo(true);
    try {
      const res = await fetch("/api/lgpd/excluir-conta", { method: "DELETE" });
      if (!res.ok) {
        toast.error("Erro ao excluir conta. Tente novamente.");
        return;
      }
      toast.success("Conta excluída. Redirecionando...");
      await signOut({ callbackUrl: "/" });
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Direitos LGPD */}
      <div className="rounded-xl border p-5 space-y-3">
        <div className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="size-5 text-eco-teal-dark" />
          Seus direitos
        </div>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Acessar os dados que possuímos sobre você</li>
          <li>Exportar seus dados em formato legível (JSON)</li>
          <li>Solicitar a exclusão dos seus dados pessoais</li>
          <li>Corrigir dados incorretos ou incompletos</li>
        </ul>
        <p className="text-xs text-muted-foreground">
          Para outras solicitações, entre em contato: <a href="mailto:privacidade@ecomed.eco.br" className="underline">privacidade@ecomed.eco.br</a>
        </p>
      </div>

      {/* Exportar dados */}
      <div className="rounded-xl border p-5 space-y-3">
        <div className="font-semibold text-sm">Exportar meus dados</div>
        <p className="text-sm text-muted-foreground">
          Baixe um arquivo JSON com todas as informações da sua conta: perfil, transações, check-ins,
          missões, conquistas, notificações e mais.
        </p>
        <Button variant="outline" className="gap-2" onClick={exportarDados}>
          <Download className="size-4" />
          Baixar meus dados
        </Button>
      </div>

      {/* Excluir conta */}
      <div className="rounded-xl border border-red-200 dark:border-red-900 p-5 space-y-3">
        <div className="flex items-center gap-2 font-semibold text-red-600 dark:text-red-400">
          <AlertTriangle className="size-5" />
          Excluir minha conta
        </div>
        <p className="text-sm text-muted-foreground">
          Sua conta será <strong>anonimizada permanentemente</strong>. Seus dados pessoais (nome,
          e-mail, foto) serão removidos. Esta ação <strong>não pode ser desfeita</strong>.
        </p>

        {!confirmar ? (
          <Button
            variant="outline"
            className="gap-2 border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
            onClick={() => setConfirmar(true)}
          >
            <Trash2 className="size-4" />
            Solicitar exclusão da conta
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-red-600 dark:text-red-400">
              Tem certeza? Esta ação é irreversível.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmar(false)}
                disabled={excluindo}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="gap-2 bg-red-600 hover:bg-red-700 text-white"
                onClick={excluirConta}
                disabled={excluindo}
              >
                <Trash2 className="size-4" />
                {excluindo ? "Excluindo..." : "Sim, excluir minha conta"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
