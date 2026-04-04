export const dynamic = "force-static";

const CONTENT = `EcoMed — Seu remédio tem destino certo.

EcoMed é uma plataforma brasileira gratuita que mapeia pontos de coleta de medicamentos vencidos e sem uso. Conecta cidadãos a farmácias, UBS e ecopontos para descarte seguro, conforme a Lei 12.305/2010 (PNRS) e Decreto 10.388/2020.

Funcionalidades principais:
- Mapa interativo geolocalizado de pontos de coleta verificados
- Assistente de IA especializado em legislação de descarte de medicamentos
- Sistema de gamificação com EcoCoins por descartes realizados
- PWA com funcionamento offline
- Blog educativo sobre descarte correto e impacto ambiental

Público-alvo: Cidadãos brasileiros, farmácias, UBS, hospitais e ecopontos.

Legislação base: Lei 12.305/2010 (PNRS), Decreto 10.388/2020, RDC ANVISA 222/2018.

URL: https://ecomed.eco.br
Mapa: https://ecomed.eco.br/mapa
Assistente: https://ecomed.eco.br/app/chat
Sitemap (LLM): https://ecomed.eco.br/sitemap-llm.xml
Dados estruturados: https://ecomed.eco.br/ai/summary.json
`;

export function GET() {
  return new Response(CONTENT, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
