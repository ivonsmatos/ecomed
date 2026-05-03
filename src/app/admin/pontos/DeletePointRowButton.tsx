"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";

export function DeletePointRowButton({ pointId }: { pointId: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const res = await fetch(`/api/admin/pontos/${pointId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Ponto excluído.");
      router.refresh();
    } else {
      toast.error("Erro ao excluir o ponto");
    }
    setLoading(false);
    setConfirm(false);
  }

  if (!confirm) {
    return (
      <Button variant="ghost" size="icon" className="size-8 text-destructive hover:bg-destructive/10" title="Excluir ponto" onClick={() => setConfirm(true)}>
        <Trash2 className="size-4" />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Button variant="destructive" size="sm" className="h-7 text-xs px-2" onClick={handleDelete} disabled={loading}>
        {loading ? <Loader2 className="size-3 mr-1 animate-spin" /> : null}
        Excluir?
      </Button>
      <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => setConfirm(false)} disabled={loading}>
        Não
      </Button>
    </div>
  );
}
