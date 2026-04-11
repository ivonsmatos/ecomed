import { auth } from "@/../auth"
import { prisma } from "@/lib/db/prisma"
import { calcularImpacto } from "@/lib/impacto"
import { renderToBuffer } from "@react-pdf/renderer"
import { RelatorioPDF } from "@/components/pdf/RelatorioPDF"
import { createElement } from "react"
import type { ReactElement } from "react"
import type { DocumentProps } from "@react-pdf/renderer"

const CUSTO_RELATORIO = 200

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Não autenticado." }, { status: 401 })
  }
  const userId = session.user.id

  const [checkins, wallet, usuario] = await Promise.all([
    prisma.checkin.count({ where: { userId } }),
    prisma.wallet.findUnique({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
  ])

  if (!wallet || wallet.balance < CUSTO_RELATORIO) {
    return Response.json(
      { error: `EcoCoins insuficientes. Necessário: ${CUSTO_RELATORIO}, disponível: ${wallet?.balance ?? 0}.` },
      { status: 400 }
    )
  }

  // Debitar eccoins atomicamente
  await prisma.$transaction([
    prisma.wallet.update({
      where: { userId },
      data: { balance: { decrement: CUSTO_RELATORIO } },
    }),
    prisma.coinTransaction.create({
      data: {
        walletId: wallet.id,
        amount: -CUSTO_RELATORIO,
        event: "REDEMPTION",
        note: "Relatório de impacto em PDF",
      },
    }),
  ])

  const impacto = calcularImpacto(checkins)
  const buffer = await renderToBuffer(
    createElement(RelatorioPDF, {
      nome: usuario?.name ?? "Eco-Cidadão",
      checkins,
      impacto,
      nivel: wallet.level,
    }) as unknown as ReactElement<DocumentProps>
  )

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ecomed-impacto.pdf"`,
      "Cache-Control": "no-store",
    },
  })
}
