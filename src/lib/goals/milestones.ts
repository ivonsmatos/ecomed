/**
 * Sistema de metas e medalhas estilo Apple Fitness para o EcoMed.
 *
 * Cada função verifica se o usuário atingiu marcos acumulados e concede
 * o badge correspondente via concederBadge() (idempotente).
 *
 * Categorias:
 *  - Descarte acumulado: 1, 5, 10, 25, 50, 100, 365, 500, 1000 check-ins
 *  - Diversidade de pontos: 5, 10, 25 pontos diferentes visitados
 *  - Quizzes completados (qualquer nota): 10, 25, 50
 *  - Quizzes perfeitos (100%): 10, 25
 */

import { prisma } from "@/lib/db/prisma"
import { concederBadge } from "@/lib/coins"

// ── Marcos por categoria ──────────────────────────────────────────────────────

const DESCARTE_MARCOS = [1, 5, 10, 25, 50, 100, 365, 500, 1000] as const
const PONTOS_MARCOS   = [5, 10, 25] as const
const QUIZ_FEITOS_MARCOS   = [10, 25, 50] as const
const QUIZ_PERFEITOS_MARCOS = [10, 25] as const

// ── Verificação dos marcos de check-in (chamada após cada check-in) ───────────

export async function verificarMilestonesDescarte(userId: string): Promise<string[]> {
  const ganhos: string[] = []

  // 1. Total de check-ins do usuário
  const totalCheckins = await prisma.checkin.count({ where: { userId } })

  for (const n of DESCARTE_MARCOS) {
    if (totalCheckins >= n) {
      const earned = await concederBadge(userId, `descarte-${n}`)
      if (earned) ganhos.push(`descarte-${n}`)
    }
  }

  // 2. Número de pontos distintos visitados
  const pontosDistintos = await prisma.checkin.findMany({
    where: { userId },
    select: { pointId: true },
    distinct: ["pointId"],
  })
  const totalPontos = pontosDistintos.length

  for (const n of PONTOS_MARCOS) {
    if (totalPontos >= n) {
      const earned = await concederBadge(userId, `pontos-${n}`)
      if (earned) ganhos.push(`pontos-${n}`)
    }
  }

  return ganhos
}

// ── Verificação dos marcos de quiz (chamada após cada submissão) ──────────────

export async function verificarMilestonesQuiz(
  userId: string,
  foiPerfeito: boolean,
): Promise<string[]> {
  const ganhos: string[] = []

  // 3. Total de quizzes completados (qualquer nota)
  const totalFeitos = await prisma.quizAttempt.count({ where: { userId } })

  for (const n of QUIZ_FEITOS_MARCOS) {
    if (totalFeitos >= n) {
      const earned = await concederBadge(userId, `quiz-${n}-feitos`)
      if (earned) ganhos.push(`quiz-${n}-feitos`)
    }
  }

  // 4. Total de quizzes com nota perfeita (só verifica se o atual foi perfeito)
  if (foiPerfeito) {
    const totalPerfeitos = await prisma.quizAttempt.count({
      where: { userId, perfect: true },
    })

    for (const n of QUIZ_PERFEITOS_MARCOS) {
      if (totalPerfeitos >= n) {
        const earned = await concederBadge(userId, `quiz-${n}-perfeitos`)
        if (earned) ganhos.push(`quiz-${n}-perfeitos`)
      }
    }
  }

  return ganhos
}

// ── Consulta de progresso para a página de Conquistas ────────────────────────

export interface ProgressoMilestones {
  totalCheckins:   number
  totalPontos:     number
  totalQuizFeitos: number
  totalQuizPerfeitos: number
}

export async function buscarProgressoMilestones(userId: string): Promise<ProgressoMilestones> {
  const [totalCheckins, pontosDistintos, totalQuizFeitos, totalQuizPerfeitos] = await Promise.all([
    prisma.checkin.count({ where: { userId } }),
    prisma.checkin.findMany({
      where: { userId },
      select: { pointId: true },
      distinct: ["pointId"],
    }),
    prisma.quizAttempt.count({ where: { userId } }),
    prisma.quizAttempt.count({ where: { userId, perfect: true } }),
  ])

  return {
    totalCheckins,
    totalPontos: pontosDistintos.length,
    totalQuizFeitos,
    totalQuizPerfeitos,
  }
}

// ── Metadados públicos dos grupos de metas (para a página de Conquistas) ─────

export const GRUPOS_METAS = [
  {
    id: "descarte",
    titulo: "Descartes de Medicamentos",
    emoji: "💊",
    descricao: "Pontos de coleta visitados acumulados",
    marcos: DESCARTE_MARCOS.map((n) => ({
      n,
      slug: `descarte-${n}`,
      label: n >= 1000 ? `${(n / 1000).toFixed(0)}.000 Descartes` : `${n} Descarte${n > 1 ? "s" : ""}`,
    })),
    progressoKey: "totalCheckins" as keyof ProgressoMilestones,
  },
  {
    id: "pontos",
    titulo: "Pontos Diferentes Visitados",
    emoji: "📍",
    descricao: "Diversidade de locais de coleta",
    marcos: PONTOS_MARCOS.map((n) => ({
      n,
      slug: `pontos-${n}`,
      label: `${n} Pontos`,
    })),
    progressoKey: "totalPontos" as keyof ProgressoMilestones,
  },
  {
    id: "quiz-feitos",
    titulo: "Quizzes Completados",
    emoji: "📚",
    descricao: "Total de quizzes realizados",
    marcos: QUIZ_FEITOS_MARCOS.map((n) => ({
      n,
      slug: `quiz-${n}-feitos`,
      label: `${n} Quizzes`,
    })),
    progressoKey: "totalQuizFeitos" as keyof ProgressoMilestones,
  },
  {
    id: "quiz-perfeitos",
    titulo: "Notas Perfeitas (100%)",
    emoji: "🏆",
    descricao: "Quizzes respondidos com 100% de acertos",
    marcos: QUIZ_PERFEITOS_MARCOS.map((n) => ({
      n,
      slug: `quiz-${n}-perfeitos`,
      label: `${n} Perfeitos`,
    })),
    progressoKey: "totalQuizPerfeitos" as keyof ProgressoMilestones,
  },
] as const
