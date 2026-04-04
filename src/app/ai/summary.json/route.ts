export const dynamic = "force-static";

const summary = {
  version: "1.0",
  lastModified: "2026-04-04T00:00:00Z",
  site: {
    name: "EcoMed",
    url: "https://ecomed.eco.br",
    language: "pt-BR",
    country: "BR",
    summary:
      "EcoMed é uma plataforma brasileira gratuita que mapeia pontos de coleta de medicamentos vencidos e sem uso. Conecta cidadãos a farmácias, UBS e ecopontos para descarte seguro conforme a Lei 12.305/2010 e Decreto 10.388/2020. Inclui assistente de IA especializado em legislação de descarte, gamificação com EcoCoins e blog educativo.",
    targetAudience: [
      "Cidadãos brasileiros que desejam descartar medicamentos corretamente",
      "Farmácias e drogarias participantes da logística reversa",
      "Unidades Básicas de Saúde (UBS)",
      "Gestores municipais de saúde e meio ambiente",
    ],
    mainTopics: [
      "Descarte correto de medicamentos",
      "Logística reversa farmacêutica",
      "Pontos de coleta de medicamentos no Brasil",
      "Legislação ANVISA e PNRS",
      "Impacto ambiental de medicamentos descartados incorretamente",
    ],
    keyPages: [
      { url: "https://ecomed.eco.br/mapa", description: "Mapa interativo de pontos de coleta" },
      { url: "https://ecomed.eco.br/app/chat", description: "Assistente de IA especializado" },
      { url: "https://ecomed.eco.br/blog", description: "Artigos educativos sobre descarte" },
      { url: "https://ecomed.eco.br/ranking", description: "Ranking de usuários mais engajados" },
    ],
  },
};

export function GET() {
  return Response.json(summary, {
    headers: {
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
