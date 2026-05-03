import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  ContactForm,
  CTAScrollButton,
  FAQAccordion,
  PartnerTypesSection,
} from "./ParceiroForm";

export const metadata: Metadata = {
  title: "Parcerias | EcoMed",
  description:
    "Seja parceiro do EcoMed. Farmácias, indústria farmacêutica, escolas, secretarias de saúde e ONGs juntos pelo descarte consciente de medicamentos no Brasil.",
  alternates: { canonical: "https://ecomed.eco.br/parceiros" },
};

export default function ParceirosPage() {
  return (
    <>
      <Header />
      <main>

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <section className="bg-[#1A736A] py-20 relative overflow-hidden">
          <div
            className="absolute top-[-80px] right-[-80px] w-[350px] h-[350px] rounded-full bg-eco-green opacity-10 pointer-events-none"
            aria-hidden="true"
          />
          <div className="container mx-auto px-4 max-w-4xl relative z-10">
            <span className="inline-block text-eco-lime text-xs font-bold uppercase tracking-widest mb-3">
              Parcerias
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-5 max-w-2xl tracking-tight">
              Juntos pelo descarte consciente
            </h1>
            <p className="text-lg text-[#D9D6D0] leading-relaxed max-w-xl mb-8">
              O EcoMed conecta farmácias, indústria, escolas, governo e ONGs em
              uma rede de impacto ambiental. Cada parceiro amplifica o alcance
              da educação sobre descarte correto.
            </p>
            <div className="flex gap-8 flex-wrap">
              {[
                { v: "7.500+", l: "pontos de coleta" },
                { v: "6", l: "ODS da ONU" },
                { v: "R$ 0", l: "custo para começar" },
              ].map((s, i) => (
                <div key={i}>
                  <div className="text-3xl font-extrabold text-eco-lime">
                    {s.v}
                  </div>
                  <div className="text-xs text-[#D9D6D0] mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Por que ser parceiro? ──────────────────────────────────── */}
        <section id="porque" className="py-16 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <span className="inline-block text-eco-teal text-xs font-bold uppercase tracking-widest mb-2">
              Por que ser parceiro?
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 tracking-tight">
              O EcoMed entrega valor real
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                {
                  i: "📊",
                  t: "Relatórios de Impacto",
                  d: "Dados mensuráveis de descarte, litros protegidos e engajamento prontos para relatório ESG.",
                },
                {
                  i: "📍",
                  t: "Visibilidade no Mapa",
                  d: "Sua farmácia ou instituição aparece para milhares de usuários buscando onde descartar.",
                },
                {
                  i: "🎯",
                  t: "Tráfego Qualificado",
                  d: "Usuários chegam até você com intenção real de descartar potencial de up-sell natural.",
                },
                {
                  i: "🏅",
                  t: "Selo de Parceiro",
                  d: 'Badge "Parceiro EcoMed" visível no mapa, site e materiais diferenciação competitiva.',
                },
                {
                  i: "📚",
                  t: "Material Educativo",
                  d: "Artigos, quizzes e infográficos prontos para compartilhar com clientes, alunos ou comunidade.",
                },
                {
                  i: "🌍",
                  t: "Impacto Ambiental Real",
                  d: "Cada parceria contribui diretamente para os ODS 3, 6 e 12. Dados públicos e verificáveis.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-eco-teal hover:shadow-md transition-all"
                >
                  <div className="text-3xl mb-3">{item.i}</div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">
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

        {/* ── Tipos de Parceria (client component) ──────────────────── */}
        <PartnerTypesSection />

        {/* ── Como Funciona ─────────────────────────────────────────── */}
        <section id="como-funciona" className="py-16 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <span className="inline-block text-eco-teal text-xs font-bold uppercase tracking-widest mb-2">
              Como Funciona
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-8 tracking-tight">
              Da conversa ao impacto em 4 passos
            </h2>
            <div className="flex flex-col gap-6 max-w-lg">
              {[
                {
                  n: "1",
                  t: "Primeiro Contato",
                  d: "Preencha o formulário abaixo ou envie e-mail para parcerias@ecomed.eco.br. Respondemos em até 48h.",
                  cl: "#24A645",
                },
                {
                  n: "2",
                  t: "Apresentação",
                  d: "Agendamos uma reunião de 15 minutos (presencial ou vídeo) para mostrar o EcoMed e entender suas necessidades.",
                  cl: "#3E8C8C",
                },
                {
                  n: "3",
                  t: "Ativação",
                  d: "Cadastramos seu ponto no mapa, geramos QR Code personalizado e entregamos material impresso com selo de parceiro.",
                  cl: "#1A736A",
                },
                {
                  n: "4",
                  t: "Acompanhamento",
                  d: "Enviamos relatório mensal de impacto com métricas de tráfego, descartes e litros de água protegidos.",
                  cl: "#D4A017",
                },
              ].map((s, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-extrabold text-base shrink-0"
                    style={{ background: s.cl }}
                  >
                    {s.n}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">
                      {s.t}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {s.d}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Números que importam ───────────────────────────────────── */}
        <section className="bg-[#1A736A] py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <span className="inline-block text-eco-lime text-xs font-bold uppercase tracking-widest mb-2">
              Impacto dos Parceiros
            </span>
            <h2 className="text-3xl font-extrabold text-white mb-4 tracking-tight">
              Números que importam
            </h2>
            <p className="text-[#D9D6D0] leading-relaxed mb-8 max-w-lg">
              Cada farmácia parceira no mapa do EcoMed direciona usuários
              ativamente para o descarte correto. Esses são os resultados que
              compartilhamos no relatório mensal:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { i: "👥", v: "50+", l: "usuários direcionados/mês por farmácia" },
                { i: "💊", v: "10+", l: "descartes registrados/mês por ponto" },
                { i: "💧", v: "4,5M L", l: "de água protegidos por farmácia/mês" },
                { i: "📈", v: "+38,5%", l: "crescimento LogMed 2024 vs 2023" },
              ].map((s, i) => (
                <div
                  key={i}
                  className="bg-white/10 rounded-xl p-5 text-center"
                >
                  <div className="text-2xl mb-1">{s.i}</div>
                  <div className="text-3xl font-extrabold text-eco-lime">
                    {s.v}
                  </div>
                  <div className="text-xs text-[#D9D6D0] mt-1">{s.l}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-white/30 mt-4 text-center">
              Projeções baseadas em modelagem com 1.000 usuários ativos. Dados
              reais disponíveis após lançamento.
            </p>
          </div>
        </section>

        {/* ── Formulário de Parceria ─────────────────────────────────── */}
        <section id="formulario" className="py-16 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <span className="inline-block text-eco-teal text-xs font-bold uppercase tracking-widest mb-2">
              Formulário de Parceria
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">
              Vamos conversar?
            </h2>
            <p className="text-gray-600 leading-relaxed mb-8 max-w-lg">
              Preencha os dados abaixo e entraremos em contato em até 48 horas.
              Sem compromisso.
            </p>
            <ContactForm />
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────────── */}
        <section id="faq" className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-4xl">
            <span className="inline-block text-eco-teal text-xs font-bold uppercase tracking-widest mb-2">
              Dúvidas Frequentes
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              FAQ para Parceiros
            </h2>
            <FAQAccordion />
          </div>
        </section>

        {/* ── CTA Final ─────────────────────────────────────────────── */}
        <section className="bg-[#1A736A] py-16 text-center">
          <div className="container mx-auto px-4 max-w-xl">
            <h2 className="text-3xl font-extrabold text-white mb-3">
              Pronto para fazer parte?
            </h2>
            <p className="text-[#D9D6D0] text-base leading-relaxed mb-8">
              Cada parceiro amplia o alcance do descarte consciente. Juntos,
              protegemos a água, o solo e a saúde de todos.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <CTAScrollButton />
              <Link
                href="mailto:parcerias@ecomed.eco.br"
                className="bg-transparent text-white border-2 border-white px-7 py-3 rounded-lg text-sm font-semibold hover:bg-white/10 transition-colors"
              >
                parcerias@ecomed.eco.br
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
