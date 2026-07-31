"use client"

import { useRef } from "react"
import QRCode from "react-qr-code"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface Point {
  id: string
  name: string
  address: string
  city: string
  state: string
  token: string
}

function downloadSvg(svgEl: SVGSVGElement | null, filename: string) {
  if (!svgEl) return
  const blob = new Blob([svgEl.outerHTML], { type: "image/svg+xml" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function QrCard({ point }: { point: Point }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const url = `https://ecomed.eco.br/checkin?token=${encodeURIComponent(point.token)}`

  return (
    <Card className="overflow-hidden">
      {/* Cabeçalho verde — identidade EcoMed */}
      <div className="bg-green-700 px-4 py-3 text-center text-white">
        <p className="text-lg font-bold tracking-wide">EcoMed</p>
        <p className="text-xs opacity-80">Descarte aqui seu remédio</p>
      </div>

      <CardContent className="flex flex-col items-center gap-3 pt-5 pb-6">
        {/* QR Code */}
        <div className="rounded-lg border p-3 bg-white">
          <QRCode
            value={url}
            size={160}
            bgColor="#ffffff"
            fgColor="#14532d"
            ref={svgRef as never}
          />
        </div>

        {/* Dados da loja */}
        <div className="text-center space-y-0.5">
          <p className="font-semibold text-sm">{point.name}</p>
          <p className="text-xs text-muted-foreground">{point.address}</p>
          <p className="text-xs text-muted-foreground">
            {point.city} — {point.state}
          </p>
        </div>

        {/* Instrução */}
        <div className="rounded bg-green-50 dark:bg-green-950 px-3 py-2 text-center text-xs text-green-800 dark:text-green-200">
          Aponte a câmera do celular
          <br />
          <span className="font-semibold">Cadastre-se e ganhe EcoCoins</span>
          <br />
          ecomed.eco.br
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => downloadSvg(svgRef.current, `qrcode-${point.id}.svg`)}
        >
          <Download className="mr-1.5 size-4" />
          Baixar SVG
        </Button>
      </CardContent>
    </Card>
  )
}

export function QrCodeCards({ points }: { points: Point[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {points.map((point) => (
        <QrCard key={point.id} point={point} />
      ))}
    </div>
  )
}
