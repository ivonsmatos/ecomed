import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { auth } from "@/../auth"
import { prisma } from "@/lib/db/prisma"
import { creditCoins, concederBadge } from "@/lib/coins"
import { checkRateLimit } from "@/lib/ratelimit"
import { verifyShuffleMaps } from "@/lib/quiz/shuffle"
import { verificarMilestonesQuiz } from "@/lib/goals/milestones"
import { aplicarProgressoMissoes } from "@/lib/coins/missions"

const QUIZ_DIARIO_MAXIMO = 3

/** Retorna o início do dia UTC (00:00:00.000) */
function diaUTC(): Date {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d
}

const quiz = new Hono()

// GET /api/quiz — lista quizzes ativos com status da tentativa do usuário
quiz.get("/", async (c) => {
  const session = await auth()
  if (!session?.user?.id) return c.json({ error: "Não autenticado." }, 401)
  const userId = session.user.id

  const [quizzes, attempts] = await Promise.all([
    prisma.quiz.findMany({
      where: { active: true },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        category: true,
        difficulty: true,
        level: true,
        levelOrder: true,
        _count: { select: { questions: true } },
      },
      orderBy: [{ level: "asc" }, { levelOrder: "asc" }],
    }),
    prisma.quizAttempt.findMany({
      where: { userId },
      select: { quizId: true, score: true, total: true, perfect: true, coinsEarned: true },
      orderBy: { createdAt: "desc" },
    }),
  ])

  const dto = quizzes.map((q) => {
    const tentativa = attempts.find((a) => a.quizId === q.id) ?? null
    return {
      id: q.id,
      slug: q.slug,
      title: q.title,
      description: q.description,
      category: q.category,
      difficulty: q.difficulty,
      level: q.level,
      levelOrder: q.levelOrder,
      totalQuestions: q._count.questions,
      tentativa,
    }
  })

  return c.json(dto)
})

// GET /api/quiz/:id — retorna quiz com perguntas (sem revelar respostas corretas)
quiz.get("/:id", async (c) => {
  const session = await auth()
  if (!session?.user?.id) return c.json({ error: "Não autenticado." }, 401)
  const { id } = c.req.param()

  const q = await prisma.quiz.findUnique({
    where: { id, active: true },
    include: {
      questions: {
        orderBy: { order: "asc" },
        select: { id: true, order: true, text: true, options: true },
      },
    },
  })

  if (!q) return c.json({ error: "Quiz não encontrado." }, 404)

  return c.json({
    id: q.id,
    slug: q.slug,
    title: q.title,
    description: q.description,
    category: q.category,
    difficulty: q.difficulty,
    questions: q.questions.map((quest) => ({
      id: quest.id,
      order: quest.order,
      text: quest.text,
      options: JSON.parse(quest.options) as string[],
    })),
  })
})

