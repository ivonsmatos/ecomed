"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface Props {
  partnerId: string;
  partnerName: string;
}

export function PartnerCandidateActions({ partnerId, partnerName }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<"aprovar" | "rejeitar" | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [motivo, setMotivo] = useState("");

  async function aprovar() {
    setLoading("aprovar");
    try {
      const res = await fetch(`/api/admin/parceiros/${partnerId}/aprovar`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Erro ao aprovar."); return; }
      toast.success(`${partnerName} aprovado como parceiro.`);
      router.refresh();
    } catch {
      toast.error("Erro de conexão.");
    } finally {
      setLoading(null);
    }
  }

  async function rejeitar() {
    if (motivo.trim().length < 5) {
      toast.error("Informe o motivo (mínimo 5 caracteres).");
      return;
    }
    setLoading("rejeitar");
    try {
      const res = await fetch(`/api/admin/parceiros/${partnerId}/rejeitar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivo: motivo.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Erro ao rejeitar."); return; }
      toast.success("Candidatura rejeitada.");
      setShowRejectModal(false);
      router.refresh();
    } catch {
      toast.error("Erro de conexão.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          onClick={aprovar}
          disabled={!!loading}
          className="bg-eco-green hover:bg-eco-green/90 text-white"
        >
          {loading === "aprovar" ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
          <span className="ml-1">Aprovar</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowRejectModal(true)}
          disabled={!!loading}
          className="border-destructive text-destructive hover:bg-destructive/10"
        >
          <XCircle className="size-3.5" />
          <span className="ml-1">Rejeitar</span>
        </Button>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm space-y-4 rounded-xl border bg-background p-6 shadow-lg">
            <h3 className="font-semibold">Rejeitar candidatura</h3>
            <p className="text-sm text-muted-foreground">
              Informe o motivo para <strong>{partnerName}</strong>. Será enviado por email.
            </p>
            <textarea
              className="w-full rounded-md border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              rows={3}
              placeholder="Ex: CNPJ inválido ou endereço fora da área de cobertura..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowRejectModal(false)} disabled={!!loading}>
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={rejeitar}
                disabled={!!loading}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                {loading === "rejeitar" ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null}
                Confirmar rejeição
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
