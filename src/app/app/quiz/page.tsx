import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { BookOpen, CheckCircle2, ChevronDown, Lock, Star, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { CoinDisclaimer } from "@/components/coins/CoinDisclaimer";

export const metadata = { title: "Quiz | EcoMed" };

const DIFFICULTY_LABEL: Record<string, { label: string; color: string }> = {
  FACIL: { label: "Fácil", color: "text-eco-green bg-eco-teal/10 border-eco-teal/20" },
  MEDIO: { label: "Médio", color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
  DIFICIL: { label: "Difícil", color: "text-red-600 bg-red-50 border-red-200" },
};

const LEVEL_LABEL: Record<number, string> = {
  1: "Iniciante",
  2: "Básico",
  3: "Intermediário",
  4: "Avançado",
  5: "Expert",
  6: "Ciência da Destruição",
  7: "Biodiversidade",
  8: "Casos Especiais",
  9: "Impacto Econômico",
  10: "Mestre do Descarte",
};

function diaUTC0(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export default async function QuizListPage() {
  const session = await requireSession();
  const userId = session.user!.id!;

  const hoje = diaUTC0();
  const amanha = new Date(hoje);
  amanha.setUTCDate(amanha.getUTCDate() + 1);

  const [quizzes, attemptsHoje, allAttempts] = await Promise.all([
    prisma.quiz.findMany({
      where: { active: true },
      include: { _count: { select: { questions: true } } },
      orderBy: [{ level: "asc" }, { levelOrder: "asc" }],
    }),
    prisma.quizAttempt.findMany({
      where: { userId, createdAt: { gte: hoje, lt: amanha } },
      select: { quizId: true },
    }),
    prisma.quizAttempt.findMany({
      where: { userId },
      select: { quizId: true },
      distinct: ["quizId"],
    }),
  ]);

  const limiteAtingido = attemptsHoje.length >= 3;
  const quizzesHoje = new Set(attemptsHoje.map((a) => a.quizId));
  const quizzesFeitos = new Set(allAttempts.map((a) => a.quizId));

  // Agrupar por nível
  const niveis = quizzes.reduce<Record<number, typeof quizzes>>((acc, q) => {
    const lvl = (q as typeof q & { level: number }).level ?? 1;
    if (!acc[lvl]) acc[lvl] = [];
    acc[lvl].push(q);
    return acc;
  }, {});

  const nivelNums = Object.keys(niveis)
    .map(Number)
    .sort((a, b) => a - b);

  // Um nível está desbloqueado se for o 1 ou se todos os quizzes do nível anterior foram feitos
  function isDesbloqueado(nivel: number): boolean {
    if (nivel === nivelNums[0]) return true;
    const anterior = nivel - 1;
    const quizzesAnt = niveis[anterior] ?? [];
    return quizzesAnt.length > 0 && quizzesAnt.every((q) => quizzesFeitos.has(q.id));
  }

  // Progresso por nível
  function progressoNivel(nivel: number) {
    const qs = niveis[nivel] ?? [];
    const feitos = qs.filter((q) => quizzesFeitos.has(q.id)).length;
    return { feitos, total: qs.length };
  }

  const primeiroAtivo =
    nivelNums.find((n) => isDesbloqueado(n) && progressoNivel(n).feitos < progressoNivel(n).total) ??
    nivelNums.filter((n) => isDesbloqueado(n)).at(-1) ??
    nivelNums[0];

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Quiz Ambiental</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Complete todos os quizzes de um nível para desbloquear o próximo.
        </p>
      </div>

      {/* Banner de Coins */}
      <div className="rounded-xl border bg-linear-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/40 dark:to-amber-950/40 border-yellow-200 dark:border-yellow-900 p-4">
        <div className="flex items-center gap-3">
          <Trophy className="size-5 text-yellow-500 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-yellow-800 dark:text-yellow-200">
              +10 EcoCoins com nota perfeita (100% de acertos)
            </p>
            <p className="text-yellow-700 dark:text-yellow-400 text-xs mt-0.5">
              Respostas erradas não geram EcoCoins · Limite: 3 quizzes por dia · {attemptsHoje.length}/3 realizados hoje
            </p>
          </div>
        </div>
        {limiteAtingido && (
          <p className="mt-2 text-xs text-yellow-700 dark:text-yellow-400 font-medium">
            ✓ Você atingiu o limite diário de quizzes. Volte amanhã!
          </p>
        )}
      </div>

      {/* Sem quizzes */}
      {quizzes.length === 0 && (
        <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          <BookOpen className="size-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Quizzes em breve</p>
          <p className="text-xs mt-1">Os primeiros quizzes estarão disponíveis em breve.</p>
        </div>
      )}

      {/* Níveis */}
      <div className="space-y-3">
        {nivelNums.map((nivel) => {
          const desbloqueado = isDesbloqueado(nivel);
          const { feitos, total } = progressoNivel(nivel);
          const concluido = feitos === total && total > 0;
          const label = LEVEL_LABEL[nivel] ?? `Nível ${nivel}`;

          return (
            <details
              key={nivel}
              open={nivel === primeiroAtivo}
              className="group rounded-xl border bg-card"
            >
              {/* Cabeçalho clicável */}
              <summary className="flex cursor-pointer select-none list-none items-center justify-between p-4 [&::-webkit-details-marker]:hidden">
                <div className={cn("flex items-center gap-2", !desbloqueado && "opacity-50")}>
                  {!desbloqueado ? (
                    <Lock className="size-4 text-muted-foreground" />
                  ) : concluido ? (
                    <CheckCircle2 className="size-4 text-eco-green" />
                  ) : (
                    <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {nivel}
                    </span>
                  )}
                  <h2 className="text-sm font-semibold">
                    Nível {nivel} — {label}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs text-muted-foreground", !desbloqueado && "opacity-50")}>
                    {feitos}/{total}
                    {!desbloqueado && " · Bloqueado"}
                  </span>
                  <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
                </div>
              </summary>

              {/* Conteúdo expansível */}
              <div className="px-4 pb-4">
                {/* Barra de progresso */}
                {desbloqueado && total > 0 && (
                  <div className="mb-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        concluido ? "bg-eco-teal/100" : "bg-primary",
                      )}
                      style={{ width: `${Math.round((feitos / total) * 100)}%` }}
                    />
                  </div>
                )}

                {/* Cards dos quizzes */}
                <ul className="space-y-2">
                  {(niveis[nivel] ?? []).map((q) => {
                    const diff = DIFFICULTY_LABEL[q.difficulty] ?? DIFFICULTY_LABEL.FACIL;
                    const jáFezHoje = quizzesHoje.has(q.id);
                    const jáFez = quizzesFeitos.has(q.id);

                    if (!desbloqueado) {
                      return (
                        <li
                          key={q.id}
                          className="flex items-center gap-3 rounded-xl border border-dashed p-3 opacity-40 cursor-not-allowed"
                        >
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                            <Lock className="size-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{q.title}</p>
                            <p className="text-xs text-muted-foreground">
                              Complete o nível {nivel - 1} para desbloquear
                            </p>
                          </div>
                        </li>
                      );
                    }

                    return (
                      <li key={q.id}>
                        <Link
                          href={`/app/quiz/${q.id}`}
                          className={cn(
                            "flex items-start gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/50",
                            jáFez && !jáFezHoje && "border-eco-teal/10 dark:border-eco-teal/30/40",
                            jáFezHoje && "border-eco-teal/20 bg-eco-teal/10/50 dark:bg-eco-teal/10",
                          )}
                        >
                          <div
                            className={cn(
                              "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border",
                              jáFezHoje
                                ? "border-eco-teal/20 bg-eco-teal/10 text-eco-teal-dark"
                                : jáFez
                                  ? "border-eco-teal/20 bg-eco-teal/10 text-eco-green"
                                  : "border-border bg-muted text-muted-foreground",
                            )}
                          >
                            {jáFez ? (
                              <CheckCircle2 className="size-4" />
                            ) : (
                              <BookOpen className="size-4" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm">{q.title}</p>
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-full border px-1.5 py-0.5 text-xs font-medium",
                                  diff.color,
                                )}
                              >
                                {diff.label}
                              </span>
                              {jáFezHoje && (
                                <span className="inline-flex items-center gap-1 text-xs text-eco-teal-dark dark:text-eco-teal font-medium">
                                  <CheckCircle2 className="size-3" />
                                  Feito hoje
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                              {q.description}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span>{q._count.questions} questões</span>
                              <span className="ml-auto flex items-center gap-1 text-yellow-600 font-medium">
                                <Star className="size-3 fill-yellow-400 text-yellow-400" />
                                {jáFez ? "Refazer" : "+5 / +10 Coins"}
                              </span>
                            </div>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </details>
          );
        })}
      </div>

      <CoinDisclaimer />
    </div>
  );
}
