import { NextRequest } from "next/server"
import { prisma } from "@/lib/db/prisma"

// Tipo mínimo esperado de uma API externa de pontos de coleta
interface PontoExterno {
  cnpj: string           // CNPJ da empresa (chave de parceiros no EcoMed)
  nome: string
  endereco: string
  cidade: string
  estado: string
  cep: string
  latitude: number
  longitude: number
  telefone?: string
  tiposResiduos?: string[]
}

// GET /api/cron/sync-pontos
// Chamado pelo cron para sincronizar pontos de coleta da API LogMed/ANVISA.
// Estratégia: encontra o Partner pelo CNPJ e atualiza ou cria o Point vinculado.
// Pontos sem Partner cadastrado na plataforma são ignorados (parceiro não validado).
//
// Variáveis necessárias:
//   CRON_SECRET      — token de autenticação do cron
//   LOGMED_API_URL   — URL base da API externa (opcional; no-op se ausente)
//   LOGMED_API_KEY   — chave da API LogMed (opcional)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const apiUrl = process.env.LOGMED_API_URL
  const apiKey = process.env.LOGMED_API_KEY

  if (!apiUrl) {
    return Response.json({
      ok: false,
      message: "LOGMED_API_URL não configurada. Sincronização ignorada.",
    })
  }

  const res = await fetch(`${apiUrl}/pontos-coleta`, {
    headers: {
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      Accept: "application/json",
    },
    cache: "no-store",
  })

  if (!res.ok) {
    return Response.json(
      { ok: false, error: `API externa retornou ${res.status}` },
      { status: 502 }
    )
  }

  const pontos = (await res.json()) as PontoExterno[]

  let atualizados = 0
  let criados = 0
  let ignorados = 0
  let erros = 0

  for (const ponto of pontos) {
    try {
      // Busca o parceiro pelo CNPJ — só sincroniza parceiros já cadastrados
      const partner = await prisma.partner.findUnique({
        where: { cnpj: ponto.cnpj.replace(/\D/g, "") },
        select: { id: true },
      })

      if (!partner) {
        ignorados++
        continue
      }

      // Verifica se já existe Point para este parceiro com coordenadas próximas
      const existing = await prisma.point.findFirst({
        where: {
          partnerId: partner.id,
          latitude: { gte: ponto.latitude - 0.0001, lte: ponto.latitude + 0.0001 },
          longitude: { gte: ponto.longitude - 0.0001, lte: ponto.longitude + 0.0001 },
        },
        select: { id: true },
      })

      const payload = {
        name: ponto.nome,
        address: ponto.endereco,
        city: ponto.cidade,
        state: ponto.estado,
        zipCode: ponto.cep.replace(/\D/g, ""),
        latitude: ponto.latitude,
        longitude: ponto.longitude,
        phone: ponto.telefone ?? null,
        residueTypes: ponto.tiposResiduos?.length ? ponto.tiposResiduos : ["medicamento"],
        updatedAt: new Date(),
      }

      if (existing) {
        await prisma.point.update({ where: { id: existing.id }, data: payload })
        atualizados++
      } else {
        await prisma.point.create({
          data: { ...payload, partnerId: partner.id, status: "APPROVED" },
        })
        criados++
      }
    } catch {
      erros++
    }
  }

  return Response.json({
    ok: true,
    total: pontos.length,
    criados,
    atualizados,
    ignorados,
    erros,
    timestamp: new Date().toISOString(),
  })
}
