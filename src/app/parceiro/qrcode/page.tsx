import type { Metadata } from "next"
import { requirePartner } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import { QrCodeCards } from "./QrCodeCards"
import { gerarTokenPonto } from "@/lib/qr/token"

export const metadata: Metadata = { title: "QR Code por Loja | EcoMed Parceiro" }

export default async function ParceiroQrCodePage() {
  const session = await requirePartner()

  const partner = await prisma.partner.findUnique({
    where: { userId: session.user!.id! },
    include: {
      points: {
        where: { status: "APPROVED" },
        select: { id: true, name: true, address: true, city: true, state: true },
        orderBy: { name: "asc" },
      },
    },
  })

  if (!partner) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Parceiro não encontrado.
      </div>
    )
  }

  if (partner.points.length === 0) {
    return (
      <div className="py-20 text-center space-y-2">
        <p className="text-lg font-semibold">Nenhum ponto aprovado ainda</p>
        <p className="text-muted-foreground text-sm">
          Quando seu ponto for aprovado, o QR Code estará disponível aqui.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">QR Code por Loja</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Imprima e afixe no balcão. Cada código é único por ponto.
        </p>
      </div>
      <QrCodeCards
        points={partner.points.map((point) => ({
          ...point,
          token: gerarTokenPonto(point.id),
        }))}
      />
    </div>
  )
}
