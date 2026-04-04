import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! })
const prisma = new PrismaClient({ adapter })

const PONTOS_MOCK = [
  {
    cnpj: "11222333000100",
    name: "Drogaria São Paulo — Paulista",
    address: "Av. Paulista, 1000",
    city: "São Paulo",
    state: "SP",
    zipCode: "01310100",
    latitude: -23.5629,
    longitude: -46.6544,
    phone: "11999990001",
    residueTypes: ["medicamento"],
  },
  {
    cnpj: "11222333000200",
    name: "UBS Vila Madalena",
    address: "R. Mourato Coelho, 100",
    city: "São Paulo",
    state: "SP",
    zipCode: "05416001",
    latitude: -23.554,
    longitude: -46.689,
    phone: "11999990002",
    residueTypes: ["medicamento", "seringa"],
  },
  {
    cnpj: "11222333000300",
    name: "Farmácia Popular — Pinheiros",
    address: "R. dos Pinheiros, 500",
    city: "São Paulo",
    state: "SP",
    zipCode: "05422001",
    latitude: -23.5636,
    longitude: -46.6849,
    phone: "11999990003",
    residueTypes: ["medicamento"],
  },
  {
    cnpj: "11222333000400",
    name: "UBS Consolação",
    address: "R. da Consolação, 200",
    city: "São Paulo",
    state: "SP",
    zipCode: "01302001",
    latitude: -23.5534,
    longitude: -46.6604,
    phone: "11999990004",
    residueTypes: ["medicamento"],
  },
  {
    cnpj: "11222333000500",
    name: "Drogasil — Moema",
    address: "Av. Ibirapuera, 3103",
    city: "São Paulo",
    state: "SP",
    zipCode: "04029200",
    latitude: -23.6063,
    longitude: -46.6669,
    phone: "11999990005",
    residueTypes: ["medicamento"],
  },
  {
    cnpj: "11222333000600",
    name: "UBS Santo André Centro",
    address: "R. Coronel Oliveira Lima, 200",
    city: "Santo André",
    state: "SP",
    zipCode: "09010160",
    latitude: -23.6639,
    longitude: -46.5338,
    phone: "11999990006",
    residueTypes: ["medicamento"],
  },
  {
    cnpj: "11222333000700",
    name: "Ultrafarma — Campinas",
    address: "R. Corcovado, 50",
    city: "Campinas",
    state: "SP",
    zipCode: "13090000",
    latitude: -22.9021,
    longitude: -47.0653,
    phone: "19999990007",
    residueTypes: ["medicamento", "seringa"],
  },
  {
    cnpj: "11222333000800",
    name: "Hospital das Clínicas — Recepção",
    address: "Av. Dr. Enéas de Carvalho Aguiar, 155",
    city: "São Paulo",
    state: "SP",
    zipCode: "05403000",
    latitude: -23.5564,
    longitude: -46.6695,
    phone: "11999990008",
    residueTypes: ["medicamento", "frasco", "seringa"],
  },
  {
    cnpj: "11222333000900",
    name: "Drogaria Onofre — Centro SP",
    address: "R. Barão de Itapetininga, 140",
    city: "São Paulo",
    state: "SP",
    zipCode: "01042001",
    latitude: -23.5428,
    longitude: -46.6407,
    phone: "11999990009",
    residueTypes: ["medicamento"],
  },
  {
    cnpj: "11222333001000",
    name: "UBS Lapa",
    address: "R. Catão, 500",
    city: "São Paulo",
    state: "SP",
    zipCode: "05049000",
    latitude: -23.5248,
    longitude: -46.7056,
    phone: "11999990010",
    residueTypes: ["medicamento"],
  },
]

async function main() {
  console.log("Criando parceiro seed LogMed...")

  const adminUser = await prisma.user.upsert({
    where: { email: "seed@ecomed.eco.br" },
    update: {},
    create: {
      name: "Sistema LogMed",
      email: "seed@ecomed.eco.br",
      role: "ADMIN",
      emailVerified: new Date(),
    },
  })

  const partner = await prisma.partner.upsert({
    where: { cnpj: "00000000000000" },
    update: {},
    create: {
      userId: adminUser.id,
      cnpj: "00000000000000",
      companyName: "LogMed / ANVISA",
      tradeName: "Rede LogMed",
    },
  })

  console.log(`Inserindo ${PONTOS_MOCK.length} pontos de coleta...`)

  for (const ponto of PONTOS_MOCK) {
    // Usar ID determinístico para idempotência do seed
    const seedId = `seed-${ponto.cnpj}`

    await prisma.point.upsert({
      where: { id: seedId },
      update: {
        name: ponto.name,
        address: ponto.address,
        city: ponto.city,
        state: ponto.state,
        latitude: ponto.latitude,
        longitude: ponto.longitude,
      },
      create: {
        id: seedId,
        partnerId: partner.id,
        name: ponto.name,
        address: ponto.address,
        city: ponto.city,
        state: ponto.state,
        zipCode: ponto.zipCode,
        latitude: ponto.latitude,
        longitude: ponto.longitude,
        phone: ponto.phone,
        residueTypes: ponto.residueTypes,
        status: "APPROVED",
      },
    })

    // Horários padrão — pula se já existem
    const total = await prisma.schedule.count({ where: { pointId: seedId } })
    if (total === 0) {
      await prisma.schedule.createMany({
        data: [
          { pointId: seedId, dayOfWeek: 0, opens: "08:00", closes: "13:00", closed: true },
          { pointId: seedId, dayOfWeek: 1, opens: "08:00", closes: "18:00", closed: false },
          { pointId: seedId, dayOfWeek: 2, opens: "08:00", closes: "18:00", closed: false },
          { pointId: seedId, dayOfWeek: 3, opens: "08:00", closes: "18:00", closed: false },
          { pointId: seedId, dayOfWeek: 4, opens: "08:00", closes: "18:00", closed: false },
          { pointId: seedId, dayOfWeek: 5, opens: "08:00", closes: "18:00", closed: false },
          { pointId: seedId, dayOfWeek: 6, opens: "08:00", closes: "13:00", closed: false },
        ],
      })
    }
  }

  console.log("✅ Seed LogMed concluído!")
  console.log(`   ${PONTOS_MOCK.length} pontos de coleta inseridos/atualizados`)
  console.log("   Verifique com: pnpm db:studio → tabela Point")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