// POST /api/quiz/:id/submit — submete respostas e credita EcoCoins apenas se perfeito
quiz.post(
  "/:id/submit",
  zValidator("param", z.object({ id: z.string().min(1) })),
  zValidator("json", z.object({
    answers: z.array(z.number().int().min(0)),
    shuffleToken: z.string().optional(),
  })),
  async (c) => {
    const ip = c.req.header("CF-Connecting-IP") ?? "anon"
    const { success } = await checkRateLimit("map", ip)
    if (!success) return c.json({ error: "Muitas requisições." }, 429)

    const session = await auth()
    if (!session?.user?.id) return c.json({ error: "Não autenticado." }, 401)
    const userId = session.user.id

    const { id } = c.req.valid("param")
    const { answers, shuffleToken } = c.req.valid("json")

    // Decodificar token de embaralhamento (stateless, signed HMAC)
    // Se presente e válido: converter respostas do índice embaralhado → índice original
    const shuffleMaps = shuffleToken ? verifyShuffleMaps(shuffleToken, id) : null

    // ── Hard limit: máximo QUIZ_DIARIO_MAXIMO tentativas por dia ──────────────
    const hoje = diaUTC()
    const amanha = new Date(hoje)
    amanha.setUTCDate(amanha.getUTCDate() + 1)

    const totalHoje = await prisma.quizAttempt.count({
      where: { userId, createdAt: { gte: hoje, lt: amanha } },
    })

    if (totalHoje >= QUIZ_DIARIO_MAXIMO) {
      return c.json(
        { error: `Limite de ${QUIZ_DIARIO_MAXIMO} quizzes por dia atingido. Volte amanhã!` },
        429,
      )
    }

    const q = await prisma.quiz.findUnique({
      where: { id, active: true },
      include: { questions: { orderBy: { order: "asc" } } },
    })

    if (!q) return c.json({ error: "Quiz não encontrado." }, 404)

    // ── Calcular pontuação ─────────────────────────────────────────────────────
    const total = q.questions.length
    let score = 0
    for (let i = 0; i < total; i++) {
      // Se shuffleToken válido: converter índice embaralhado → original antes de comparar
      const rawAnswer = answers[i]
      const originalAnswer =
        shuffleMaps && shuffleMaps[i] && rawAnswer !== undefined
          ? shuffleMaps[i][rawAnswer]
          : rawAnswer
      if (originalAnswer !== undefined && originalAnswer === q.questions[i].correct) score++
    }

    const perfect = score === total
    const quizAprovado = total > 0 && score / total >= 0.7

    // ── Creditar EcoCoins APENAS se resposta perfeita (100%) ─────────────────
    // Respostas erradas (mesmo parcialmente corretas) não geram coins.
    let coinResult: Awaited<ReturnType<typeof creditCoins>> = { ok: false, newBalance: 0 }
    if (perfect) {
      coinResult = await creditCoins(userId, "QUIZ_PERFECT", id, undefined, `Quiz perfeito: ${q.title}`)
    }
    const coinsEarned = coinResult.ok ? 10 : 0

    // ── Salvar tentativa ───────────────────────────────────────────────────────
    await prisma.quizAttempt.create({
      data: { userId, quizId: id, score, total, perfect, coinsEarned },
    })

    if (quizAprovado) {
      await aplicarProgressoMissoes(userId, "QUIZ").catch(() => null)
    }

    // ── Badge de nível: conceder ao completar TODOS os quizzes do nível com 100% ──
    let levelBadgeEarned = false
    let levelBadgeSlug: string | null = null

    if (perfect) {
      const quizzesDoNivel = await prisma.quiz.findMany({
        where: { level: q.level, active: true },
        select: { id: true },
      })

      // Quizzes do nível com pelo menos uma tentativa perfeita do usuário
      const niveisPerfeitos = await prisma.quizAttempt.findMany({
        where: {
          userId,
          quizId: { in: quizzesDoNivel.map((qz) => qz.id) },
          perfect: true,
        },
        select: { quizId: true },
        distinct: ["quizId"],
      })

      // Incluir o quiz atual (acabou de ser salvo como perfeito)
      const completedIds = new Set([...niveisPerfeitos.map((a) => a.quizId), id])

      if (completedIds.size >= quizzesDoNivel.length && quizzesDoNivel.length > 0) {
        const slug = `quiz-nivel-${q.level}`
        const earned = await concederBadge(userId, slug)
        if (earned) {
          levelBadgeEarned = true
          levelBadgeSlug = slug
        }
      }
    }

    // ── Retornar feedback completo ─────────────────────────────────────────────
    // correctAnswers: retorna os índices no espaço em que o cliente viu as opções
    // (embaralhado se shuffleMaps presente, original caso contrário)
    const correctAnswers = q.questions.map((quest, i) => {
      if (shuffleMaps && shuffleMaps[i]) {
        // Índice embaralhado da resposta certa = posição de quest.correct no mapa
        return shuffleMaps[i].indexOf(quest.correct)
      }
      return quest.correct
    })

    // ── Verificar milestones de quiz (fire-and-forget) ───────────────────────
    const novosSelosQuiz = await verificarMilestonesQuiz(userId, perfect).catch(() => [] as string[])

    return c.json({
      score,
      total,
      perfect,
      coinsEarned,
      // limiteDiario=true apenas quando não ganhou coins por ser perfeito mas atingiu o limite
      // (perfeito mas limite = ainda aparece como perfeito, sem coins)
      limiteDiario: perfect && !coinResult.ok,
      correctAnswers,
      newBalance: coinResult.newBalance,
      levelUp: coinResult.levelUp ?? null,
      streakBonus: coinResult.streakBonus ?? null,
      levelBadgeEarned,
      levelBadgeSlug,
      quizLevel: q.level,
      novosSelosQuiz,
    })
  },
)

export default quiz
