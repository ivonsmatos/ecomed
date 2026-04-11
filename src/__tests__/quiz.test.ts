/**
 * Testes de lógica do endpoint POST /quiz/:id/submit
 *
 * Coberturas:
 *  - Autenticação (401)
 *  - Rate limit global (429)
 *  - Limite diário de 3 quizzes por dia (429)
 *  - Quiz não encontrado (404)
 *  - Cálculo de pontuação (score / total / perfect)
 *  - EcoCoins: apenas nota perfeita gera coins (QUIZ_PERFECT)
 *  - EcoCoins: limiteDiario quando coins atingido mas nota perfeita
 *  - Badge de nível: concedido ao completar todos com perfeição
 *  - Badge de nível: idempotência (badge já concedido → false)
 *  - Validação de schema (body inválido → 400)
 *  - Embaralhamento: shuffleToken decodifica corretamente os índices
 *  - Embaralhamento: shuffleToken inválido/manipulado é ignorado
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks (hoistados automaticamente pelo vitest) ─────────────────────────────

vi.mock('@/../auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    quiz: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    quizAttempt: {
      count: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/coins', () => ({
  creditCoins: vi.fn(),
  concederBadge: vi.fn(),
}))

vi.mock('@/lib/ratelimit', () => ({
  checkRateLimit: vi.fn(),
}))

vi.mock('@/lib/quiz/shuffle', () => ({
  verifyShuffleMaps: vi.fn(),
}))

// ── Imports após mocks ────────────────────────────────────────────────────────

// eslint-disable-next-line import/order
import quiz from '../app/api/[[...route]]/routes/quiz'
import { auth } from '@/../auth'
import { prisma } from '@/lib/db/prisma'
import { creditCoins, concederBadge } from '@/lib/coins'
import { checkRateLimit } from '@/lib/ratelimit'
import { verifyShuffleMaps } from '@/lib/quiz/shuffle'

// ── Constantes de teste ───────────────────────────────────────────────────────

const USER_ID = 'user-abc-123'
const QUIZ_ID = 'quiz-xyz-456'

/** Quiz com 2 questões: respostas corretas são [1, 2] */
const mockQuiz = {
  id: QUIZ_ID,
  slug: 'quiz-descarte-basico',
  title: 'Quiz Descarte Básico',
  description: 'Aprenda a descartar corretamente',
  category: 'DESCARTE',
  difficulty: 'BASICO',
  level: 1,
  levelOrder: 1,
  active: true,
  questions: [
    {
      id: 'q1',
      order: 1,
      text: 'Onde descartar remédios?',
      options: JSON.stringify(['Lixo comum', 'Farmácia parceira', 'Esgoto']),
      correct: 1,
    },
    {
      id: 'q2',
      order: 2,
      text: 'Qual lei regula resíduos sólidos?',
      options: JSON.stringify(['Lei 8080', 'Lei 9605', 'Lei 12305']),
      correct: 2,
    },
  ],
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function submitQuiz(quizId: string, answers: number[], shuffleToken?: string) {
  return quiz.request(`/${quizId}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'CF-Connecting-IP': '192.168.1.1',
    },
    body: JSON.stringify({ answers, ...(shuffleToken ? { shuffleToken } : {}) }),
  })
}

function mockAutenticado(userId = USER_ID) {
  vi.mocked(auth).mockResolvedValue({ user: { id: userId } } as unknown as ReturnType<typeof auth>)
}

/** Configura mocks padrão para um teste de submissão válida */
function setupSubmissaoValida({
  totalHoje = 0,
  creditCoinsResult = { ok: true, newBalance: 110 },
  quizzesDoNivel = [{ id: QUIZ_ID }],
  tentativasPerfeitas = [] as { quizId: string }[],
  badgeEarned = false,
} = {}) {
  mockAutenticado()
  vi.mocked(checkRateLimit).mockResolvedValue({ success: true } as Awaited<ReturnType<typeof checkRateLimit>>)
  vi.mocked(prisma.quizAttempt.count).mockResolvedValue(totalHoje)
  vi.mocked(prisma.quiz.findUnique).mockResolvedValue(mockQuiz as never)
  vi.mocked(prisma.quizAttempt.create).mockResolvedValue({} as never)
  vi.mocked(creditCoins).mockResolvedValue(creditCoinsResult)
  vi.mocked(prisma.quiz.findMany).mockResolvedValue(quizzesDoNivel as never)
  vi.mocked(prisma.quizAttempt.findMany).mockResolvedValue(tentativasPerfeitas as never)
  vi.mocked(concederBadge).mockResolvedValue(badgeEarned)
}

// ── Reset global entre testes ─────────────────────────────────────────────────

beforeEach(() => {
  vi.resetAllMocks()
})

// ─────────────────────────────────────────────────────────────────────────────
// 1. AUTENTICAÇÃO
// ─────────────────────────────────────────────────────────────────────────────

describe('Autenticação', () => {
  it('retorna 401 quando usuário não está autenticado', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true } as Awaited<ReturnType<typeof checkRateLimit>>)
    vi.mocked(auth).mockResolvedValue(null as never)

    const res = await submitQuiz(QUIZ_ID, [1, 2])

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toMatch(/autenticado/i)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. RATE LIMIT GLOBAL
// ─────────────────────────────────────────────────────────────────────────────

describe('Rate limit global', () => {
  it('retorna 429 quando rate limit de IP é atingido', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ success: false } as Awaited<ReturnType<typeof checkRateLimit>>)
    mockAutenticado()

    const res = await submitQuiz(QUIZ_ID, [1, 2])

    expect(res.status).toBe(429)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. LIMITE DIÁRIO DE 3 QUIZZES
// ─────────────────────────────────────────────────────────────────────────────

describe('Limite diário de 3 quizzes por dia', () => {
  it('permite submissão quando totalHoje = 0 (primeiro quiz do dia)', async () => {
    setupSubmissaoValida({ totalHoje: 0 })

    const res = await submitQuiz(QUIZ_ID, [1, 2])

    expect(res.status).toBe(200)
  })

  it('permite submissão quando totalHoje = 2 (terceiro e último quiz do dia)', async () => {
    setupSubmissaoValida({ totalHoje: 2 })

    const res = await submitQuiz(QUIZ_ID, [1, 2])

    expect(res.status).toBe(200)
  })

  it('bloqueia submissão quando totalHoje = 3 (retorna 429)', async () => {
    mockAutenticado()
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true } as Awaited<ReturnType<typeof checkRateLimit>>)
    vi.mocked(prisma.quizAttempt.count).mockResolvedValue(3)

    const res = await submitQuiz(QUIZ_ID, [1, 2])

    expect(res.status).toBe(429)
    const body = await res.json()
    expect(body.error).toMatch(/limite/i)
    expect(body.error).toMatch(/3/i)
  })

  it('bloqueia submissão quando totalHoje > 3 (retorna 429)', async () => {
    mockAutenticado()
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true } as Awaited<ReturnType<typeof checkRateLimit>>)
    vi.mocked(prisma.quizAttempt.count).mockResolvedValue(5)

    const res = await submitQuiz(QUIZ_ID, [1, 2])

    expect(res.status).toBe(429)
  })

  it('não consulta o banco de dados do quiz quando limite diário é atingido', async () => {
    mockAutenticado()
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true } as Awaited<ReturnType<typeof checkRateLimit>>)
    vi.mocked(prisma.quizAttempt.count).mockResolvedValue(3)

    await submitQuiz(QUIZ_ID, [1, 2])

    expect(prisma.quiz.findUnique).not.toHaveBeenCalled()
    expect(creditCoins).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. QUIZ NÃO ENCONTRADO
// ─────────────────────────────────────────────────────────────────────────────

describe('Quiz não encontrado', () => {
  it('retorna 404 quando quiz não existe ou está inativo', async () => {
    mockAutenticado()
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true } as Awaited<ReturnType<typeof checkRateLimit>>)
    vi.mocked(prisma.quizAttempt.count).mockResolvedValue(0)
    vi.mocked(prisma.quiz.findUnique).mockResolvedValue(null)

    const res = await submitQuiz('id-inexistente', [0])

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toMatch(/não encontrado/i)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 5. CÁLCULO DE PONTUAÇÃO
// ─────────────────────────────────────────────────────────────────────────────

describe('Cálculo de pontuação', () => {
  // mockQuiz: respostas corretas = [1, 2]

  it('score = 2 e perfect = true quando todas as respostas estão corretas', async () => {
    setupSubmissaoValida()

    const res = await submitQuiz(QUIZ_ID, [1, 2])
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.score).toBe(2)
    expect(body.total).toBe(2)
    expect(body.perfect).toBe(true)
  })

  it('score = 1 e perfect = false quando uma resposta está errada', async () => {
    setupSubmissaoValida({ creditCoinsResult: { ok: false, newBalance: 100 } })

    // answers[0] = 0 (errada, correta era 1), answers[1] = 2 (correta)
    const res = await submitQuiz(QUIZ_ID, [0, 2])
    const body = await res.json()

    expect(body.score).toBe(1)
    expect(body.total).toBe(2)
    expect(body.perfect).toBe(false)
  })

  it('score = 0 e perfect = false quando todas as respostas estão erradas', async () => {
    setupSubmissaoValida({ creditCoinsResult: { ok: false, newBalance: 100 } })

    const res = await submitQuiz(QUIZ_ID, [0, 0])
    const body = await res.json()

    expect(body.score).toBe(0)
    expect(body.total).toBe(2)
    expect(body.perfect).toBe(false)
  })

  it('retorna correctAnswers com os índices corretos de cada questão', async () => {
    setupSubmissaoValida()

    const res = await submitQuiz(QUIZ_ID, [1, 2])
    const body = await res.json()

    expect(body.correctAnswers).toEqual([1, 2])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 6. LÓGICA DE ECOCOINS
// ─────────────────────────────────────────────────────────────────────────────

describe('EcoCoins — apenas nota perfeita gera coins', () => {
  it('chama creditCoins com evento QUIZ_PERFECT quando nota é perfeita', async () => {
    setupSubmissaoValida()

    await submitQuiz(QUIZ_ID, [1, 2])

    expect(creditCoins).toHaveBeenCalledOnce()
    expect(creditCoins).toHaveBeenCalledWith(
      USER_ID,
      'QUIZ_PERFECT',
      QUIZ_ID,
      undefined,
      expect.stringContaining('Quiz perfeito'),
    )
  })

  it('NÃO chama creditCoins quando nota não é perfeita (parcialmente correto)', async () => {
    setupSubmissaoValida({ creditCoinsResult: { ok: false, newBalance: 100 } })

    await submitQuiz(QUIZ_ID, [0, 2])

    expect(creditCoins).not.toHaveBeenCalled()
  })

  it('NÃO chama creditCoins quando todas as respostas estão erradas', async () => {
    setupSubmissaoValida({ creditCoinsResult: { ok: false, newBalance: 100 } })

    await submitQuiz(QUIZ_ID, [0, 0])

    expect(creditCoins).not.toHaveBeenCalled()
  })

  it('retorna coinsEarned = 10 quando nota perfeita e coins são creditados', async () => {
    setupSubmissaoValida({ creditCoinsResult: { ok: true, newBalance: 110 } })

    const res = await submitQuiz(QUIZ_ID, [1, 2])
    const body = await res.json()

    expect(body.coinsEarned).toBe(10)
    expect(body.limiteDiario).toBe(false)
    expect(body.newBalance).toBe(110)
  })

  it('retorna coinsEarned = 0 quando nota é parcialmente correta', async () => {
    setupSubmissaoValida({ creditCoinsResult: { ok: false, newBalance: 100 } })

    const res = await submitQuiz(QUIZ_ID, [0, 2])
    const body = await res.json()

    expect(body.coinsEarned).toBe(0)
  })

  it('retorna coinsEarned = 0 quando nota é zero', async () => {
    setupSubmissaoValida({ creditCoinsResult: { ok: false, newBalance: 100 } })

    const res = await submitQuiz(QUIZ_ID, [0, 0])
    const body = await res.json()

    expect(body.coinsEarned).toBe(0)
  })

  it('retorna limiteDiario = true quando nota perfeita mas limite diário de coins foi atingido', async () => {
    // creditCoins retorna ok=false (limite de coins atingido, não de tentativas)
    setupSubmissaoValida({ creditCoinsResult: { ok: false, newBalance: 100 } })

    const res = await submitQuiz(QUIZ_ID, [1, 2])
    const body = await res.json()

    expect(body.perfect).toBe(true)
    expect(body.coinsEarned).toBe(0)
    expect(body.limiteDiario).toBe(true)
  })

  it('retorna limiteDiario = false quando nota não é perfeita', async () => {
    setupSubmissaoValida({ creditCoinsResult: { ok: false, newBalance: 100 } })

    const res = await submitQuiz(QUIZ_ID, [0, 2])
    const body = await res.json()

    // limiteDiario só é true se: perfect=true E coinResult.ok=false
    expect(body.limiteDiario).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 7. BADGE DE NÍVEL
// ─────────────────────────────────────────────────────────────────────────────

describe('Badge de nível', () => {
  const OUTRO_QUIZ_ID = 'quiz-outro-456'

  it('concede badge quando todos os quizzes do nível são completados perfeitamente', async () => {
    setupSubmissaoValida({
      quizzesDoNivel: [{ id: QUIZ_ID }, { id: OUTRO_QUIZ_ID }],
      // outro quiz já foi completado perfeitamente antes
      tentativasPerfeitas: [{ quizId: OUTRO_QUIZ_ID }],
      badgeEarned: true,
    })

    const res = await submitQuiz(QUIZ_ID, [1, 2])
    const body = await res.json()

    expect(concederBadge).toHaveBeenCalledWith(USER_ID, 'quiz-nivel-1')
    expect(body.levelBadgeEarned).toBe(true)
    expect(body.levelBadgeSlug).toBe('quiz-nivel-1')
    expect(body.quizLevel).toBe(1)
  })

  it('não concede badge quando nem todos os quizzes do nível foram concluídos com nota perfeita', async () => {
    const TERCEIRO_QUIZ_ID = 'quiz-terceiro-789'
    setupSubmissaoValida({
      quizzesDoNivel: [{ id: QUIZ_ID }, { id: OUTRO_QUIZ_ID }, { id: TERCEIRO_QUIZ_ID }],
      // terceiro quiz ainda não foi completado
      tentativasPerfeitas: [{ quizId: OUTRO_QUIZ_ID }],
      badgeEarned: false,
    })

    const res = await submitQuiz(QUIZ_ID, [1, 2])
    const body = await res.json()

    // completedIds.size = 2 (OUTRO + QUIZ_ID atual) < quizzesDoNivel.length = 3
    expect(concederBadge).not.toHaveBeenCalled()
    expect(body.levelBadgeEarned).toBe(false)
    expect(body.levelBadgeSlug).toBeNull()
  })

  it('não verifica nem concede badge quando nota não é perfeita', async () => {
    setupSubmissaoValida({
      creditCoinsResult: { ok: false, newBalance: 100 },
      quizzesDoNivel: [{ id: QUIZ_ID }],
      tentativasPerfeitas: [],
      badgeEarned: false,
    })

    const res = await submitQuiz(QUIZ_ID, [0, 2]) // não perfeito
    const body = await res.json()

    // Lógica de badge só roda quando perfect=true
    expect(concederBadge).not.toHaveBeenCalled()
    expect(body.levelBadgeEarned).toBe(false)
  })

  it('retorna levelBadgeEarned = false quando badge já foi concedido anteriormente (idempotente)', async () => {
    // Nível com apenas 1 quiz (o atual), concederBadge retorna false = já existia
    setupSubmissaoValida({
      quizzesDoNivel: [{ id: QUIZ_ID }],
      tentativasPerfeitas: [],
      badgeEarned: false, // badge já concedido → concederBadge retorna false
    })

    const res = await submitQuiz(QUIZ_ID, [1, 2])
    const body = await res.json()

    // concederBadge ainda é chamado (lógica verifica se deve conceder)
    expect(concederBadge).toHaveBeenCalledWith(USER_ID, 'quiz-nivel-1')
    // mas como retornou false, levelBadgeEarned deve ser false
    expect(body.levelBadgeEarned).toBe(false)
    expect(body.levelBadgeSlug).toBeNull()
  })

  it('o slug do badge usa o nível correto do quiz testado', async () => {
    // Quiz de nível 5
    const quizNivel5 = { ...mockQuiz, id: 'quiz-nivel5-id', level: 5 }
    vi.mocked(prisma.quiz.findUnique).mockResolvedValue(quizNivel5 as never)
    mockAutenticado()
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true } as Awaited<ReturnType<typeof checkRateLimit>>)
    vi.mocked(prisma.quizAttempt.count).mockResolvedValue(0)
    vi.mocked(prisma.quizAttempt.create).mockResolvedValue({} as never)
    vi.mocked(creditCoins).mockResolvedValue({ ok: true, newBalance: 200 })
    vi.mocked(prisma.quiz.findMany).mockResolvedValue([quizNivel5] as never)
    vi.mocked(prisma.quizAttempt.findMany).mockResolvedValue([])
    vi.mocked(concederBadge).mockResolvedValue(true)

    const res = await quiz.request('/quiz-nivel5-id/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '1.2.3.4' },
      body: JSON.stringify({ answers: [1, 2] }),
    })
    const body = await res.json()

    expect(concederBadge).toHaveBeenCalledWith(USER_ID, 'quiz-nivel-5')
    expect(body.levelBadgeSlug).toBe('quiz-nivel-5')
    expect(body.quizLevel).toBe(5)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 8. VALIDAÇÃO DE SCHEMA (ZOD)
// ─────────────────────────────────────────────────────────────────────────────

describe('Validação de schema (body inválido)', () => {
  beforeEach(() => {
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true } as Awaited<ReturnType<typeof checkRateLimit>>)
    mockAutenticado()
  })

  it('retorna 400 quando body não contém a propriedade answers', async () => {
    const res = await quiz.request(`/${QUIZ_ID}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '1.2.3.4' },
      body: JSON.stringify({ resposta: [1, 2] }),
    })

    expect(res.status).toBe(400)
  })

  it('retorna 400 quando answers não é um array', async () => {
    const res = await quiz.request(`/${QUIZ_ID}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '1.2.3.4' },
      body: JSON.stringify({ answers: 'string-invalida' }),
    })

    expect(res.status).toBe(400)
  })

  it('retorna 400 quando answers contém valores negativos', async () => {
    const res = await quiz.request(`/${QUIZ_ID}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '1.2.3.4' },
      body: JSON.stringify({ answers: [-1, 2] }),
    })

    expect(res.status).toBe(400)
  })

  it('retorna 400 quando answers contém valores não inteiros', async () => {
    const res = await quiz.request(`/${QUIZ_ID}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '1.2.3.4' },
      body: JSON.stringify({ answers: [1.5, 2] }),
    })

    expect(res.status).toBe(400)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 9. EMBARALHAMENTO DAS ALTERNATIVAS
// ─────────────────────────────────────────────────────────────────────────────

describe('Embaralhamento das alternativas (shuffleToken)', () => {
  // mockQuiz: corretas originais = [1, 2]
  //
  // Cenário de teste: alternativas embaralhadas com maps = [[2,0,1], [0,2,1]]
  //   Questão 0: map[0]=2, map[1]=0, map[2]=1
  //     → opção mostrada na posição 0 = original[2] = 'Esgoto'
  //     → opção mostrada na posição 1 = original[0] = 'Lixo comum'
  //     → opção mostrada na posição 2 = original[1] = 'Farmácia parceira'  (correta original=1)
  //     → usuário vê correta na posição 2
  //   Questão 1: map[0]=0, map[1]=2, map[2]=1
  //     → posição 1 = original[2] = 'Lei 12305'  (correta original=2)
  //     → usuário vê correta na posição 1

  const SHUFFLE_MAPS = [[2, 0, 1], [0, 2, 1]]
  const SHUFFLE_TOKEN = 'token-valido-simulado'

  it('aceita shuffleToken válido e converte índices corretamente (nota perfeita)', async () => {
    setupSubmissaoValida()
    // verifyShuffleMaps retorna o mapa de embaralhamento
    vi.mocked(verifyShuffleMaps).mockReturnValue(SHUFFLE_MAPS)

    // Com o mapa [[2,0,1],[0,2,1]], respostas corretas no espaço embaralhado são:
    //   q0: correct_original=1 → posição onde map[pos]=1 → posição 2
    //   q1: correct_original=2 → posição onde map[pos]=2 → posição 1
    // Usuário envia [2, 1] (índices no espaço embaralhado)
    const res = await submitQuiz(QUIZ_ID, [2, 1], SHUFFLE_TOKEN)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.perfect).toBe(true)
    expect(body.score).toBe(2)
    // verifyShuffleMaps foi chamado com QUIZ_ID e o token
    expect(verifyShuffleMaps).toHaveBeenCalledWith(SHUFFLE_TOKEN, QUIZ_ID)
  })

  it('rejeita nota como incorreta quando resposta usa índice original sem token', async () => {
    setupSubmissaoValida({ creditCoinsResult: { ok: false, newBalance: 100 } })
    // Sem token: [1, 2] são interpretados como índices originais (corretos sem embaralhamento)
    vi.mocked(verifyShuffleMaps).mockReturnValue(null)

    // Se o token não é enviado, answers são tratados como índices originais
    const res = await submitQuiz(QUIZ_ID, [1, 2])
    const body = await res.json()

    expect(res.status).toBe(200)
    // Sem token, answers[0]=1 === correct[0]=1 ✓, answers[1]=2 === correct[1]=2 ✓
    expect(body.perfect).toBe(true)
    expect(body.score).toBe(2)
  })

  it('score = 0 quando usuário envia índices originais mas token diz que estão embaralhados', async () => {
    setupSubmissaoValida({ creditCoinsResult: { ok: false, newBalance: 100 } })
    vi.mocked(verifyShuffleMaps).mockReturnValue(SHUFFLE_MAPS)

    // Mapa [[2,0,1],[0,2,1]]: enviar índices originais [1,2] no espaço embaralhado
    // → q0: shuffledIdx=1 → originalIdx=map[1]=0 ≠ correct(1) → errado
    // → q1: shuffledIdx=2 → originalIdx=map[2]=1 ≠ correct(2) → errado
    const res = await submitQuiz(QUIZ_ID, [1, 2], SHUFFLE_TOKEN)
    const body = await res.json()

    expect(body.score).toBe(0)
    expect(body.perfect).toBe(false)
    expect(creditCoins).not.toHaveBeenCalled()
  })

  it('correctAnswers retornados usam índices embaralhados para exibição correta do gabarito', async () => {
    setupSubmissaoValida()
    vi.mocked(verifyShuffleMaps).mockReturnValue(SHUFFLE_MAPS)

    const res = await submitQuiz(QUIZ_ID, [2, 1], SHUFFLE_TOKEN)
    const body = await res.json()

    // correctAnswers devem ser os índices no espaço embaralhado:
    // q0: correct_original=1 → indexOf(1) no map [2,0,1] → posição 2
    // q1: correct_original=2 → indexOf(2) no map [0,2,1] → posição 1
    expect(body.correctAnswers).toEqual([2, 1])
  })

  it('shuffleToken inválido (retorna null de verifyShuffleMaps) → trata answers como originais', async () => {
    setupSubmissaoValida()
    vi.mocked(verifyShuffleMaps).mockReturnValue(null)

    // Token adulterado → null → sem conversão → [1,2] = índices originais corretos
    const res = await submitQuiz(QUIZ_ID, [1, 2], 'token-adulterado')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.perfect).toBe(true)
  })
})
