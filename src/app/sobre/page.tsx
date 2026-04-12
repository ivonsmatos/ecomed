import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Sobre o EcoMed",
  description:
    "Plataforma brasileira que combina mapa inteligente, inteligência artificial e gamificação para transformar o descarte de medicamentos — e proteger o meio ambiente.",
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
              incorretamente no Brasil todos os anos — no lixo comum, na pia,
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
                      d: "Cada ação no EcoMed tem resultado mensurável no meio ambiente",
                    },
                    {
                      i: "🔓",
                      n: "Transparência",
                      d: "Código aberto, dados com fonte, IA que admite quando não sabe",
                    },
                    {
                      i: "🤝",
                      n: "Acessibilidade",
                      d: "Gratuito, sem download, linguagem simples, fontes grandes",
                    },
                    {
                      i: "🎓",
                      n: "Educação Primeiro",
                      d: "Informamos antes de gamificar. Conhecimento é a base da mudança",
                    },
                    {
                      i: "🛡️",
                      n: "Privacidade",
                      d: "IA local (Ollama), LGPD compliant, dados protegidos",
                    },
                    {
                      i: "🌱",
                      n: "Melhoria Contínua",
                      d: "Feedback dos usuários melhora o sistema constantemente",
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

              {/* ODS 03 — Vida Saudável */}
              <div className="rounded-xl p-3 flex flex-col items-start" style={{ background: "#009D5B" }}>
                <span className="text-white font-black text-3xl leading-none tracking-tighter">03</span>
                <span className="text-white text-[11px] font-bold uppercase leading-tight mt-1 mb-2">VIDA<br/>SAUDÁVEL</span>
                <svg viewBox="0 0 100 100" className="w-full max-w-[64px] mx-auto mt-auto mb-2 tracking-tighter" aria-hidden="true">
                  <path d="M 50,55 C 25,40 25,20 35,12 C 45,6 50,15 50,20 C 50,15 55,6 65,12 C 75,20 75,40 50,55 Z" fill="white" />
                  <polyline points="5,75 25,75 35,60 45,85 55,65 65,75 75,60 95,75 100,75" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* ODS 04 — Educação de Qualidade */}
              <div className="rounded-xl p-3 flex flex-col items-start" style={{ background: "#E5243B" }}>
                <span className="text-white font-black text-3xl leading-none tracking-tighter">04</span>
                <span className="text-white text-[11px] font-bold uppercase leading-tight mt-1 mb-2">EDUCAÇÃO<br/>DE QUALIDADE</span>
                <svg viewBox="0 0 100 100" className="w-full max-w-[64px] mx-auto mt-auto mb-2" aria-hidden="true">
                  <polygon points="50,25 85,35 50,45 15,35" fill="white" />
                  <polygon points="28,47 50,54 72,47 72,75 28,75" fill="white" />
                  <line x1="75" y1="36" x2="75" y2="68" stroke="white" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>

              {/* ODS 06 — Água e Saneamento */}
              <div className="rounded-xl p-3 flex flex-col items-start" style={{ background: "#00ADD8" }}>
                <span className="text-white font-black text-3xl leading-none tracking-tighter">06</span>
                <span className="text-white text-[11px] font-bold uppercase leading-tight mt-1 mb-2">ÁGUA E<br/>SANEAMENTO</span>
                <svg viewBox="0 0 100 100" className="w-full max-w-[64px] mx-auto mt-auto mb-2" aria-hidden="true">
                  <mask id="cutout-6">
                    <rect width="100" height="100" fill="white" />
                    <path d="M 15 45 Q 35 30 50 45 T 85 45 L 85 55 Q 65 40 50 55 T 15 55 Z" fill="black" />
                    <path d="M 50 63 C 65 80 60 92 50 90 C 40 92 35 80 50 63 Z" fill="black" />
                  </mask>
                  <polygon points="25,25 75,25 65,90 35,90" fill="white" mask="url(#cutout-6)" />
                </svg>
              </div>

              {/* ODS 09 — Inovação e Infraestruturas */}
              <div className="rounded-xl p-3 flex flex-col items-start" style={{ background: "#FD6925" }}>
                <span className="text-white font-black text-3xl leading-none tracking-tighter">09</span>
                <span className="text-white text-[11px] font-bold uppercase leading-tight mt-1 mb-2">INOVAÇÃO E<br/>INFRAESTRUTURA</span>
                <svg viewBox="0 0 100 100" className="w-full max-w-[64px] mx-auto mt-auto mb-2" aria-hidden="true">
                  <g fill="none" stroke="white" strokeWidth="2" strokeLinejoin="round" transform="translate(0, 5) scale(1.1)">
                    <polygon points="45,15 60,23 45,31 30,23" fill="white" />
                    <polygon points="30,23 45,31 45,47 30,39" />
                    <polygon points="45,31 60,23 60,39 45,47" />
                    <polygon points="30,39 45,47 30,55 15,47" />
                    <polygon points="15,47 30,55 30,71 15,63" fill="white" />
                    <polygon points="30,55 45,47 45,63 30,71" />
                    <polygon points="60,39 75,47 60,55 45,47" />
                    <polygon points="45,47 60,55 60,71 45,63" />
                    <polygon points="60,55 75,47 75,63 60,71" fill="white" />
                  </g>
                </svg>
              </div>

              {/* ODS 12 — Produção e Consumo Sustentáveis */}
              <div className="rounded-xl p-3 flex flex-col items-start" style={{ background: "#D79C3B" }}>
                <span className="text-white font-black text-3xl leading-none tracking-tighter">12</span>
                <span className="text-white text-[11px] font-bold uppercase leading-tight mt-1 mb-2">PRODUÇÃO E<br/>CONSUMO</span>
                <svg viewBox="0 0 100 100" className="w-full max-w-[64px] mx-auto mt-auto mb-2" aria-hidden="true">
                  <g transform="translate(5, 10) scale(1.15)">
                    <path d="M 53 45 C 45 45 45 65 30 65 C 15 65 15 45 30 45 C 45 45 45 65 60 65 C 75 65 75 45 65 45" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" />
                    <polygon points="56,38 45,45 56,52" fill="white"/>
                  </g>
                </svg>
              </div>

              {/* ODS 17 — Parcerias para o Desenvolvimento */}
              <div className="rounded-xl p-3 flex flex-col items-start" style={{ background: "#3B5E7E" }}>
                <span className="text-white font-black text-3xl leading-none tracking-tighter">17</span>
                <span className="text-white text-[11px] font-bold uppercase leading-tight mt-1 mb-2">PARCERIAS<br/>GLOBAIS</span>
                <svg viewBox="0 0 100 100" className="w-full max-w-[64px] mx-auto mt-auto mb-2" aria-hidden="true">
                  <g fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" transform="translate(0, -2) scale(1.05)">
                    <circle cx="50" cy="38.5" r="14" />
                    <circle cx="60.9" cy="46.5" r="14" />
                    <circle cx="56.8" cy="59.3" r="14" />
                    <circle cx="43.2" cy="59.3" r="14" />
                    <circle cx="39.1" cy="46.5" r="14" />
                  </g>
                </svg>
              </div>

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
              desenvolvido por alunos de Escola Técnica Estadual.
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
                  Escola Técnica Estadual | Projeto Interdisciplinar 2026
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
