import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { BookOpen, CheckCircle2, Star, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { CoinDisclaimer } from "@/components/coins/CoinDisclaimer";

export const metadata = { title: "Quiz | EcoMed" };

const DIFFICULTY_LABEL: Record<string, { label: string; color: string }> = {
  FACIL: { label: "Fácil", color: "text-green-600 bg-green-50 border-green-200" },
  MEDIO: { label: "Médio", color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
  DIFICIL: { label: "Difícil", color: "text-red-600 bg-red-50 border-red-200" },
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

  const [quizzes, attemptsHoje] = await Promise.all([
    prisma.quiz.findMany({
      where: { active: true },
      include: {
        _count: { select: { questions: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.quizAttempt.findMany({
      where: { userId, createdAt: { gte: hoje, lt: amanha } },
      select: { quizId: true },
    }),
  ]);

  const limiteAtingido = attemptsHoje.length >= 3;
  const quizzesHoje = new Set(attemptsHoje.map((a) => a.quizId));

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Quiz Ambiental</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Teste seus conhecimentos e ganhe EcoCoins por cada quiz completado.
        </p>
      </div>

      {/* Banner de Coins */}
      <div className="rounded-xl border bg-linear-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/40 dark:to-amber-950/40 border-yellow-200 dark:border-yellow-900 p-4">
        <div className="flex items-center gap-3">
          <Trophy className="size-5 text-yellow-500 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-yellow-800 dark:text-yellow-200">
              +5 Coins por quiz · +10 Coins por nota perfeita
            </p>
            <p className="text-yellow-700 dark:text-yellow-400 text-xs mt-0.5">
              Limite: 3 quizzes por dia · {attemptsHoje.length}/3 realizados hoje
            </p>
          </div>
        </div>
        {limiteAtingido && (
          <p className="mt-2 text-xs text-yellow-700 dark:text-yellow-400 font-medium">
            ✓ Você atingiu o limite diário de Coins para quizzes. Volte amanhã!
          </p>
        )}
      </div>

      {/* Lista de quizzes */}
      {quizzes.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          <BookOpen className="size-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Quizzes em breve</p>
          <p className="text-xs mt-1">Os primeiros quizzes estarão disponíveis em breve.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {quizzes.map((q) => {
            const diff = DIFFICULTY_LABEL[q.difficulty] ?? DIFFICULTY_LABEL.FACIL;
            const jáFez = quizzesHoje.has(q.id);

            return (
              <li key={q.id}>
                <Link
                  href={`/app/quiz/${q.id}`}
                  className={cn(
                    "flex items-start gap-4 rounded-xl border p-4 transition-colors hover:bg-muted/50",
                    jáFez && "border-green-200 bg-green-50/50 dark:bg-green-950/20",
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border",
                      jáFez
                        ? "border-green-200 bg-green-100 text-green-700"
                        : "border-border bg-muted text-muted-foreground",
                    )}
                  >
                    {jáFez ? (
                      <CheckCircle2 className="size-5" />
                    ) : (
                      <BookOpen className="size-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{q.title}</p>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                          diff.color,
                        )}
                      >
                        {diff.label}
                      </span>
                      {jáFez && (
                        <span className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400 font-medium">
                          <CheckCircle2 className="size-3" />
                          Feito hoje
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {q.description}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span>{q._count.questions} questões</span>
                      {q.category && <span>· {q.category}</span>}
                      <span className="ml-auto flex items-center gap-1 text-yellow-600 font-medium">
                        <Star className="size-3 fill-yellow-400 text-yellow-400" />
                        {jáFez ? "Refazer (+sem Coins)" : "+5 / +10 Coins"}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <CoinDisclaimer />
    </div>
  );
}
