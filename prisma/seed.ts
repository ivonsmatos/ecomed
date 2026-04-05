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

  // ---- RewardCatalog ----
  const rewardsData = [
    // Tier SEMENTE (nível mínimo: SEMENTE)
    {
      slug: "badge-personalizado",
      name: "Badge Personalizado",
      description: "Escolha um badge exclusivo para exibir no seu perfil.",
      tier: "SEMENTE",
      cost: 30,
      minLevel: "SEMENTE",
      cooldownDays: 30,
      active: true,
    },
    {
      slug: "tema-visual",
      name: "Tema Visual Exclusivo",
      description: "Desbloqueie um tema especial para o app.",
      tier: "SEMENTE",
      cost: 50,
      minLevel: "SEMENTE",
      cooldownDays: 0,
      active: true,
    },
    // Tier BROTO
    {
      slug: "certificado-eco-cidadao",
      name: "Certificado Eco-Cidadão",
      description: "Certificado digital de participação no programa de descarte correto.",
      tier: "BROTO",
      cost: 100,
      minLevel: "BROTO",
      cooldownDays: 90,
      active: true,
    },
    {
      slug: "destaque-ranking",
      name: "Destaque no Ranking Semanal",
      description: "Seu perfil aparece em destaque no topo do ranking por uma semana.",
      tier: "BROTO",
      cost: 80,
      minLevel: "BROTO",
      cooldownDays: 7,
      active: true,
    },
    // Tier ARVORE
    {
      slug: "selo-verificado",
      name: "Selo Verificado no Perfil",
      description: "Exibe um selo de usuário verificado e comprometido com o meio ambiente.",
      tier: "ARVORE",
      cost: 200,
      minLevel: "ARVORE",
      cooldownDays: 0,
      active: true,
    },
    {
      slug: "certificado-premium",
      name: "Certificado Premium com QR",
      description: "Certificado premium com QR Code verificável, ideal para currículo e redes sociais.",
      tier: "ARVORE",
      cost: 300,
      minLevel: "ARVORE",
      cooldownDays: 90,
      active: true,
    },
    // Tier GUARDIAO
    {
      slug: "hall-da-fama",
      name: "Nome no Hall da Fama",
      description: "Seu nome é inscrito permanentemente no Hall da Fama EcoMed.",
      tier: "GUARDIAO",
      cost: 500,
      minLevel: "GUARDIAO",
      cooldownDays: 0,
      active: true,
    },
  ] as const

  for (const reward of rewardsData) {
    await prisma.rewardCatalog.upsert({
      where: { slug: reward.slug },
      update: { name: reward.name, description: reward.description, cost: reward.cost, active: reward.active },
      create: reward,
    })
  }
  console.log(`✅ ${rewardsData.length} recompensas criadas no catálogo`)

  // ---- Quizzes ----
  const quizzesData = [
    {
      slug: "descarte-basico",
      title: "Descarte Básico de Medicamentos",
      description: "Teste seus conhecimentos sobre como descartar medicamentos de forma correta e segura.",
      category: "DESCARTE",
      difficulty: "FACIL",
      questions: [
        {
          order: 1,
          text: "Qual é a forma correta de descartar medicamentos vencidos no Brasil?",
          options: JSON.stringify([
            "Jogar no lixo doméstico comum",
            "Despejar no vaso sanitário ou pia",
            "Levar a um ponto de coleta autorizado (farmácia ou UBS)",
            "Enterrar no quintal",
          ]),
          correct: 2,
        },
        {
          order: 2,
          text: "Quais riscos o descarte incorreto de medicamentos pode causar?",
          options: JSON.stringify([
            "Nenhum risco — o meio ambiente degrada naturalmente os remédios",
            "Contaminação de solo, rios e lençóis freáticos",
            "Apenas riscos para animais domésticos",
            "Apenas riscos econômicos para a indústria farmacêutica",
          ]),
          correct: 1,
        },
        {
          order: 3,
          text: "O que é logística reversa de medicamentos?",
          options: JSON.stringify([
            "Processo de devolução de medicamentos ao fabricante para reaproveitamento",
            "Transporte de medicamentos do fabricante ao ponto de venda",
            "Importação de medicamentos de outros países",
            "Venda de medicamentos por entrega em domicílio",
          ]),
          correct: 0,
        },
        {
          order: 4,
          text: "Qual lei estabelece a Política Nacional de Resíduos Sólidos (PNRS) no Brasil?",
          options: JSON.stringify([
            "Lei nº 9.605/1998 (Lei de Crimes Ambientais)",
            "Lei nº 12.305/2010",
            "Lei nº 8.080/1990 (Lei Orgânica da Saúde)",
            "Lei nº 6.938/1981 (Política Nacional do Meio Ambiente)",
          ]),
          correct: 1,
        },
        {
          order: 5,
          text: "Antes de levar ao ponto de coleta, o que você deve fazer com os medicamentos?",
          options: JSON.stringify([
            "Triturá-los para reduzir o volume",
            "Misturá-los com café ou sal para neutralizar",
            "Mantê-los nas embalagens originais ou em sacos plásticos fechados",
            "Remover os rótulos para proteger sua privacidade",
          ]),
          correct: 2,
        },
      ],
    },
    {
      slug: "legislacao-anvisa",
      title: "Legislação e ANVISA",
      description: "Aprofunde seus conhecimentos sobre a regulamentação do descarte de medicamentos e o papel da ANVISA.",
      category: "LEGISLACAO",
      difficulty: "MEDIO",
      questions: [
        {
          order: 1,
          text: "Qual é o papel da ANVISA no sistema de descarte de medicamentos?",
          options: JSON.stringify([
            "Fabricar os medicamentos coletados para redistribuição",
            "Regular e fiscalizar o sistema de logística reversa de medicamentos",
            "Financiar os pontos de coleta com recursos federais",
            "Aplicar multas exclusivamente aos cidadãos que descartam errado",
          ]),
          correct: 1,
        },
        {
          order: 2,
          text: "O Decreto nº 10.388/2020 trata de qual tema?",
          options: JSON.stringify([
            "Vacinação obrigatória de trabalhadores da saúde",
            "Criação do Sistema Nacional de Saúde Único (SUS)",
            "Implantação do sistema de logística reversa de medicamentos domiciliares",
            "Regulamentação da importação de medicamentos genéricos",
          ]),
          correct: 2,
        },
        {
          order: 3,
          text: "Quem tem a responsabilidade de criar e manter os pontos de coleta de medicamentos, segundo a legislação?",
          options: JSON.stringify([
            "Exclusivamente o governo federal",
            "Apenas os municípios com mais de 100 mil habitantes",
            "A cadeia produtiva: fabricantes, importadores, distribuidores e varejistas (farmácias)",
            "As organizações não governamentais (ONGs) ambientais",
          ]),
          correct: 2,
        },
        {
          order: 4,
          text: "Medicamentos psicotrópicos e antibióticos vencidos devem ser descartados como?",
          options: JSON.stringify([
            "Da mesma forma que qualquer outro medicamento — em pontos de coleta autorizados",
            "Entregues diretamente à delegacia local",
            "Incinerados em casa",
            "Devolvidos à farmácia onde foram comprados, exclusivamente",
          ]),
          correct: 0,
        },
        {
          order: 5,
          text: "O que significa a sigla RSS no contexto de resíduos farmacêuticos?",
          options: JSON.stringify([
            "Resíduos Sólidos Sustentáveis",
            "Resíduos de Serviços de Saúde",
            "Rede de Saúde e Saneamento",
            "Regulamentação Sanitária e Social",
          ]),
          correct: 1,
        },
      ],
    },
    {
      slug: "impacto-ambiental",
      title: "Impacto Ambiental dos Medicamentos",
      description: "Entenda como os medicamentos descartados incorretamente afetam o meio ambiente e os ecossistemas.",
      category: "MEIO_AMBIENTE",
      difficulty: "MEDIO",
      questions: [
        {
          order: 1,
          text: "Qual é o principal risco de jogar medicamentos no vaso sanitário?",
          options: JSON.stringify([
            "Entupimento dos canos de esgoto",
            "Contaminação química de rios, lençóis freáticos e organismos aquáticos",
            "Explosão nas estações de tratamento de esgoto",
            "Aumento da conta de água",
          ]),
          correct: 1,
        },
        {
          order: 2,
          text: "Antibióticos presentes na água podem causar qual problema grave?",
          options: JSON.stringify([
            "Aumento da temperatura da água",
            "Desenvolvimento de bactérias resistentes a antibióticos (superbactérias)",
            "Extinção de todos os peixes de água doce",
            "Desertificação do leito dos rios",
          ]),
          correct: 1,
        },
        {
          order: 3,
          text: "Hormônios presentes em medicamentos descartados incorretamente podem afetar:",
          options: JSON.stringify([
            "Apenas o solo agrícola, sem impacto na fauna",
            "A reprodução de peixes e anfíbios, causando feminilização de machos",
            "Exclusivamente humanos que consomem água não tratada",
            "Apenas animais domésticos como cães e gatos",
          ]),
          correct: 1,
        },
        {
          order: 4,
          text: "Por que as estações de tratamento de água convencionais não resolvem o problema dos medicamentos?",
          options: JSON.stringify([
            "Porque o tratamento convencional não é eficiente para remover compostos farmacêuticos",
            "Porque as estações são proibidas de tratar água contaminada por remédios",
            "Porque os medicamentos tornam a água mais limpa no tratamento",
            "Porque o custo do tratamento avançado seria pago pelos cidadãos",
          ]),
          correct: 0,
        },
        {
          order: 5,
          text: "Considerando que uma embalagem típica de medicamentos pesa em média 150g, quantos litros de água podem ser contaminados por descarte incorreto?",
          options: JSON.stringify([
            "Até 10 litros",
            "Até 100 litros",
            "Até 1.000 litros",
            "Centenas de milhares de litros — a contaminação farmacêutica é altamente persistente",
          ]),
          correct: 3,
        },
      ],
    },
  ] as const

  for (const quizData of quizzesData) {
    const { questions, ...quizFields } = quizData
    const existingQuiz = await prisma.quiz.findUnique({ where: { slug: quizFields.slug } })
    if (!existingQuiz) {
      await prisma.quiz.create({
        data: {
          ...quizFields,
          questions: {
            create: questions.map((q) => ({
              order: q.order,
              text: q.text,
              options: q.options,
              correct: q.correct,
            })),
          },
        },
      })
    }
  }
  console.log(`✅ ${quizzesData.length} quizzes criados`)

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
