import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { auth } from "@/../auth"
import { prisma } from "@/lib/db/prisma"
import { creditCoins } from "@/lib/coins"
import { checkRateLimit } from "@/lib/ratelimit"

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

// POST /api/quiz/:id/submit — submete respostas e credita EcoCoins
quiz.post(
  "/:id/submit",
  zValidator("param", z.object({ id: z.string().min(1) })),
  zValidator("json", z.object({ answers: z.array(z.number().int().min(0)) })),
  async (c) => {
    const ip = c.req.header("CF-Connecting-IP") ?? "anon"
    const { success } = await checkRateLimit("map", ip)
    if (!success) return c.json({ error: "Muitas requisições." }, 429)

    const session = await auth()
    if (!session?.user?.id) return c.json({ error: "Não autenticado." }, 401)
    const userId = session.user.id

    const { id } = c.req.valid("param")
    const { answers } = c.req.valid("json")

    const q = await prisma.quiz.findUnique({
      where: { id, active: true },
      include: { questions: { orderBy: { order: "asc" } } },
    })

    if (!q) return c.json({ error: "Quiz não encontrado." }, 404)

    // Calcular pontuação
    const total = q.questions.length
    let score = 0
    for (let i = 0; i < total; i++) {
      if (answers[i] !== undefined && answers[i] === q.questions[i].correct) score++
    }

    const perfect = score === total

    // Creditar EcoCoins (respeita limites diários)
    const event = perfect ? ("QUIZ_PERFECT" as const) : ("QUIZ" as const)
    const coinResult = await creditCoins(userId, event, id)
    const coinsEarned = coinResult.ok ? (perfect ? 10 : 5) : 0

    // Salvar tentativa
    await prisma.quizAttempt.create({
      data: { userId, quizId: id, score, total, perfect, coinsEarned },
    })

    // Retornar respostas corretas para exibir feedback
    const correctAnswers = q.questions.map((quest) => quest.correct)

    return c.json({
      score,
      total,
      perfect,
      coinsEarned,
      limiteDiario: !coinResult.ok,
      correctAnswers,
      newBalance: coinResult.newBalance,
      levelUp: coinResult.levelUp ?? null,
      streakBonus: coinResult.streakBonus ?? null,
    })
  },
)

export default quiz
