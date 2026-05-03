"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";

export function DeletePointButton({ pointId }: { pointId: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const res = await fetch(`/api/admin/pontos/${pointId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Ponto excluído.");
      router.push("/admin/pontos");
      router.refresh();
    } else {
      toast.error("Erro ao excluir o ponto");
    }
    setLoading(false);
  }

  if (!confirm) {
    return (
      <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/5" onClick={() => setConfirm(true)}>
        <Trash2 className="size-4 mr-2" />
        Excluir ponto
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-destructive">Confirma exclusão permanente?</span>
      <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
        {loading ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
        Sim, excluir
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirm(false)} disabled={loading}>
        Cancelar
      </Button>
    </div>
  );
}
