import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Sobre o EcoMed",
  description:
    "Plataforma brasileira que combina mapa inteligente, inteligência artificial e gamificação para transformar o descarte de medicamentos e proteger o meio ambiente.",
  alternates: { canonical: "https://ecomed.eco.br/sobre" },
};

export default function SobrePage() {
  return (
    <>
      <Header />
      <main>

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <section className="bg-[#1A736A] py-20 relative overflow-hidden">
          <div
            className="absolute top-[-60px] right-[-60px] w-[300px] h-[300px] rounded-full bg-eco-teal opacity-15 pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute bottom-[-40px] left-[-40px] w-[200px] h-[200px] rounded-full bg-eco-green opacity-10 pointer-events-none"
            aria-hidden="true"
          />
          <div className="container mx-auto px-4 max-w-4xl relative z-10">
            <span className="inline-block text-eco-lime text-xs font-bold uppercase tracking-widest mb-3">
              Sobre o EcoMed
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-5 max-w-2xl tracking-tight">
              Transformando o descarte de medicamentos no Brasil
            </h1>
            <p className="text-lg text-[#D9D6D0] leading-relaxed max-w-xl">
              Plataforma educativa que combina mapa inteligente, inteligência
              artificial e gamificação para resolver um problema que afeta 91%
              dos brasileiros.
            </p>
          </div>
        </section>

        {/* ── O Problema ────────────────────────────────────────────── */}
        <section id="problema" className="py-16 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <span className="inline-block text-eco-teal text-xs font-bold uppercase tracking-widest mb-2">
              O Problema
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-5 tracking-tight">
              Por que o EcoMed existe
            </h2>
            <p className="text-base text-gray-600 leading-relaxed mb-10 max-w-2xl">
              Mais de 30 mil toneladas de medicamentos são descartadas
              incorretamente no Brasil todos os anos no lixo comum, na pia,
              no vaso sanitário. Essa contaminação chega aos rios, ao solo e à
              água que bebemos. Existem mais de 7.500 pontos de coleta em
              farmácias, mas quase ninguém sabe que eles existem.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { i: "💊", v: "30 mil ton", l: "descartadas errado/ano" },
                { i: "💧", v: "450 mil L", l: "contaminados por 1 comprimido" },
                { i: "🏥", v: "7.500+", l: "pontos de coleta LogMed" },
                { i: "😟", v: "91%", l: "descartam incorretamente" },
              ].map((s, i) => (
                <div key={i}>
                  <div className="text-3xl mb-1">{s.i}</div>
                  <div className="text-3xl font-extrabold text-[#1A736A] tracking-tight">
                    {s.v}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">{s.l}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-6 text-center">
              Fontes: ANVISA, LogMed/Sindusfarma, OMS, The Lancet
            </p>
          </div>
        </section>

        {/* ── Nossa Solução ─────────────────────────────────────────── */}
        <section id="solucao" className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-4xl">
            <span className="inline-block text-eco-teal text-xs font-bold uppercase tracking-widest mb-2">
              Nossa Solução
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-8 tracking-tight">
              Três funcionalidades, um propósito
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  i: "🗺️",
                  t: "Mapa Inteligente",
                  d: "Encontre a farmácia mais próxima que aceita medicamentos. Filtre por tipo, veja horário e abra a rota.",
                  cl: "#24A645",
                },
                {
                  i: "🤖",
                  t: "EcoBot (Chat com IA)",
                  d: "Tire dúvidas sobre descarte 24h. IA educativa em linguagem simples, com fontes confiáveis.",
                  cl: "#3E8C8C",
                },
                {
                  i: "🪙",
                  t: "EcoCoins (Gamificação)",
                  d: "Ganhe EcoCoins por cada ação: descarte, quiz, leitura, indicação. Suba de nível e troque por recompensas.",
                  cl: "#1A736A",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-eco-teal hover:shadow-md transition-all"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                    style={{ background: `${item.cl}18` }}
                  >
                    {item.i}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {item.t}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {item.d}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Missão / Visão / Valores ───────────────────────────────── */}
        <section id="missao" className="py-16 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <span className="inline-block text-eco-teal text-xs font-bold uppercase tracking-widest mb-2">
                  Missão
                </span>
                <p className="text-lg font-semibold text-gray-900 leading-relaxed mb-8">
                  Promover a conscientização e facilitar o descarte correto de
                  medicamentos no Brasil por meio de tecnologia acessível,
                  educação de qualidade e incentivos gamificados.
                </p>
                <span className="inline-block text-eco-teal text-xs font-bold uppercase tracking-widest mb-2">
                  Visão
                </span>
                <p className="text-lg font-semibold text-gray-900 leading-relaxed">
                  Ser a principal referência digital brasileira em descarte
                  consciente de medicamentos, contribuindo para a redução da
                  contaminação ambiental.
                </p>
              </div>
              <div>
                <span className="inline-block text-eco-teal text-xs font-bold uppercase tracking-widest mb-4">
                  Nossos Valores
                </span>
                <div className="flex flex-col gap-3">
                  {[
                    {
                      i: "🌍",
                      n: "Impacto Real",
                      d: "Não somos só mais um app. Cada descarte correto registrado representa menos veneno no solo e na água.",
                    },
                    {
                      i: "🔓",
                      n: "Transparência",
                      d: "O código está no GitHub, aberto pra quem quiser auditar. Sem caixa preta.",
                    },
                    {
                      i: "🤝",
                      n: "Acessibilidade",
                      d: "Funciona em qualquer celular, sem instalação. Pensamos em quem não tem plano de dados generoso.",
                    },
                    {
                      i: "🎓",
                      n: "Educação Primeiro",
                      d: "Quem entende o porquê age diferente. Informamos antes de gamificar.",
                    },
                    {
                      i: "🛡️",
                      n: "Privacidade",
                      d: "Nossa IA roda no nosso servidor. Suas perguntas não viram dados de terceiros.",
                    },
                    {
                      i: "🌱",
                      n: "Aprendizado Aberto",
                      d: "Somos 70 estudantes aprendendo em público. Erramos, corrigimos e melhoramos juntos.",
                    },
                  ].map((v, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <span className="text-xl shrink-0 mt-0.5">{v.i}</span>
                      <div>
                        <span className="text-sm font-bold text-gray-900">
                          {v.n}:{" "}
                        </span>
                        <span className="text-sm text-gray-600">{v.d}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Tecnologia ────────────────────────────────────────────── */}
        <section id="tecnologia" className="py-16 bg-[#1A736A]">
          <div className="container mx-auto px-4 max-w-4xl">
            <span className="inline-block text-eco-lime text-xs font-bold uppercase tracking-widest mb-2">
              Tecnologia
            </span>
            <h2 className="text-3xl font-extrabold text-white mb-4 tracking-tight">
              Stack 100% open source, custo quase zero
            </h2>
            <p className="text-[#D9D6D0] leading-relaxed mb-8 max-w-lg">
              O EcoMed roda com menos de R$&nbsp;5/mês usando plataformas
              gratuitas. A inteligência artificial funciona localmente,
              protegendo seus dados.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { n: "Next.js 15", r: "Frontend PWA", d: "App Router, SSR, offline" },
                { n: "Ollama + Llama 3", r: "IA Local", d: "Sem custo de API, privacidade" },
                { n: "Supabase", r: "Banco + Auth", d: "PostgreSQL + Realtime + pgvector" },
                { n: "Cloudflare", r: "CDN + Segurança", d: "DNS, SSL, cache, WAF" },
                { n: "OpenStreetMap", r: "Mapa", d: "Gratuito, open source" },
                { n: "Tailwind + shadcn", r: "Design System", d: "Componentes acessíveis" },
              ].map((t, i) => (
                <div
                  key={i}
                  className="bg-white/10 rounded-xl px-5 py-4 border border-white/10"
                >
                  <div className="text-eco-lime font-bold text-sm mb-0.5">
                    {t.n}
                  </div>
                  <div className="text-white text-xs font-semibold mb-1">
                    {t.r}
                  </div>
                  <div className="text-white/50 text-xs">{t.d}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Impacto + ODS ─────────────────────────────────────────── */}
        <section id="impacto" className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-4xl">
            <span className="inline-block text-eco-teal text-xs font-bold uppercase tracking-widest mb-2">
              Impacto
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 tracking-tight">
              Alinhado com os ODS da ONU
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { file: "3-VIDA-SAUDAVEL.png", alt: "ODS 3 — Vida Saudável" },
                { file: "4-EDUCACAO-DE-QUALIDADE.png", alt: "ODS 4 — Educação de Qualidade" },
                { file: "6-AGUA-E-SANEAMENTO.png", alt: "ODS 6 — Água e Saneamento" },
                { file: "9-INOVACAO-E-INFRAESTRUTURA.png", alt: "ODS 9 — Inovação e Infraestrutura" },
                { file: "12-PRODUCAO-E-CONSUMO.png", alt: "ODS 12 — Produção e Consumo Sustentáveis" },
                { file: "17-PARCERIAS-GLOBAIS.png", alt: "ODS 17 — Parcerias Globais" },
              ].map((ods, i) => (
                <div key={i} className="relative w-full aspect-square rounded-xl overflow-hidden shadow-sm hover:scale-105 transition-transform duration-300">
                  <Image 
                    src={`/ods/${ods.file}`}
                    alt={ods.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 16vw"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Objetivos de Desenvolvimento Sustentável da ONU aos quais o EcoMed contribui diretamente.
            </p>
          </div>
        </section>

        {/* ── Equipe ────────────────────────────────────────────────── */}
        <section id="equipe" className="py-16 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <span className="inline-block text-eco-teal text-xs font-bold uppercase tracking-widest mb-2">
              Equipe
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">
              70 alunos, 3 turmas, 1 missão
            </h2>
            <p className="text-base text-gray-600 leading-relaxed mb-8 max-w-xl">
              Projeto interdisciplinar coordenado pelo Prof. Ivon Matos,
              desenvolvido por alunos da Escola Técnica Estadual Ilda Vieira Vilela.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  t: "3TA — Farmácia e Negócios",
                  g: "Pesquisa, Conteúdo, Negócio, Marketing",
                  f: "Concepção, validação, conteúdo e estratégia",
                  cl: "#24A645",
                },
                {
                  t: "3TB — IA e Ética",
                  g: "Ollama, RAG, Guardrails, Prompts",
                  f: "Motor de inteligência artificial e governança ética",
                  cl: "#3E8C8C",
                },
                {
                  t: "3TC — Frontend",
                  g: "Setup, Chat, Mapa, Telas",
                  f: "Interface, experiência do usuário e infraestrutura",
                  cl: "#1A736A",
                },
              ].map((t, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-eco-teal hover:shadow-md transition-all"
                >
                  <div
                    className="h-1 rounded-sm mb-4"
                    style={{ background: t.cl }}
                  />
                  <h3 className="text-base font-bold text-gray-900 mb-2">
                    {t.t}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">{t.f}</p>
                  <div className="text-xs text-gray-400">4 grupos: {t.g}</div>
                </div>
              ))}
            </div>
            <div className="mt-8 bg-[#1A736A] rounded-2xl px-7 py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="text-lg font-bold text-white">
                  Coordenação: Prof. Ivon Matos
                </div>
                <div className="text-sm text-[#D9D6D0]">
                  Escola Técnica Estadual Ilda Vieira Vilela | Projeto Interdisciplinar 2026
                </div>
              </div>
              <div className="text-sm text-eco-lime font-medium sm:text-right">
                12 grupos | 196+ tarefas | OpenProject
              </div>
            </div>
          </div>
        </section>

        {/* ── Roadmap ───────────────────────────────────────────────── */}
        <section id="roadmap" className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-4xl">
            <span className="inline-block text-eco-teal text-xs font-bold uppercase tracking-widest mb-2">
              Roadmap
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-8 tracking-tight">
              Do MVP ao impacto nacional
            </h2>
            <div className="max-w-lg flex flex-col">
              {[
                {
                  year: "2026 Q2",
                  title: "MVP",
                  desc: "Auth, Mapa, Chat IA, EcoCoins, PWA, Documentação. Meta: 100 usuários.",
                  color: "#24A645",
                  isLast: false,
                },
                {
                  year: "2026 Q3",
                  title: "V1.0",
                  desc: "Missões semanais, Eventos, Parcerias B2B, Badges. Meta: 1.000 usuários.",
                  color: "#3E8C8C",
                  isLast: false,
                },
                {
                  year: "2026 Q4",
                  title: "V1.1",
                  desc: "PIX cashback, Cupons, Nível Lenda, Feed social. Meta: 5.000 usuários.",
                  color: "#1A736A",
                  isLast: false,
                },
                {
                  year: "2027",
                  title: "V2.0",
                  desc: "Marketplace, QR Code check-in, Desafios comunitários. Meta: 20.000 usuários.",
                  color: "#D4A017",
                  isLast: true,
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-5">
                  <div className="flex flex-col items-center shrink-0">
                    <div
                      className="w-3.5 h-3.5 rounded-full border-2 border-white z-10"
                      style={{
                        background: item.color,
                        boxShadow: `0 0 0 2px ${item.color}`,
                        marginTop: 2,
                      }}
                    />
                    {!item.isLast && (
                      <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
                    )}
                  </div>
                  <div className={item.isLast ? "pb-0" : "pb-7"}>
                    <div
                      className="text-xs font-bold mb-0.5"
                      style={{ color: item.color }}
                    >
                      {item.year}
                    </div>
                    <div className="text-base font-bold text-gray-900 mb-1">
                      {item.title}
                    </div>
                    <div className="text-sm text-gray-600 leading-relaxed">
                      {item.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Open Source ───────────────────────────────────────────── */}
        <section id="opensource" className="py-16 bg-white text-center">
          <div className="container mx-auto px-4 max-w-2xl">
            <span className="inline-block text-eco-teal text-xs font-bold uppercase tracking-widest mb-2">
              Open Source
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Código aberto, impacto coletivo
            </h2>
            <p className="text-base text-gray-600 leading-relaxed mb-8">
              O EcoMed é 100% open source. Código no GitHub, aberto para
              auditoria, contribuições e replicação.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <a
                href="https://github.com/ivonsmatos/ecomed"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-900 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors"
              >
                github.com/ivonsmatos/ecomed
              </a>
              <span className="bg-eco-green text-white px-6 py-3 rounded-lg text-sm font-semibold">
                Licença MIT
              </span>
            </div>
          </div>
        </section>

        {/* ── CTA Final ─────────────────────────────────────────────── */}
        <section className="bg-[#1A736A] py-16 text-center">
          <div className="container mx-auto px-4 max-w-xl">
            <div className="text-4xl mb-3">🌿</div>
            <h2 className="text-3xl font-extrabold text-white mb-3">
              Junte-se ao EcoMed
            </h2>
            <p className="text-[#D9D6D0] text-base leading-relaxed mb-8">
              Descarte medicamentos corretamente, ganhe EcoCoins e proteja o
              meio ambiente.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/mapa"
                className="bg-eco-green text-white px-8 py-3.5 rounded-lg text-base font-bold hover:bg-eco-green/90 transition-colors"
              >
                Começar Agora
              </Link>
              <Link
                href="/parceiros"
                className="bg-transparent text-white border-2 border-white px-8 py-3.5 rounded-lg text-base font-bold hover:bg-white/10 transition-colors"
              >
                Seja Parceiro
              </Link>
            </div>
            <div className="mt-6 text-xs text-white/40">
              contato@ecomed.eco.br | parcerias@ecomed.eco.br
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
