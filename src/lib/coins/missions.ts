import { prisma } from "@/lib/db/prisma"
import { creditCoins } from "@/lib/coins"

type MissionPoolItem = {
  slug: string
  title: string
  description: string
  event: string
  target: number
  reward: number
}

const DAILY_POOL: MissionPoolItem[] = [
  {
    slug: "leitor_do_dia",
    title: "Leitor do dia",
    description: "Leia 1 artigo completo",
    event: "ARTICLE_READ",
    target: 1,
    reward: 3,
  },
  {
    slug: "pergunta_do_dia",
    title: "Pergunta do dia",
    description: "Faça 3 perguntas ao EcoBot",
    event: "ECOBOT_QUESTION",
    target: 3,
    reward: 3,
  },
  {
    slug: "quiz_relampago",
    title: "Quiz relâmpago",
    description: "Complete 1 quiz com nota ≥ 70%",
    event: "QUIZ",
    target: 1,
    reward: 5,
  },
  {
    slug: "eco_descarte",
    title: "Eco-descarte",
    description: "Registre 1 descarte",
    event: "CHECKIN",
    target: 1,
    reward: 5,
  },
  {
    slug: "compartilhador",
    title: "Compartilhador",
    description: "Compartilhe 1 conteúdo",
    event: "SHARE_ARTICLE",
    target: 1,
    reward: 3,
  },
  {
    slug: "avaliador",
    title: "Avaliador",
    description: "Avalie 3 respostas do EcoBot",
    event: "ECOBOT_RATING",
    target: 3,
    reward: 3,
  },
]

const WEEKLY_POOL: MissionPoolItem[] = [
  {
    slug: "maratonista",
    title: "Maratonista",
    description: "Leia 5 artigos na semana",
    event: "ARTICLE_READ",
    target: 5,
    reward: 15,
  },
  {
    slug: "descarte_master",
    title: "Descarte Master",
    description: "Registre 3 descartes na semana",
    event: "CHECKIN",
    target: 3,
    reward: 20,
  },
  {
    slug: "sabio",
    title: "Sábio",
    description: "Complete 5 quizzes na semana",
    event: "QUIZ",
    target: 5,
    reward: 15,
  },
  {
    slug: "enciclopedista",
    title: "Enciclopedista",
    description: "Faça 15 perguntas ao EcoBot",
    event: "ECOBOT_QUESTION",
    target: 15,
    reward: 10,
  },
]

const EVENTOS_COM_MISSAO = new Set(
  [...DAILY_POOL, ...WEEKLY_POOL].map((mission) => mission.event),
)

function inicioDiaUTC(): Date {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d
}

function inicioSemanaUTC(): Date {
  const d = inicioDiaUTC()
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
  return d
}

function formatoDataUTC(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function embaralhar<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

async function upsertMissionTemplate(item: MissionPoolItem, type: "DAILY" | "WEEKLY") {
  return prisma.mission.upsert({
    where: { slug: item.slug },
    update: {
      title: item.title,
      description: item.description,
      event: item.event as never,
      targetCount: item.target,
      coinReward: item.reward,
      active: true,
      type: type as never,
    },
    create: {
      slug: item.slug,
      title: item.title,
      description: item.description,
      type: type as never,
      event: item.event as never,
      targetCount: item.target,
      coinReward: item.reward,
      active: true,
    },
  })
}

async function ensureMissionsDiarias(userId: string) {
  const hoje = inicioDiaUTC()
  const amanha = new Date(hoje)
  amanha.setUTCDate(amanha.getUTCDate() + 1)

  const totalDiarias = await prisma.userMission.count({
    where: {
      userId,
      expiresAt: { gte: hoje, lt: amanha },
      mission: { type: "DAILY" },
    },
  })

  if (totalDiarias > 0) return

  const selecionadas = embaralhar(DAILY_POOL).slice(0, 3)
  for (const item of selecionadas) {
    const mission = await upsertMissionTemplate(item, "DAILY")
    await prisma.userMission.upsert({
      where: {
        userId_missionId_expiresAt: {
          userId,
          missionId: mission.id,
          expiresAt: amanha,
        },
      },
      update: {},
      create: {
        userId,
        missionId: mission.id,
        expiresAt: amanha,
        progress: 0,
      },
    })
  }
}

async function ensureMissionsSemanais(userId: string) {
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    select: { level: true },
  })

  if (!wallet || wallet.level === "SEMENTE") return

  const inicioSemana = inicioSemanaUTC()
  const fimSemana = new Date(inicioSemana)
  fimSemana.setUTCDate(fimSemana.getUTCDate() + 7)

  const totalSemanais = await prisma.userMission.count({
    where: {
      userId,
      expiresAt: { gte: inicioSemana, lt: fimSemana },
      mission: { type: "WEEKLY" },
    },
  })

  if (totalSemanais > 0) return

  const selecionadas = embaralhar(WEEKLY_POOL).slice(0, 2)
  for (const item of selecionadas) {
    const mission = await upsertMissionTemplate(item, "WEEKLY")
    await prisma.userMission.upsert({
      where: {
        userId_missionId_expiresAt: {
          userId,
          missionId: mission.id,
          expiresAt: fimSemana,
        },
      },
      update: {},
      create: {
        userId,
        missionId: mission.id,
        expiresAt: fimSemana,
        progress: 0,
      },
    })
  }
}

