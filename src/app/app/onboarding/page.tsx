"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

const PASSOS = [
  {
    titulo: "Bem-vindo ao EcoMed! 🌿",
    descricao:
      "Aqui você encontra pontos de coleta para descartar medicamentos vencidos ou sem uso de forma correta e segura.",
    cta: "Próximo",
  },
  {
    titulo: "Ganhe EcoCoins 🪙",
    descricao:
      "A cada descarte em um ponto parceiro, você ganha EcoCoins. Acumule pontos, suba de nível e desbloqueie conquistas.",
    cta: "Próximo",
  },
  {
    titulo: "Encontre um ponto agora 📍",
    descricao:
      "Há pontos de coleta próximos a você. Permita o acesso à localização para encontrar o mais perto.",
    cta: "Começar",
  },
]

export default function OnboardingPage() {
  const [passo, setPasso] = useState(0)
  const router = useRouter()

  const avancar = async () => {
    if (passo < PASSOS.length - 1) {
      setPasso((p) => p + 1)
      return
    }

    await fetch("/api/onboarding/concluir", { method: "POST" })
    router.push("/mapa")
  }

  const atual = PASSOS[passo]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-8">
      <div className="flex gap-2">
        {PASSOS.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all ${
              i === passo ? "w-8 bg-primary" : "w-2 bg-muted"
            }`}
          />
        ))}
      </div>

      <div className="text-center space-y-3 max-w-sm">
        <h1 className="text-2xl font-medium">{atual.titulo}</h1>
        <p className="text-muted-foreground">{atual.descricao}</p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <Button className="w-full bg-primary text-white" onClick={avancar}>
          {atual.cta}
        </Button>
        {passo < PASSOS.length - 1 && (
          <Button variant="ghost" className="w-full" onClick={avancar}>
            Pular
          </Button>
        )}
      </div>
    </div>
  )
}
