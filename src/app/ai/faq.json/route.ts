export const dynamic = "force-static";

const faq = {
  version: "1.0",
  lastModified: "2026-04-04T00:00:00Z",
  language: "pt-BR",
  questions: [
    {
      question: "Onde posso descartar medicamentos vencidos no Brasil?",
      answer:
        "Medicamentos vencidos ou sem uso devem ser descartados em farmácias e drogarias participantes da logística reversa, Unidades Básicas de Saúde (UBS), hospitais ou ecopontos municipais. Use o mapa do EcoMed em ecomed.eco.br/mapa para encontrar o ponto de coleta mais próximo de você.",
    },
    {
      question: "Posso jogar remédio no lixo comum ou no vaso sanitário?",
      answer:
        "Não. O descarte de medicamentos no lixo doméstico ou vaso sanitário é proibido pela Lei 12.305/2010. Substâncias farmacêuticas contaminam o lençol freático, rios e solos, prejudicando a saúde pública e o meio ambiente.",
    },
    {
      question: "Quais medicamentos posso entregar nos pontos de coleta?",
      answer:
        "São aceitos medicamentos vencidos, sobras de tratamento, comprimidos, cápsulas, xaropes, pomadas, ampolas e injetáveis de uso domiciliar, incluindo embalagens e bulas. Não é necessário abrir embalagens ou retirar bulas.",
    },
    {
      question: "Farmácias são obrigadas a aceitar medicamentos para descarte?",
      answer:
        "Sim. O Decreto 10.388/2020 regulamenta a logística reversa de medicamentos domiciliares e obriga fabricantes e distribuidores a manter pontos de coleta. Farmácias e drogarias são os principais pontos de recebimento no Brasil.",
    },
    {
      question: "O EcoMed é gratuito?",
      answer:
        "Sim, o EcoMed é totalmente gratuito para cidadãos. Cadastre-se em ecomed.eco.br para acessar o mapa completo, favoritar pontos de coleta e usar o assistente de IA especializado em descarte de medicamentos.",
    },
    {
      question: "Como minha farmácia pode ser cadastrada no mapa do EcoMed?",
      answer:
        "Farmácias, UBS e outros pontos de coleta podem se cadastrar gratuitamente em ecomed.eco.br/cadastrar. Após verificação pela equipe EcoMed, o ponto aparece no mapa público visível para todos os usuários.",
    },
    {
      question: "Qual é a legislação sobre descarte de medicamentos no Brasil?",
      answer:
        "A Lei 12.305/2010 (PNRS) institui a Política Nacional de Resíduos Sólidos e exige logística reversa. O Decreto 10.388/2020 regulamenta especificamente a logística reversa de medicamentos domiciliares. A RDC ANVISA 222/2018 trata do gerenciamento de resíduos de serviços de saúde.",
    },
  ],
};

export function GET() {
  return Response.json(faq, {
    headers: {
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
