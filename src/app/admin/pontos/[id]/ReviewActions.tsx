"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface ReviewActionsProps {
  pointId: string;
  currentStatus: string;
}

export function ReviewActions({ pointId, currentStatus }: ReviewActionsProps) {
  const router = useRouter();
  const [motivo, setMotivo] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [loading, setLoading] = useState<"aprovar" | "rejeitar" | null>(null);

  async function handleAprovar() {
    setLoading("aprovar");
    const res = await fetch(`/api/admin/pontos/${pointId}/aprovar`, { method: "POST" });
    if (res.ok) {
      toast.success("Ponto aprovado!");
      router.push("/admin/pontos?status=APPROVED");
      router.refresh();
    } else {
      toast.error("Erro ao aprovar o ponto");
    }
    setLoading(null);
  }

  async function handleRejeitar() {
    if (!motivo.trim()) { toast.error("Informe o motivo"); return; }
    setLoading("rejeitar");
    const res = await fetch(`/api/admin/pontos/${pointId}/rejeitar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ motivo }),
    });
    if (res.ok) {
      toast.success("Ponto rejeitado.");
      router.push("/admin/pontos?status=REJECTED");
      router.refresh();
    } else {
      toast.error("Erro ao rejeitar o ponto");
    }
    setLoading(null);
  }

  if (currentStatus === "APPROVED") return <p className="text-sm text-eco-green font-medium">✓ Este ponto já está aprovado.</p>;
  if (currentStatus === "REJECTED") return <p className="text-sm text-destructive font-medium">✗ Este ponto foi rejeitado.</p>;

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Button
          className="bg-eco-green hover:bg-eco-green/90 text-white"
          onClick={handleAprovar}
          disabled={!!loading}
        >
          {loading === "aprovar" ? <Loader2 className="size-4 mr-2 animate-spin" /> : <CheckCircle className="size-4 mr-2" />}
          Aprovar
        </Button>
        <Button
          variant="destructive"
          onClick={() => setShowReject(!showReject)}
          disabled={!!loading}
        >
          <XCircle className="size-4 mr-2" />
          Rejeitar
        </Button>
      </div>
      {showReject && (
        <div className="space-y-2">
          <Textarea
            placeholder="Motivo da rejeição (visível ao parceiro)…"
            value={motivo}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMotivo(e.target.value)}
            rows={3}
          />
          <Button
            variant="destructive"
            size="sm"
            onClick={handleRejeitar}
            disabled={loading === "rejeitar"}
          >
            {loading === "rejeitar" && <Loader2 className="size-4 mr-2 animate-spin" />}
            Confirmar rejeição
          </Button>
        </div>
      )}
    </div>
  );
}
