import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "API Pública para Desenvolvedores | EcoMed",
  description:
    "Integre os mais de 58 mil pontos de coleta de medicamentos do EcoMed na sua aplicação. API REST gratuita para projetos educativos, ONGs e parceiros.",
  alternates: { canonical: "https://ecomed.eco.br/desenvolvedores" },
};

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl bg-gray-900 p-4 text-xs leading-relaxed text-gray-100">
      <code>{children}</code>
    </pre>
  );
}

export default function DesenvolvedoresPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-[#0d3b1a] py-20">
          <div className="container mx-auto max-w-3xl px-4">
            <span className="mb-4 inline-block rounded-full border border-white/20 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-eco-lime">
              API Pública v1
            </span>
            <h1 className="mb-5 font-sans text-4xl font-extrabold leading-tight text-white sm:text-5xl">
              Integre o mapa de descarte na sua aplicação
            </h1>
            <p className="text-lg leading-relaxed text-white/80">
              API REST somente-leitura com mais de 58 mil pontos de coleta de
              medicamentos no Brasil. Gratuita para projetos educativos, ONGs,
              órgãos públicos e iniciativas sem fins lucrativos.
            </p>
          </div>
        </section>

        {/* Como obter uma chave */}
        <section className="bg-white py-14">
          <div className="container mx-auto max-w-3xl px-4">
            <h2 className="mb-4 font-sans text-2xl font-bold text-gray-900">🔑 Como obter uma chave</h2>
            <p className="mb-4 text-gray-600">
              Envie um e-mail para{" "}
              <a href="mailto:parcerias@ecomed.eco.br" className="font-semibold text-eco-teal hover:underline">
                parcerias@ecomed.eco.br
              </a>{" "}
              com:
            </p>
            <ul className="mb-4 list-inside list-disc space-y-1 text-sm text-gray-600">
              <li>Nome do projeto e descrição breve do uso pretendido</li>
              <li>Domínio de origem da aplicação (para liberar o CORS)</li>
              <li>Volume estimado de usuários simultâneos</li>
              <li>E-mail técnico do responsável</li>
            </ul>
            <p className="text-sm text-gray-500">
              Resposta em até 2 dias úteis. Uso comercial é avaliado caso a caso.
            </p>
          </div>
        </section>

        {/* Autenticação */}
        <section className="bg-gray-50 py-14">
          <div className="container mx-auto max-w-3xl px-4">
            <h2 className="mb-4 font-sans text-2xl font-bold text-gray-900">🔐 Autenticação</h2>
            <p className="mb-4 text-gray-600">
              Todas as requisições exigem o header <code className="rounded bg-gray-200 px-1.5 py-0.5 text-sm">X-API-Key</code>:
            </p>
            <CodeBlock>{`curl "https://ecomed.eco.br/api/public/v1/pontos/proximos?lat=-23.5505&lng=-46.6333&raio=5000" \\
  -H "X-API-Key: SUA_CHAVE_AQUI"`}</CodeBlock>
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              ⚠️ Trate a chave como senha: use variável de ambiente no servidor e nunca
              a exponha em repositório público ou no bundle do navegador.
            </div>
          </div>
        </section>

        {/* Endpoints */}
        <section className="bg-white py-14">
          <div className="container mx-auto max-w-3xl px-4">
            <h2 className="mb-6 font-sans text-2xl font-bold text-gray-900">📡 Endpoints</h2>

            <div className="mb-10">
              <h3 className="mb-2 font-mono text-base font-bold text-gray-900">
                <span className="mr-2 rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">GET</span>
                /api/public/v1/pontos/proximos
              </h3>
              <p className="mb-3 text-sm text-gray-600">
                Até 30 pontos de coleta aprovados, ordenados por distância.
              </p>
              <div className="mb-3 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase text-gray-400">
                      <th className="py-2 pr-4">Parâmetro</th>
                      <th className="py-2 pr-4">Tipo</th>
                      <th className="py-2 pr-4">Default</th>
                      <th className="py-2">Limites</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600">
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-mono">lat</td>
                      <td className="py-2 pr-4">número</td>
                      <td className="py-2 pr-4">—</td>
                      <td className="py-2">-90 a 90 (obrigatório)</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-mono">lng</td>
                      <td className="py-2 pr-4">número</td>
                      <td className="py-2 pr-4">—</td>
                      <td className="py-2">-180 a 180 (obrigatório)</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-mono">raio</td>
                      <td className="py-2 pr-4">metros</td>
                      <td className="py-2 pr-4">5000</td>
                      <td className="py-2">500 a 50.000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Exemplo de resposta
              </p>
              <CodeBlock>{`{
  "source": "EcoMed Public API v1",
  "attribution": "Dados originais: LogMed / Sindusfarma...",
  "count": 12,
  "query": { "lat": -23.5505, "lng": -46.6333, "raio_metros": 5000 },
  "pontos": [
    {
      "id": "logmed-001234",
      "name": "Farmácia Exemplo - Centro",
      "address": "Rua das Flores, 100",
      "city": "São Paulo",
      "state": "SP",
      "latitude": -23.5489,
      "longitude": -46.6388,
      "phone": "(11) 3333-4444",
      "residueTypes": ["medicamento"],
      "distancia_metros": 412
    }
  ]
}`}</CodeBlock>
            </div>

            <div>
              <h3 className="mb-2 font-mono text-base font-bold text-gray-900">
                <span className="mr-2 rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">GET</span>
                /api/public/v1/pontos/:id
              </h3>
              <p className="text-sm text-gray-600">
                Detalhes completos de um ponto, incluindo horários de funcionamento
                (<code className="rounded bg-gray-100 px-1 py-0.5 text-xs">schedules</code>) por dia da semana.
              </p>
            </div>
          </div>
        </section>

        {/* Widget embeddable */}
        <section className="bg-white py-14">
          <div className="container mx-auto max-w-3xl px-4">
            <h2 className="mb-4 font-sans text-2xl font-bold text-gray-900">
              🗺️ Widget de mapa (iframe) sem chave
            </h2>
            <p className="mb-4 text-gray-600">
              Para sites que só precisam exibir o mapa, oferecemos um widget pronto que
              não exige chave de API. Basta incorporar o iframe:
            </p>
            <CodeBlock>{`<iframe
  src="https://ecomed.eco.br/embed/mapa?lat=-23.5505&lng=-46.6333&zoom=13"
  width="100%"
  height="450"
  style="border:0; border-radius: 12px"
  loading="lazy"
  title="Mapa de pontos de coleta de medicamentos - EcoMed">
</iframe>`}</CodeBlock>
            <p className="mt-4 text-sm text-gray-500">
              Parâmetros opcionais: <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">lat</code>,{" "}
              <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">lng</code> (centro do mapa) e{" "}
              <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">zoom</code> (3–18). Sem
              parâmetros, mostra a visão nacional. A atribuição ao EcoMed é exibida
              automaticamente e não pode ser removida.
            </p>
          </div>
        </section>

        {/* Limites e termos */}
        <section className="bg-gray-50 py-14">
          <div className="container mx-auto max-w-3xl px-4">
            <h2 className="mb-6 font-sans text-2xl font-bold text-gray-900">⚙️ Limites e termos de uso</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[
                {
                  t: "Rate limit",
                  d: "60 requisições/minuto por chave (sliding window). Acompanhe pelos headers X-RateLimit-Limit, X-RateLimit-Remaining e X-RateLimit-Reset.",
                },
                {
                  t: "CORS",
                  d: "Liberado apenas para o domínio registrado na sua chave. Mudou de domínio? Avise a equipe.",
                },
                {
                  t: "Atribuição",
                  d: 'Exiba "Dados: EcoMed + LogMed/Sindusfarma" junto aos pontos mostrados na sua aplicação.',
                },
                {
                  t: "Uso permitido",
                  d: "Fins educativos e não comerciais. Revenda dos dados ou uso em produto pago exige acordo prévio.",
                },
              ].map((c, i) => (
                <div key={i} className="rounded-xl border border-gray-200 bg-white p-5">
                  <h3 className="mb-1 font-bold text-gray-900">{c.t}</h3>
                  <p className="text-sm leading-relaxed text-gray-600">{c.d}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <a
                href="mailto:parcerias@ecomed.eco.br?subject=Solicita%C3%A7%C3%A3o%20de%20chave%20da%20API%20p%C3%BAblica"
                className="inline-block rounded-lg bg-eco-green px-8 py-3.5 text-base font-bold text-white transition-colors hover:bg-eco-green/90"
              >
                Solicitar chave de API →
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
