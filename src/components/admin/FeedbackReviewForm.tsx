"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  feedbackId: string;
}

export function FeedbackReviewForm({ feedbackId }: Props) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();

  async function handleSubmit() {
    if (!action.trim() || action.trim().length < 3) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/feedback/${feedbackId}/revisar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionTaken: action.trim() }),
      });
      if (res.ok) {
        setDone(true);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <CheckCircle2 className="size-4" />
        Marcado como revisado
      </div>
    );
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Marcar como revisado
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Textarea
        placeholder="Descreva a ação tomada (ex: fix no RAG, ajuste no system prompt, guardrail adicionado...)"
        value={action}
        onChange={(e) => setAction(e.target.value)}
        rows={2}
        className="text-sm"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={loading || action.trim().length < 3}
        >
          {loading && <Loader2 className="mr-2 size-3 animate-spin" />}
          Confirmar
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
