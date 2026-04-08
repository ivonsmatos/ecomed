import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown, MessageSquare, AlertCircle, CheckCircle2 } from "lucide-react";
import { FeedbackReviewForm } from "@/components/admin/FeedbackReviewForm";

export const metadata: Metadata = { title: "Feedback IA | EcoMed Admin" };

export const revalidate = 60;

export default async function FeedbackPage() {
  await requireAdmin();

  const hoje = new Date();
  hoje.setUTCHours(0, 0, 0, 0);

  const seteDiasAtras = new Date(hoje);
  seteDiasAtras.setUTCDate(seteDiasAtras.getUTCDate() - 6);

  const [totalHoje, positiveHoje, negativeHoje, totalGeral, naoRevisados, topNegativos] =
    await Promise.all([
      prisma.chatFeedback.count({ where: { createdAt: { gte: hoje } } }),
      prisma.chatFeedback.count({ where: { createdAt: { gte: hoje }, rating: "positive" } }),
      prisma.chatFeedback.count({ where: { createdAt: { gte: hoje }, rating: "negative" } }),
      prisma.chatFeedback.count(),
      prisma.chatFeedback.count({ where: { rating: "negative", reviewed: false } }),
      prisma.chatFeedback.findMany({
        where: { rating: "negative", reviewed: false },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          pergunta: true,
          resposta: true,
          comment: true,
          createdAt: true,
          reviewed: true,
          actionTaken: true,
        },
      }),
    ]);

  const totalRevisados = await prisma.chatFeedback.count({
    where: { rating: "negative", reviewed: true },
  });

  const approvalRateHoje =
    totalHoje > 0 ? Math.round((positiveHoje / totalHoje) * 100) : null;

  const stats = [
    {
      label: "Total hoje",
      value: totalHoje,
      icon: MessageSquare,
      color: "text-muted-foreground",
    },
    {
      label: "Positivos hoje",
      value: positiveHoje,
      icon: ThumbsUp,
      color: "text-green-600",
    },
    {
      label: "Negativos hoje",
      value: negativeHoje,
      icon: ThumbsDown,
      color: "text-red-500",
      alert: negativeHoje > 3,
    },
    {
      label: "Não revisados",
      value: naoRevisados,
      icon: AlertCircle,
      color: naoRevisados > 0 ? "text-orange-500" : "text-muted-foreground",
      alert: naoRevisados > 0,
    },
    {
      label: "Total geral",
      value: totalGeral,
      icon: CheckCircle2,
      color: "text-muted-foreground",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Feedback do EcoBot</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Governança de IA — monitoramento de alucinações e qualidade das respostas
        </p>
      </div>

      {/* Approval rate banner */}
      {approvalRateHoje !== null && (
        <div
          className={`rounded-lg px-5 py-3 flex items-center gap-3 ${
            approvalRateHoje >= 90
              ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900"
              : approvalRateHoje >= 75
                ? "bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900"
                : "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900"
          }`}
        >
          <span className="text-3xl font-bold">{approvalRateHoje}%</span>
          <span className="text-sm text-muted-foreground">
            de aprovação hoje · Meta: ≥ 90%
          </span>
          <Badge
            variant={
              approvalRateHoje >= 90
                ? "default"
                : approvalRateHoje >= 75
                  ? "secondary"
                  : "destructive"
            }
            className="ml-auto"
          >
            {approvalRateHoje >= 90 ? "✅ OK" : approvalRateHoje >= 75 ? "⚠️ Atenção" : "🔴 Crítico"}
          </Badge>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map(({ label, value, icon: Icon, color, alert }) => (
          <Card key={label} className={alert ? "border-orange-300" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className={`size-4 ${color}`} />
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top 10 feedbacks negativos não revisados */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Feedbacks negativos pendentes de revisão
            {naoRevisados > 0 && (
              <Badge variant="destructive" className="ml-2">
                {naoRevisados}
              </Badge>
            )}
          </h2>
          {totalRevisados > 0 && (
            <span className="text-xs text-muted-foreground">
              {totalRevisados} já revisados
            </span>
          )}
        </div>

        {topNegativos.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <CheckCircle2 className="mx-auto mb-2 size-8 text-green-500" />
              <p className="font-medium">Nenhum feedback negativo pendente!</p>
              <p className="text-sm">Todos os feedbacks negativos foram revisados.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {topNegativos.map((fb: typeof topNegativos[number]) => (
              <Card key={fb.id} className="border-red-200 dark:border-red-900">
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
                          Pergunta
                        </p>
                        <p className="text-sm">{fb.pergunta}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
                          Resposta do EcoBot
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-3">{fb.resposta}</p>
                      </div>
                      {fb.comment && (
                        <div>
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
                            Comentário do usuário
                          </p>
                        <p className="text-sm italic">&ldquo;{fb.comment}&rdquo;</p>
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <ThumbsDown className="size-4 text-red-500 ml-auto" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(fb.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <FeedbackReviewForm feedbackId={fb.id} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Notas de auditoria */}
      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <p className="text-sm font-medium mb-2">📋 Checklist de auditoria semanal (15 min)</p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Verificar taxa de 👎 da semana (meta: &lt; 10%)</li>
            <li>Revisar top 5 respostas com 👎 e classificar: alucinação / genérica / incorreta</li>
            <li>Verificar RAG hit rate no dashboard da IA</li>
            <li>Verificar se há incidentes não tratados</li>
            <li>Anotar ações necessárias no OpenProject</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
