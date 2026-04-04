import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Iniciando seed...");

  // Admin
  const adminHash = await bcrypt.hash("Admin@123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@ecomed.eco.br" },
    update: {},
    create: {
      name: "Administração EcoMed",
      email: "admin@ecomed.eco.br",
      passwordHash: adminHash,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });
  console.log(`✅ Admin criado: ${admin.email}`);

  // Partners
  const partnerHash = await bcrypt.hash("Parceiro@123", 12);

  const partner1User = await prisma.user.upsert({
    where: { email: "farmacia.saude@example.com" },
    update: {},
    create: {
      name: "João Silva",
      email: "farmacia.saude@example.com",
      passwordHash: partnerHash,
      role: "PARTNER",
      emailVerified: new Date(),
    },
  });

  const partner1 = await prisma.partner.upsert({
    where: { userId: partner1User.id },
    update: {},
    create: {
      userId: partner1User.id,
      cnpj: "11222333000181",
      companyName: "Farmácia Saúde Ltda",
      tradeName: "Farmácia Saúde",
      phone: "(11) 3333-4444",
    },
  });

  const partner2User = await prisma.user.upsert({
    where: { email: "drogaria.bem@example.com" },
    update: {},
    create: {
      name: "Maria Oliveira",
      email: "drogaria.bem@example.com",
      passwordHash: partnerHash,
      role: "PARTNER",
      emailVerified: new Date(),
    },
  });

  const partner2 = await prisma.partner.upsert({
    where: { userId: partner2User.id },
    update: {},
    create: {
      userId: partner2User.id,
      cnpj: "44555666000172",
      companyName: "Drogaria Bem Estar ME",
      tradeName: "Drogaria Bem Estar",
      phone: "(21) 9999-8888",
    },
  });

  console.log(`✅ Parceiros criados: ${partner1User.email}, ${partner2User.email}`);

  // Citizen
  const citizenHash = await bcrypt.hash("Usuario@123", 12);
  const citizen = await prisma.user.upsert({
    where: { email: "cidadao@example.com" },
    update: {},
    create: {
      name: "Carlos Souza",
      email: "cidadao@example.com",
      passwordHash: citizenHash,
      role: "CITIZEN",
      emailVerified: new Date(),
    },
  });
  console.log(`✅ Cidadão criado: ${citizen.email}`);

  // Points - São Paulo
  const point1 = await prisma.point.upsert({
    where: { id: "point-seed-001" },
    update: {},
    create: {
      id: "point-seed-001",
      partnerId: partner1.id,
      name: "Farmácia Saúde — Pinheiros",
      address: "Rua dos Pinheiros, 1200",
      city: "São Paulo",
      state: "SP",
      zipCode: "05422-001",
      latitude: -23.5656,
      longitude: -46.6768,
      phone: "(11) 3333-4444",
      email: "pinheiros@farmaciasaude.com.br",
      status: "APPROVED",
      residueTypes: ["MEDICAMENTOS_VENCIDOS", "EMBALAGENS_VAZIAS", "SERINGAS"],
      schedules: {
        create: [
          { dayOfWeek: 1, opens: "08:00", closes: "20:00" },
          { dayOfWeek: 2, opens: "08:00", closes: "20:00" },
          { dayOfWeek: 3, opens: "08:00", closes: "20:00" },
          { dayOfWeek: 4, opens: "08:00", closes: "20:00" },
          { dayOfWeek: 5, opens: "08:00", closes: "20:00" },
          { dayOfWeek: 6, opens: "09:00", closes: "16:00" },
          { dayOfWeek: 0, opens: "", closes: "", closed: true },
        ],
      },
    },
  });

  const point2 = await prisma.point.upsert({
    where: { id: "point-seed-002" },
    update: {},
    create: {
      id: "point-seed-002",
      partnerId: partner1.id,
      name: "Farmácia Saúde — Moema",
      address: "Av. Ibirapuera, 2907",
      city: "São Paulo",
      state: "SP",
      zipCode: "04029-200",
      latitude: -23.6027,
      longitude: -46.6658,
      phone: "(11) 3333-5555",
      status: "APPROVED",
      residueTypes: ["MEDICAMENTOS_VENCIDOS", "EMBALAGENS_VAZIAS"],
      schedules: {
        create: [
          { dayOfWeek: 1, opens: "08:00", closes: "22:00" },
          { dayOfWeek: 2, opens: "08:00", closes: "22:00" },
          { dayOfWeek: 3, opens: "08:00", closes: "22:00" },
          { dayOfWeek: 4, opens: "08:00", closes: "22:00" },
          { dayOfWeek: 5, opens: "08:00", closes: "22:00" },
          { dayOfWeek: 6, opens: "09:00", closes: "18:00" },
          { dayOfWeek: 0, opens: "10:00", closes: "16:00" },
        ],
      },
    },
  });

  // Point - Rio de Janeiro
  const point3 = await prisma.point.upsert({
    where: { id: "point-seed-003" },
    update: {},
    create: {
      id: "point-seed-003",
      partnerId: partner2.id,
      name: "Drogaria Bem Estar — Ipanema",
      address: "Rua Visconde de Pirajá, 550",
      city: "Rio de Janeiro",
      state: "RJ",
      zipCode: "22410-002",
      latitude: -22.9836,
      longitude: -43.2096,
      phone: "(21) 9999-8888",
      email: "ipanema@drogariabestar.com.br",
      status: "APPROVED",
      residueTypes: ["MEDICAMENTOS_VENCIDOS", "EMBALAGENS_VAZIAS", "TERMOMETROS"],
      schedules: {
        create: [
          { dayOfWeek: 1, opens: "08:00", closes: "21:00" },
          { dayOfWeek: 2, opens: "08:00", closes: "21:00" },
          { dayOfWeek: 3, opens: "08:00", closes: "21:00" },
          { dayOfWeek: 4, opens: "08:00", closes: "21:00" },
          { dayOfWeek: 5, opens: "08:00", closes: "21:00" },
          { dayOfWeek: 6, opens: "09:00", closes: "17:00" },
          { dayOfWeek: 0, opens: "", closes: "", closed: true },
        ],
      },
    },
  });

  // Point - Belo Horizonte (PENDING)
  const point4 = await prisma.point.upsert({
    where: { id: "point-seed-004" },
    update: {},
    create: {
      id: "point-seed-004",
      partnerId: partner2.id,
      name: "Drogaria Bem Estar — Savassi",
      address: "Av. do Contorno, 6594",
      city: "Belo Horizonte",
      state: "MG",
      zipCode: "30110-042",
      latitude: -19.932,
      longitude: -43.9401,
      status: "PENDING",
      residueTypes: ["MEDICAMENTOS_VENCIDOS"],
      schedules: {
        create: [
          { dayOfWeek: 1, opens: "08:00", closes: "20:00" },
          { dayOfWeek: 2, opens: "08:00", closes: "20:00" },
          { dayOfWeek: 3, opens: "08:00", closes: "20:00" },
          { dayOfWeek: 4, opens: "08:00", closes: "20:00" },
          { dayOfWeek: 5, opens: "08:00", closes: "20:00" },
          { dayOfWeek: 6, opens: "09:00", closes: "14:00" },
          { dayOfWeek: 0, opens: "", closes: "", closed: true },
        ],
      },
    },
  });

  // Point - Curitiba
  const point5 = await prisma.point.upsert({
    where: { id: "point-seed-005" },
    update: {},
    create: {
      id: "point-seed-005",
      partnerId: partner1.id,
      name: "Farmácia Saúde — Batel",
      address: "Rua Bispo Dom José, 2000",
      city: "Curitiba",
      state: "PR",
      zipCode: "80440-100",
      latitude: -25.4284,
      longitude: -49.2733,
      status: "APPROVED",
      residueTypes: ["MEDICAMENTOS_VENCIDOS", "EMBALAGENS_VAZIAS"],
      schedules: {
        create: [
          { dayOfWeek: 1, opens: "08:00", closes: "20:00" },
          { dayOfWeek: 2, opens: "08:00", closes: "20:00" },
          { dayOfWeek: 3, opens: "08:00", closes: "20:00" },
          { dayOfWeek: 4, opens: "08:00", closes: "20:00" },
          { dayOfWeek: 5, opens: "08:00", closes: "20:00" },
          { dayOfWeek: 6, opens: "09:00", closes: "15:00" },
          { dayOfWeek: 0, opens: "", closes: "", closed: true },
        ],
      },
    },
  });

  console.log(`✅ Pontos criados: ${[point1, point2, point3, point4, point5].map((p) => p.name).join(", ")}`);

  // Article
  await prisma.article.upsert({
    where: { slug: "como-descartar-medicamentos-corretamente" },
    update: {},
    create: {
      slug: "como-descartar-medicamentos-corretamente",
      title: "Como descartar medicamentos corretamente",
      excerpt:
        "Jogar remédios no lixo ou na pia causa sérios danos ao meio ambiente. Saiba como fazer o descarte correto.",
      content: `## Por que o descarte correto importa?

Medicamentos descartados de forma incorreta — no lixo comum, em vasos sanitários ou pias — contaminam o solo e os lençóis freáticos, afetando a fauna, a flora e até o abastecimento de água potável.

## O que pode ser descartado na EcoMed?

- **Medicamentos vencidos ou sem uso:** comprimidos, cápsulas, xaropes, pomadas, colírios, injetáveis
- **Embalagens vazias:** caixas, frascos, blisters, bisnagas
- **Seringas e lancetas:** com tampa de proteção
- **Termômetros de mercúrio:** protegidos para evitar quebra

## Passo a passo

1. Mantenha os medicamentos nas embalagens originais com bula
2. Localize um ponto de coleta EcoMed próximo de você
3. Entregue ao farmacêutico responsável
4. Receba confirmação do descarte correto

## Legislação

A **RDC ANVISA nº 222/2018** obriga estabelecimentos de saúde a implantarem sistemas de gestão de resíduos. Farmácias e drogarias participam voluntariamente por programas como o **LOGÍSTICA REVERSA**.`,
      category: "Educação",
      published: true,
      publishedAt: new Date("2025-01-15"),
    },
  });

  console.log("✅ Artigo de exemplo criado");

  // ---- Badges ----
  const badgesData = [
    { slug: "primeiro-cadastro",  name: "Bem-vindo!",          coinReward: 0,  description: "Criou sua conta no EcoMed" },
    { slug: "primeiro-artigo",    name: "Curioso",              coinReward: 0,  description: "Leu seu primeiro artigo" },
    { slug: "leitor-assiduo",     name: "Leitor Assíduo",       coinReward: 10, description: "Leu 10 artigos" },
    { slug: "primeiro-reporte",   name: "Fiscal Ambiental",     coinReward: 0,  description: "Reportou um problema pela primeira vez" },
    { slug: "semente",            name: "Semente",              coinReward: 0,  description: "Atingiu o nível Semente" },
    { slug: "broto",              name: "Broto",                coinReward: 5,  description: "Atingiu o nível Broto" },
    { slug: "arvore",             name: "Árvore",               coinReward: 15, description: "Atingiu o nível Árvore" },
    { slug: "guardiao",           name: "Guardião do Planeta",  coinReward: 50, description: "Atingiu o nível mais alto" },
    { slug: "streak-7",           name: "Constante",            coinReward: 0,  description: "Acessou o app por 7 dias seguidos" },
    { slug: "indicador",          name: "Embaixador",           coinReward: 0,  description: "Indicou um amigo que se cadastrou" },
  ]

  for (const badge of badgesData) {
    await prisma.badge.upsert({
      where: { slug: badge.slug },
      update: {},
      create: badge,
    })
  }
  console.log(`✅ ${badgesData.length} badges criados`)

  // ---- Missions ----
  const missionsData = [
    // DAILY
    { slug: "ler-1-artigo",   title: "Leitura diária",   type: "DAILY"  as const, event: "ARTICLE_READ"     as const, targetCount: 1,  coinReward: 3,  description: "Leia 1 artigo hoje" },
    { slug: "ler-3-artigos",  title: "Leitor do dia",    type: "DAILY"  as const, event: "ARTICLE_READ"     as const, targetCount: 3,  coinReward: 8,  description: "Leia 3 artigos hoje" },
    { slug: "reportar-1",     title: "Fiscal",           type: "DAILY"  as const, event: "REPORT_SUBMITTED" as const, targetCount: 1,  coinReward: 5,  description: "Reporte 1 problema" },
    // WEEKLY
    { slug: "ler-10-artigos", title: "Semana educativa", type: "WEEKLY" as const, event: "ARTICLE_READ"     as const, targetCount: 10, coinReward: 25, description: "Leia 10 artigos esta semana" },
    { slug: "streak-semanal", title: "Acesso constante", type: "WEEKLY" as const, event: "STREAK_7_DAYS"    as const, targetCount: 1,  coinReward: 15, description: "Acesse o app todos os dias da semana" },
  ]

  for (const mission of missionsData) {
    await prisma.mission.upsert({
      where: { slug: mission.slug },
      update: {},
      create: mission,
    })
  }
  console.log(`✅ ${missionsData.length} missions criadas`)

  // ---- Wallet para usuário cidadão de exemplo ----
  await prisma.wallet.upsert({
    where: { userId: citizen.id },
    update: {},
    create: { userId: citizen.id, balance: 20, totalEarned: 20, level: "SEMENTE" },
  })
  await prisma.coinTransaction.create({
    data: {
      wallet: { connect: { userId: citizen.id } },
      amount: 20,
      event: "SIGNUP",
      note: "Cadastro completo",
    },
  }).catch(() => {/* já existe em re-runs */})
  console.log("✅ Wallet do cidadão criada")

  console.log("\n🌿 Seed concluído com sucesso!");
  console.log("\nContas criadas:");
  console.log("  Admin:    admin@ecomed.eco.br   / Admin@123");
  console.log("  Parceiro: farmacia.saude@example.com / Parceiro@123");
  console.log("  Parceiro: drogaria.bem@example.com   / Parceiro@123");
  console.log("  Cidadão:  cidadao@example.com        / Usuario@123");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
