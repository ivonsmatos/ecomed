"use client";

import { useState } from "react";
import { Copy, Share2, Check, Users, Coins, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Referido {
  id: string;
  name: string;
  createdAt: string;
}

interface Props {
  referralCode: string;
  referidos: Referido[];
  indicacoesConfirmadas: number;
  coinsGanhos: number;
}

export function ReferralPanel({ referralCode, referidos, indicacoesConfirmadas, coinsGanhos }: Props) {
  const [copied, setCopied] = useState(false);

  const referralLink = `https://ecomed.eco.br/cadastrar?ref=${referralCode}`;
  const shareText = `♻️ Junte-se ao EcoMed e descarte seus medicamentos corretamente! Use meu código ${referralCode} ao se cadastrar e ganhe bônus. ${referralLink}`;

  async function copiarLink() {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  }

  async function compartilhar() {
    if (navigator.share) {
      await navigator.share({
        title: "EcoMed — Descarte correto",
        text: shareText,
        url: referralLink,
      });
    } else {
      window.open(
        `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`,
        "_blank",
      );
    }
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border p-4 text-center space-y-1">
          <div className="flex items-center justify-center gap-1 text-eco-teal-dark">
            <Users className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Amigos indicados</span>
          </div>
          <p className="text-3xl font-bold">{indicacoesConfirmadas}</p>
        </div>
        <div className="rounded-xl border p-4 text-center space-y-1">
          <div className="flex items-center justify-center gap-1 text-yellow-600">
            <Coins className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Coins ganhos</span>
          </div>
          <p className="text-3xl font-bold text-yellow-600">{coinsGanhos}</p>
        </div>
      </div>

      {/* Código */}
      <div className="rounded-xl border p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Gift className="size-4 text-eco-teal-dark" />
          Seu código de indicação
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-lg bg-muted px-4 py-3 font-mono text-lg font-bold tracking-widest select-all">
            {referralCode}
          </div>
          <Button variant="outline" size="icon" onClick={copiarLink} aria-label="Copiar link">
            {copied ? <Check className="size-4 text-eco-green" /> : <Copy className="size-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Link: <span className="text-eco-teal-dark truncate">{referralLink}</span>
        </p>
      </div>

      {/* Botões de compartilhamento */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="gap-2" onClick={copiarLink}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          Copiar link
        </Button>
        <Button className="gap-2 bg-eco-green hover:bg-eco-green/90 text-white" onClick={compartilhar}>
          <Share2 className="size-4" />
          Compartilhar
        </Button>
      </div>

      {/* Como funciona */}
      <div className="rounded-xl border bg-muted/40 p-4 space-y-2">
        <p className="text-sm font-semibold">Como funciona?</p>
        <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Compartilhe seu link/código com amigos</li>
          <li>Seu amigo se cadastra usando seu código</li>
          <li>Você recebe automaticamente <strong>+10 EcoCoins</strong></li>
          <li>Sem limite de indicações!</li>
        </ol>
      </div>

      {/* Lista de indicados */}
      {referidos.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-sm">Amigos cadastrados via seu link</h2>
          <ul className="divide-y rounded-xl border overflow-hidden">
            {referidos.map((r) => (
              <li key={r.id} className={cn("flex items-center justify-between px-4 py-3 text-sm bg-card")}>
                <span className="font-medium">{r.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true, locale: ptBR })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
