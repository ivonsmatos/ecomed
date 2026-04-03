"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle } from "lucide-react";

export function ResolveButton({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleResolve() {
    setLoading(true);
    const res = await fetch(`/api/admin/reportes/${reportId}/resolver`, { method: "PATCH" });
    if (res.ok) {
      toast.success("Reporte marcado como resolvido");
      router.refresh();
    } else {
      toast.error("Erro ao resolver reporte");
    }
    setLoading(false);
  }

  return (
    <Button size="sm" variant="outline" onClick={handleResolve} disabled={loading}>
      {loading ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle className="size-3.5" />}
      <span className="ml-1.5">Resolver</span>
    </Button>
  );
}
