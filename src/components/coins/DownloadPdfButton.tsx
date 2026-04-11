"use client"

import { useState } from "react"
import { FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DownloadPdfButton({ balance }: { balance: number }) {
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const handleDownload = async () => {
    setLoading(true)
    setErro(null)
    try {
      const res = await fetch("/api/usuario/relatorio-pdf")
      if (!res.ok) {
        const data = await res.json()
        setErro(data.error ?? "Erro ao gerar o relatório.")
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "ecomed-impacto.pdf"
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setErro("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-1">
      <Button
        onClick={handleDownload}
        disabled={loading || balance < 200}
        className="bg-eco-green hover:bg-eco-green/90 text-white gap-2"
      >
        <FileDown className="size-4" />
        {loading ? "Gerando PDF…" : "Baixar certificado (200 EcoCoins)"}
      </Button>
      {erro && <p className="text-xs text-red-600">{erro}</p>}
    </div>
  )
}