export async function ensureMissionsAtivas(userId: string) {
  await ensureMissionsDiarias(userId)
  await ensureMissionsSemanais(userId)
}

async function bonusJaConcedido(userId: string, event: "MISSION_DAILY_BONUS" | "MISSION_WEEKLY_BONUS", ref: string) {
  const found = await prisma.coinTransaction.findFirst({
    where: {
      event: event as never,
      reference: ref,
      wallet: { userId },
    },
    select: { id: true },
  })
  return Boolean(found)
}

async function creditoMissaoJaConcedido(userId: string, userMissionId: string) {
  const found = await prisma.coinTransaction.findFirst({
    where: {
      event: "MISSION_COMPLETE",
      reference: userMissionId,
      wallet: { userId },
    },
    select: { id: true },
  })
  return Boolean(found)
}

export async function aplicarProgressoMissoes(userId: string, event: string) {
  if (!EVENTOS_COM_MISSAO.has(event)) {
    return { updated: 0, completed: 0, bonusEarned: 0 }
  }

  await ensureMissionsAtivas(userId)

  const agora = new Date()
  const userMissions = await prisma.userMission.findMany({
    where: {
      userId,
      completed: false,
      expiresAt: { gt: agora },
      mission: {
        active: true,
        event: event as never,
      },
    },
    include: { mission: true },
  })

  if (userMissions.length === 0) {
    return { updated: 0, completed: 0, bonusEarned: 0 }
  }

  let updated = 0
  let completed = 0
  let bonusEarned = 0
  const tiposCompletados = new Set<"DAILY" | "WEEKLY">()

  for (const userMission of userMissions) {
    const nextProgress = Math.min(userMission.progress + 1, userMission.mission.targetCount)
    const completouAgora = nextProgress >= userMission.mission.targetCount

    await prisma.userMission.update({
      where: { id: userMission.id },
      data: {
        progress: nextProgress,
        completed: completouAgora,
        completedAt: completouAgora ? new Date() : null,
      },
    })

    updated += 1

    if (!completouAgora) continue

    completed += 1
    tiposCompletados.add(userMission.mission.type as "DAILY" | "WEEKLY")

    const jaConcedido = await creditoMissaoJaConcedido(userId, userMission.id)
    if (!jaConcedido) {
      await creditCoins(
        userId,
        "MISSION_COMPLETE",
        userMission.id,
        userMission.mission.coinReward,
        `Missão concluída: ${userMission.mission.title}`,
      )
    }
  }

  for (const tipo of tiposCompletados) {
    const hoje = inicioDiaUTC()
    const amanha = new Date(hoje)
    amanha.setUTCDate(amanha.getUTCDate() + 1)

    const inicioSemana = inicioSemanaUTC()
    const fimSemana = new Date(inicioSemana)
    fimSemana.setUTCDate(fimSemana.getUTCDate() + 7)

    const whereRange =
      tipo === "DAILY"
        ? { gte: hoje, lt: amanha }
        : { gte: inicioSemana, lt: fimSemana }

    const [totalMissoes, concluidas] = await Promise.all([
      prisma.userMission.count({
        where: {
          userId,
          mission: { type: tipo },
          expiresAt: whereRange,
        },
      }),
      prisma.userMission.count({
        where: {
          userId,
          mission: { type: tipo },
          expiresAt: whereRange,
          completed: true,
        },
      }),
    ])

    if (totalMissoes === 0 || concluidas < totalMissoes) continue

    const eventBonus = tipo === "DAILY" ? "MISSION_DAILY_BONUS" : "MISSION_WEEKLY_BONUS"
    const reference =
      tipo === "DAILY"
        ? `daily:${formatoDataUTC(hoje)}`
        : `weekly:${formatoDataUTC(inicioSemana)}`

    const jaConcedido = await bonusJaConcedido(userId, eventBonus, reference)
    if (jaConcedido) continue

    const bonusResult = await creditCoins(userId, eventBonus, reference)
    if (bonusResult.ok) bonusEarned += 1
  }

  return { updated, completed, bonusEarned }
}
