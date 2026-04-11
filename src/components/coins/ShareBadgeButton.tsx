"use client"

import { useState } from "react"
import { Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  nome: string
  nivel: string
  nivelLabel: string
}

export function ShareBadgeButton({ nome, nivel, nivelLabel }: Props) {
  const [enviado, setEnviado] = useState(false)

  const handleShare = async () => {
    const ogUrl = `https://ecomed.eco.br/api/og/conquista?nome=${encodeURIComponent(nome)}&badge=${encodeURIComponent(nivelLabel)}&nivel=${encodeURIComponent(nivelLabel)}`
    const texto = `Alcancei o nível ${nivelLabel} no EcoMed! 🌿 Juntos pelo descarte correto de medicamentos. ecomed.eco.br`

    try {
      if (navigator.share) {
        await navigator.share({ title: "EcoMed — Minha conquista", text: texto, url: "https://ecomed.eco.br" })
      } else {
        // Fallback: WhatsApp
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`, "_blank")
      }

      if (!enviado) {
        setEnviado(true)
        // Creditar coins de compartilhamento (idempotente via rate limit diário)
        await fetch("/api/coins/share", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "badge" }),
        })
      }
    } catch {
      // Usuário cancelou o share — não creditar
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      className="flex items-center gap-2"
    >
      <Share2 className="size-4" />
      {enviado ? "Compartilhado! +2 EcoCoins" : "Compartilhar conquista"}
    </Button>
  )
}
