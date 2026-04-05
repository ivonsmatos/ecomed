import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { QuizPlayer } from "../QuizPlayer";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const q = await prisma.quiz.findUnique({ where: { id }, select: { title: true } });
  return { title: q ? `${q.title} | Quiz EcoMed` : "Quiz | EcoMed" };
}

export default async function QuizPage({ params }: Props) {
  await requireSession();
  const { id } = await params;

  const quiz = await prisma.quiz.findUnique({
    where: { id, active: true },
    include: {
      questions: {
        orderBy: { order: "asc" },
        select: { id: true, order: true, text: true, options: true },
      },
    },
  });

  if (!quiz || quiz.questions.length === 0) notFound();

  const questions = quiz.questions.map((q) => ({
    id: q.id,
    order: q.order,
    text: q.text,
    options: JSON.parse(q.options) as string[],
  }));

  return (
    <div className="max-w-lg space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link
          href="/app/quiz"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          Quiz
        </Link>
        <span className="text-muted-foreground/50">/</span>
        <span className="text-sm font-medium truncate">{quiz.title}</span>
      </div>

      <div>
        <h1 className="text-xl font-bold">{quiz.title}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{quiz.description}</p>
      </div>

      <QuizPlayer quizId={quiz.id} questions={questions} />
    </div>
  );
}
