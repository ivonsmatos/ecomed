"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, AlertTriangle } from "lucide-react";

type ReportType = "CLOSED" | "WRONG_ADDRESS" | "NOT_ACCEPTING" | "OTHER";

const TIPO_LABELS: Record<ReportType, string> = {
  CLOSED: "Ponto fechado / desativado",
  WRONG_ADDRESS: "Endereço incorreto",
  NOT_ACCEPTING: "Não está aceitando resíduos",
  OTHER: "Outro problema",
};

export default function ReportarPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const pontoId = params.id;

  const [tipo, setTipo] = useState<ReportType>("CLOSED");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/reportes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pontoId, tipo, descricao: descricao || undefined }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "Erro ao enviar reporte. Tente novamente.");
        return;
      }

      router.push("/mapa");
    } catch {
      setError("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <Link
          href="/mapa"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar
        </Link>
        <h1 className="text-lg font-semibold">Reportar problema</h1>
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 mb-6">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Seu reporte ajuda a manter o mapa atualizado para toda a comunidade.
            Nossa equipe irá verificar as informações.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo do problema */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Qual é o problema?</Label>
            <div className="space-y-2">
              {(Object.keys(TIPO_LABELS) as ReportType[]).map((key) => (
                <label
                  key={key}
                  className={`flex items-center gap-3 bg-white border rounded-lg p-3 cursor-pointer transition-colors ${
                    tipo === key
                      ? "border-green-500 bg-eco-teal/10"
                      : "hover:border-green-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="tipo"
                    value={key}
                    checked={tipo === key}
                    onChange={() => setTipo(key)}
                    className="accent-eco-green"
                  />
                  <span className="flex-1 text-sm">{TIPO_LABELS[key]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Descrição opcional */}
          <div className="space-y-2">
            <Label htmlFor="descricao">
              Detalhes <span className="text-gray-400 font-normal">(opcional)</span>
            </Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Adicione mais informações sobre o problema..."
              maxLength={500}
              rows={4}
            />
            <p className="text-xs text-gray-400 text-right">
              {descricao.length}/500
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Enviando..." : "Enviar reporte"}
          </Button>
        </form>
      </div>
    </div>
  );
}
