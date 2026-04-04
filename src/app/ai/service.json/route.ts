export const dynamic = "force-static";

const service = {
  version: "1.0",
  lastModified: "2026-04-04T00:00:00Z",
  service: {
    name: "EcoMed",
    tagline: "Seu remédio tem destino certo.",
    url: "https://ecomed.eco.br",
    type: "Progressive Web App (PWA)",
    category: "Saúde Ambiental / Resíduos Farmacêuticos",
    language: "pt-BR",
    country: "Brasil",
    pricing: "Gratuito para cidadãos",
    founded: "2025",
  },
  capabilities: [
    {
      name: "Mapa de pontos de coleta",
      description:
        "Mapa interativo geolocalizado com pontos de coleta de medicamentos verificados em farmácias, UBS e ecopontos em todo o Brasil.",
      url: "https://ecomed.eco.br/mapa",
    },
    {
      name: "Assistente de IA",
      description:
        "Chatbot especializado em descarte de medicamentos, treinado com legislação brasileira (PNRS, ANVISA, Decreto 10.388/2020) usando RAG.",
      url: "https://ecomed.eco.br/app/chat",
    },
    {
      name: "Gamificação com EcoCoins",
      description:
        "Sistema de recompensas: cidadãos ganham EcoCoins a cada descarte correto realizado em um ponto parceiro, com ranking e conquistas.",
      url: "https://ecomed.eco.br/ranking",
    },
    {
      name: "Blog educativo",
      description:
        "Artigos sobre descarte correto de medicamentos, legislação ambiental brasileira e impacto ambiental de resíduos farmacêuticos.",
      url: "https://ecomed.eco.br/blog",
    },
    {
      name: "Funcionamento offline",
      description:
        "PWA com Service Worker — usuários podem acessar pontos favoritos e informações mesmo sem conexão com a internet.",
    },
  ],
  targetAudience: [
    "Cidadãos brasileiros com medicamentos vencidos ou sem uso",
    "Farmácias e drogarias participantes da logística reversa",
    "Unidades Básicas de Saúde (UBS)",
    "Gestores de saúde e meio ambiente municipais",
    "Instituições de saúde (hospitais, clínicas)",
  ],
  legislation: [
    { name: "Lei 12.305/2010", description: "Política Nacional de Resíduos Sólidos (PNRS)" },
    { name: "Decreto 10.388/2020", description: "Logística reversa de medicamentos domiciliares" },
    { name: "RDC ANVISA 222/2018", description: "Gerenciamento de resíduos de serviços de saúde" },
    { name: "CONAMA 358/2005", description: "Descarte de resíduos de serviços de saúde" },
  ],
  endpoints: {
    summary: "https://ecomed.eco.br/ai/summary.json",
    faq: "https://ecomed.eco.br/ai/faq.json",
    service: "https://ecomed.eco.br/ai/service.json",
    sitemapLLM: "https://ecomed.eco.br/sitemap-llm.xml",
    aiTxt: "https://ecomed.eco.br/.well-known/ai.txt",
    llmsTxt: "https://ecomed.eco.br/llms.txt",
    sitemap: "https://ecomed.eco.br/sitemap.xml",
    robots: "https://ecomed.eco.br/robots.txt",
  },
};

export function GET() {
  return Response.json(service, {
    headers: {
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
