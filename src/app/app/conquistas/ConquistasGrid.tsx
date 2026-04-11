"use client";

import { useState } from "react";
import { Share2, Lock, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Marco {
  n: number;
  slug: string;
  label: string;
  name: string;
  description: string;
  coinReward: number;
  earned: boolean;
  earnedAt: string | null;
}

interface Grupo {
  id: string;
  titulo: string;
  emoji: string;
  descricao: string;
  progressoAtual: number;
  marcos: Marco[];
}

interface Props {
  grupos: Grupo[];
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function proximo(marcos: Marco[], progressoAtual: number): Marco | null {
  return marcos.find((m) => !m.earned && m.n > progressoAtual) ?? null;
}

async function compartilharSelo(marco: Marco) {
  const texto = `Conquistei o selo "${marco.name}" no EcoMed! 🌿 Juntos pelo descarte correto de medicamentos. ecomed.eco.br`;
  try {
    if (navigator.share) {
      await navigator.share({ title: "EcoMed — Conquista", text: texto, url: "https://ecomed.eco.br" });
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`, "_blank");
    }
    // Creditar share badge
    await fetch("/api/coins/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "badge" }),
    });
  } catch {
    /* cancelado */
  }
}

function GrupoCard({ grupo }: { grupo: Grupo }) {
  const [expandido, setExpandido] = useState(false);
  const ganhos = grupo.marcos.filter((m) => m.earned);
  const proximoMarco = proximo(grupo.marcos, grupo.progressoAtual);
  const pct = proximoMarco
    ? Math.min(100, Math.round((grupo.progressoAtual / proximoMarco.n) * 100))
    : 100;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Cabeçalho do grupo */}
      <button
        type="button"
        onClick={() => setExpandido((v) => !v)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/40 transition-colors"
      >
        <span className="text-2xl leading-none">{grupo.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{grupo.titulo}</p>
          <p className="text-xs text-muted-foreground">{grupo.descricao}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-medium text-muted-foreground">
            {ganhos.length}/{grupo.marcos.length}
          </span>
          {expandido ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Barra de progresso para o próximo marco */}
      {proximoMarco && (
        <div className="px-4 pb-3 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{grupo.progressoAtual.toLocaleString("pt-BR")} / {proximoMarco.n.toLocaleString("pt-BR")}</span>
            <span>Próximo: {proximoMarco.name}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            {/* eslint-disable-next-line react/forbid-dom-props */}
            <div
              className="h-full rounded-full bg-eco-teal transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
      {!proximoMarco && ganhos.length === grupo.marcos.length && (
        <div className="px-4 pb-3">
          <p className="text-xs text-eco-teal font-medium">✨ Todos os marcos deste grupo conquistados!</p>
        </div>
      )}

      {/* Grid de marcos */}
      {expandido && (
        <div className="border-t divide-y">
          {grupo.marcos.map((marco) => (
            <div
              key={marco.slug}
              className={cn(
                "flex items-center gap-3 px-4 py-3",
                marco.earned ? "" : "opacity-60",
              )}
            >
              {/* Ícone do marco */}
              <div
                className={cn(
                  "size-12 shrink-0 rounded-full flex items-center justify-center text-xl font-bold border-2",
                  marco.earned
                    ? "bg-linear-to-br from-yellow-300 to-yellow-500 border-yellow-400 text-yellow-900"
                    : "bg-muted border-border text-muted-foreground",
                )}
              >
                {marco.earned ? (
                  <span className="text-xs text-center leading-tight px-1">
                    {marco.n >= 1000
                      ? `${(marco.n / 1000).toFixed(0)}K`
                      : marco.n.toString()}
                  </span>
                ) : (
                  <Lock className="size-4" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{marco.name}</p>
                <p className="text-xs text-muted-foreground leading-snug">{marco.description}</p>
                {marco.earned && marco.earnedAt && (
                  <p className="text-xs text-eco-teal mt-0.5 font-medium">
                    Conquistado em {formatarData(marco.earnedAt)}
                  </p>
                )}
                {!marco.earned && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {grupo.progressoAtual.toLocaleString("pt-BR")} / {marco.n.toLocaleString("pt-BR")}
                  </p>
                )}
                {marco.coinReward > 0 && (
                  <p className="text-xs text-yellow-600 font-medium mt-0.5">
                    +{marco.coinReward} EcoCoins ao conquistar
                  </p>
                )}
              </div>

              {/* Botão compartilhar */}
              {marco.earned && (
                <button
                  type="button"
                  onClick={() => compartilharSelo(marco)}
                  className="shrink-0 size-8 rounded-lg border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Compartilhar selo"
                >
                  <Share2 className="size-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ConquistasGrid({ grupos }: Props) {
  return (
    <div className="space-y-4">
      {grupos.map((grupo) => (
        <GrupoCard key={grupo.id} grupo={grupo} />
      ))}
    </div>
  );
}
