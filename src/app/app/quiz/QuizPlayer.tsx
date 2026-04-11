"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Trophy, Share2, RotateCcw, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  order: number;
  text: string;
  options: string[];
}

interface QuizPlayerProps {
  quizId: string;
  questions: Question[];
  shuffleToken: string;
}

type Phase = "playing" | "submitting" | "result";

interface Result {
  score: number;
  total: number;
  perfect: boolean;
  coinsEarned: number;
  limiteDiario: boolean;
  correctAnswers: number[];
  newBalance: number;
  levelUp: string | null;
  streakBonus: string | null;
  levelBadgeEarned: boolean;
  levelBadgeSlug: string | null;
  quizLevel: number;
}

export function QuizPlayer({ quizId, questions, shuffleToken }: QuizPlayerProps) {
  const [phase, setPhase] = useState<Phase>("playing");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>(Array(questions.length).fill(-1));
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalQuestions = questions.length;
  const answered = answers.filter((a) => a >= 0).length;
  const question = questions[current];

  function selectAnswer(optionIdx: number) {
    if (phase !== "playing") return;
    setAnswers((prev) => {
      const next = [...prev];
      next[current] = optionIdx;
      return next;
    });
  }

  function goTo(idx: number) {
    if (idx >= 0 && idx < totalQuestions) setCurrent(idx);
  }

  async function submit() {
    if (answered < totalQuestions) return;
    setPhase("submitting");
    setError(null);
    try {
      const res = await fetch(`/api/quiz/${quizId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, shuffleToken }),
      });
      const data = (await res.json()) as Result & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Erro ao enviar respostas.");
        setPhase("playing");
        return;
      }
      setResult(data);
      setPhase("result");
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setPhase("playing");
    }
  }

  // ---- RESULTADO ----
  if (phase === "result" && result) {
    const pct = Math.round((result.score / result.total) * 100);
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-3">
          <div
            className={cn(
              "mx-auto flex size-20 items-center justify-center rounded-full",
              result.perfect
                ? "bg-yellow-50 dark:bg-yellow-950/40"
                : pct >= 50
                  ? "bg-eco-teal/10 dark:bg-eco-teal/20"
                  : "bg-red-50 dark:bg-red-950/40",
            )}
          >
            {result.perfect ? (
              <Trophy className="size-10 text-yellow-500" />
            ) : pct >= 50 ? (
              <CheckCircle2 className="size-10 text-eco-green" />
            ) : (
              <XCircle className="size-10 text-red-500" />
            )}
          </div>

          <div>
            <p className="text-3xl font-bold">
              {result.score}/{result.total}
            </p>
            <p className="text-muted-foreground text-sm">{pct}% de acertos</p>
            {result.perfect && (
              <p className="mt-1 font-semibold text-yellow-600">Pontuação perfeita! 🎉</p>
            )}
          </div>
        </div>

        {/* Coins ganhos */}
        <div className="rounded-xl border p-4 text-center space-y-1">
          {result.perfect && result.limiteDiario ? (
            <p className="text-sm text-muted-foreground">
              Nota perfeita! Mas você já atingiu o limite de {3} quizzes hoje. Volte amanhã! 🗓️
            </p>
          ) : result.perfect && result.coinsEarned > 0 ? (
            <>
              <p className="text-2xl font-bold text-yellow-600">+{result.coinsEarned} EcoCoins</p>
              <p className="text-xs text-muted-foreground">
                Saldo atual: {result.newBalance} EcoCoins
              </p>
            </>
          ) : !result.perfect ? (
            <p className="text-sm text-muted-foreground">
              Estude mais e tente de novo! Só a nota perfeita (100%) gera EcoCoins. 💡
            </p>
          ) : null}
          {result.levelUp && (
            <p className="text-eco-teal-dark dark:text-eco-teal text-sm font-semibold mt-1">
              🎉 Novo nível desbloqueado: {result.levelUp}!
            </p>
          )}
          {result.streakBonus && (
            <p className="text-blue-600 dark:text-blue-400 text-sm mt-1">
              🔥 Bônus de streak: {result.streakBonus}
            </p>
          )}
        </div>

        {/* Selo de nível conquistado */}
        {result.levelBadgeEarned && (
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/40 dark:border-yellow-900 p-4 text-center space-y-3">
            <p className="text-2xl">🏅</p>
            <p className="font-bold text-yellow-800 dark:text-yellow-200">
              Nível {result.quizLevel} concluído com perfeição!
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-400">
              Você ganhou o selo deste nível. Compartilhe sua conquista!
            </p>
            <button
              type="button"
              onClick={async () => {
                const texto = `Concluí o Nível ${result.quizLevel} do Quiz Ambiental do EcoMed com 100%! 🌿 Descarte correto salva vidas. ecomed.eco.br`;
                try {
                  if (navigator.share) {
                    await navigator.share({ title: "EcoMed — Conquista de Quiz", text: texto, url: "https://ecomed.eco.br" });
                  } else {
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`, "_blank");
                  }
                  await fetch("/api/coins/share", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ type: "badge" }),
                  });
                } catch { /* cancelado */ }
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-yellow-600 text-white px-4 py-2 text-sm font-medium hover:bg-yellow-700 transition-colors"
            >
              <Share2 className="size-4" />
              Compartilhar selo
            </button>
          </div>
        )}

        {/* Gabarito */}
        <div className="space-y-3">
          <h2 className="font-semibold text-sm">Gabarito</h2>
          {questions.map((q, i) => {
            const userAnswer = answers[i];
            const correct = result.correctAnswers[i];
            const acertou = userAnswer === correct;
            return (
              <div
                key={q.id}
                className={cn(
                  "rounded-xl border p-3 text-sm",
                  acertou
                    ? "border-eco-teal/20 bg-eco-teal/10/60 dark:bg-eco-teal/10"
                    : "border-red-200 bg-red-50/60 dark:bg-red-950/20",
                )}
              >
                <div className="flex items-start gap-2">
                  {acertou ? (
                    <CheckCircle2 className="size-4 text-eco-green shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="size-4 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{q.text}</p>
                    {!acertou && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Sua resposta:{" "}
                        <span className="text-red-600 font-medium">
                          {q.options[userAnswer] ?? "Sem resposta"}
                        </span>
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-eco-teal-dark dark:text-eco-teal font-medium">
                      Correta: {q.options[correct]}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <Link
            href="/app/quiz"
            className="flex-1 rounded-lg border py-2.5 text-center text-sm font-medium transition-colors hover:bg-muted"
          >
            Outros quizzes
          </Link>
          <button
            type="button"
            onClick={() => {
              setAnswers(Array(totalQuestions).fill(-1));
              setCurrent(0);
              setResult(null);
              setPhase("playing");
            }}
            className="flex items-center gap-1.5 rounded-lg border py-2.5 px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            <RotateCcw className="size-4" />
            Refazer
          </button>
        </div>
      </div>
    );
  }

  // ---- JOGO ----
  return (
    <div className="max-w-lg space-y-6">
      {/* Progresso */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            Questão {current + 1} de {totalQuestions}
          </span>
          <span>{answered} respondidas</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-eco-teal/100 transition-all"
            data-progress={Math.round(((current + 1) / totalQuestions) * 100)}
            style={{ width: `${((current + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Questão atual */}
      <div className="rounded-xl border p-5 space-y-4">
        <p className="font-semibold leading-snug">{question.text}</p>

        <ul className="space-y-2">
          {question.options.map((option, idx) => (
            <li key={idx}>
              <button
                type="button"
                onClick={() => selectAnswer(idx)}
                className={cn(
                  "w-full text-left rounded-lg border px-4 py-3 text-sm transition-colors",
                  answers[current] === idx
                    ? "border-green-500 bg-eco-teal/10 dark:bg-eco-teal/20 font-medium"
                    : "border-border hover:bg-muted/60",
                )}
              >
                <span className="mr-2 font-medium text-muted-foreground">
                  {String.fromCharCode(65 + idx)}.
                </span>
                {option}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Navegação */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => goTo(current - 1)}
          disabled={current === 0}
          className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-40 hover:bg-muted transition-colors"
        >
          Anterior
        </button>

        {/* Bolinhas de questões */}
        <div className="flex flex-1 justify-center gap-1.5">
          {questions.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              className={cn(
                "size-2.5 rounded-full transition-colors",
                i === current
                  ? "bg-eco-green"
                  : answers[i] >= 0
                    ? "bg-eco-teal/20 dark:bg-eco-teal/30"
                    : "bg-muted-foreground/30",
              )}
              title={`Ir para questão ${i + 1}`}
            />
          ))}
        </div>

        {current < totalQuestions - 1 ? (
          <button
            type="button"
            onClick={() => goTo(current + 1)}
            className="flex items-center gap-1 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            Próxima
            <ArrowRight className="size-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={answered < totalQuestions || phase === "submitting"}
            className={cn(
              "flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
              answered === totalQuestions
                ? "bg-eco-green text-white hover:bg-eco-green"
                : "border border-border text-muted-foreground cursor-not-allowed opacity-50",
            )}
          >
            {phase === "submitting" ? "Enviando..." : "Finalizar"}
          </button>
        )}
      </div>

      {answered < totalQuestions && current === totalQuestions - 1 && (
        <p className="text-center text-xs text-muted-foreground">
          Responda todas as questões para finalizar.
        </p>
      )}

      {error && (
        <p className="text-center text-sm text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
}
