import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { auth } from "@/../auth"
import { prisma } from "@/lib/db/prisma"
import { creditCoins } from "@/lib/coins"

const missions = new Hono()

// ---- Pool de missões diárias disponíveis ----
const POOL_DIARIAS = [
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
] as const

// ---- Pool de missões semanais ----
const POOL_SEMANAIS = [
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
] as const

// ---- Helpers de data ----
function diaAtualUTC0(): Date {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d
}

function proximoDia(): Date {
  const d = diaAtualUTC0()
  d.setUTCDate(d.getUTCDate() + 1)
  return d
}

function inicioSemanaUTC0(): Date {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
  return d
}

function fimSemanaUTC0(): Date {
  const d = inicioSemanaUTC0()
  d.setUTCDate(d.getUTCDate() + 7)
  return d
}

// ---- GET /api/missions — retorna missões ativas do usuário ----
missions.get("/", async (c) => {
  const session = await auth()
  if (!session?.user?.id) return c.json({ error: "Não autenticado." }, 401)
  const userId = session.user.id

  const hoje = diaAtualUTC0()
  const amanha = proximoDia()

  // Garantir que o usuário tem exatamente 3 missões diárias ativas para hoje
  const missoesHoje = await prisma.userMission.findMany({
    where: {
      userId,
      expiresAt: { gte: hoje, lt: amanha },
    },
    include: { mission: true },
  })

  if (missoesHoje.length === 0) {
    // Sortear 3 missões aleatórias do pool
    const pool = [...POOL_DIARIAS]
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    const selecionadas = pool.slice(0, 3)

    for (const m of selecionadas) {
      // Garantir que a Mission existe no banco
      const missao = await prisma.mission.upsert({
        where: { slug: m.slug },
        update: {},
        create: {
          slug: m.slug,
          title: m.title,
          description: m.description,
          type: "DAILY",
          event: m.event as never,
          targetCount: m.target,
          coinReward: m.reward,
        },
      })

      await prisma.userMission.upsert({
        where: { userId_missionId_expiresAt: { userId, missionId: missao.id, expiresAt: amanha } },
        update: {},
        create: { userId, missionId: missao.id, expiresAt: amanha, progress: 0 },
      })
    }
  }

  // Buscar missões finais
  const diarias = await prisma.userMission.findMany({
    where: { userId, expiresAt: { gte: hoje, lt: amanha } },
    include: { mission: true },
  })

  // Missões semanais — apenas BROTO+
  const wallet = await prisma.wallet.findUnique({ where: { userId } })
  const podeSemanais = wallet && wallet.level !== "SEMENTE"

  let semanais: typeof diarias = []
  if (podeSemanais) {
    const inicioSemana = inicioSemanaUTC0()
    const fimSemana = fimSemanaUTC0()

    const missoesSemanais = await prisma.userMission.findMany({
      where: {
        userId,
        expiresAt: { gte: inicioSemana, lt: fimSemana },
        mission: { type: "WEEKLY" },
      },
      include: { mission: true },
    })

    if (missoesSemanais.length === 0) {
      const poolS = [...POOL_SEMANAIS]
      for (let i = poolS.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[poolS[i], poolS[j]] = [poolS[j], poolS[i]]
      }
      const selecionadas = poolS.slice(0, 2)

      for (const m of selecionadas) {
        const missao = await prisma.mission.upsert({
          where: { slug: m.slug },
          update: {},
          create: {
            slug: m.slug,
            title: m.title,
            description: m.description,
            type: "WEEKLY",
            event: m.event as never,
            targetCount: m.target,
            coinReward: m.reward,
          },
        })
        await prisma.userMission.upsert({
          where: {
            userId_missionId_expiresAt: { userId, missionId: missao.id, expiresAt: fimSemana },
          },
          update: {},
          create: { userId, missionId: missao.id, expiresAt: fimSemana, progress: 0 },
        })
      }

      semanais = await prisma.userMission.findMany({
        where: {
          userId,
          expiresAt: { gte: inicioSemana, lt: fimSemana },
          mission: { type: "WEEKLY" },
        },
        include: { mission: true },
      })
    } else {
      semanais = missoesSemanais
    }
  }

  const toDto = (um: (typeof diarias)[number]) => ({
    id: um.id,
    missionId: um.missionId,
    slug: um.mission.slug,
    title: um.mission.title,
    description: um.mission.description,
    type: um.mission.type,
    target: um.mission.targetCount,
    progress: um.progress,
    reward: um.mission.coinReward,
    completed: um.completed,
    completedAt: um.completedAt,
    expiresAt: um.expiresAt,
  })

  return c.json({
    daily: diarias.map(toDto),
    weekly: semanais.map(toDto),
    bonusDiario: 10,
    bonusSemanal: 15,
  })
})

// POST /api/missions/:id/progress — incrementa progresso de uma missão
missions.post(
  "/:id/progress",
  zValidator("param", z.object({ id: z.string().cuid() })),
  async (c) => {
    const session = await auth()
    if (!session?.user?.id) return c.json({ error: "Não autenticado." }, 401)
    const userId = session.user.id
    const { id } = c.req.valid("param")

    const userMission = await prisma.userMission.findFirst({
      where: { id, userId },
      include: { mission: true },
    })

    if (!userMission) return c.json({ error: "Missão não encontrada." }, 404)
    if (userMission.completed) return c.json({ ok: true, alreadyCompleted: true })
    if (new Date() > userMission.expiresAt) {
      return c.json({ error: "Missão expirada." }, 410)
    }

    const novoProgress = userMission.progress + 1
    const completou = novoProgress >= userMission.mission.targetCount

    await prisma.userMission.update({
      where: { id },
      data: {
        progress: novoProgress,
        completed: completou,
        completedAt: completou ? new Date() : null,
      },
    })

    let coinsEarned = 0
    let levelUp: string | null = null
    let bonusEarned = false

    if (completou) {
      const result = await creditCoins(
        userId,
        "MISSION_COMPLETE",
        userMission.missionId,
        userMission.mission.coinReward,
      )
      coinsEarned = userMission.mission.coinReward
      levelUp = result.levelUp ?? null

      // Verificar se todas as missões do mesmo tipo foram completadas → bônus
      const hoje = diaAtualUTC0()
      const amanha = proximoDia()
      const tipo = userMission.mission.type
      const expiresRange =
        tipo === "DAILY"
          ? { gte: hoje, lt: amanha }
          : { gte: inicioSemanaUTC0(), lt: fimSemanaUTC0() }

      const todas = await prisma.userMission.findMany({
        where: { userId, expiresAt: expiresRange, mission: { type: tipo } },
      })
      const todasCompletas = todas.every((m) => m.completed || m.id === id)

      if (todasCompletas) {
        const bonusEvent = tipo === "DAILY" ? "MISSION_DAILY_BONUS" : "MISSION_WEEKLY_BONUS"
        await creditCoins(userId, bonusEvent)
        bonusEarned = true
        coinsEarned += tipo === "DAILY" ? 10 : 15
      }
    }

    return c.json({
      ok: true,
      completed: completou,
      progress: novoProgress,
      target: userMission.mission.targetCount,
      coinsEarned,
      bonusEarned,
      levelUp,
    })
  },
)

export default missions
