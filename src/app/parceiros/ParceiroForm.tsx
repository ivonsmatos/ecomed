"use client";

import { useState } from "react";

const PARTNER_TYPES = [
  {
    icon: "🏥",
    title: "Farmácias",
    color: "#24A645",
    offer:
      'Visibilidade no mapa com selo "Farmácia Parceira EcoMed", relatório mensal de tráfego direcionado, material educativo digital para clientes.',
    ask: "Ponto de coleta ativo, QR Code no balcão, validação de dados.",
    revenue: "Gratuito no MVP. V1.0: R$ 50–150/mês (selo + relatório).",
    cta: "Cadastre sua farmácia",
  },
  {
    icon: "🏭",
    title: "Indústria Farmacêutica",
    color: "#1A736A",
    offer:
      "Relatório de impacto ESG trimestral com dados reais, missões temáticas patrocinadas com branding, compliance com Decreto 10.388.",
    ask: "Financiamento (grant/patrocínio), dados agregados para compliance, divulgação interna.",
    revenue: "R$ 2–5k/trimestre (relatório ESG + missões).",
    cta: "Solicite relatório demo",
  },
  {
    icon: "🏫",
    title: "Escolas e Universidades",
    color: "#3E8C8C",
    offer:
      "Quizzes educativos prontos para aula, desafios entre turmas com ranking, certificados para alunos, dados para pesquisa acadêmica.",
    ask: "Alunos como usuários, validação acadêmica, contribuições open source.",
    revenue: "Gratuito (troca de valor educacional).",
    cta: "Leve o EcoMed para sua escola",
  },
  {
    icon: "🏛️",
    title: "Secretarias de Saúde",
    color: "#2563EB",
    offer:
      "Ferramenta gratuita de educação em descarte, dados agregados por região, material para UBS e agentes comunitários.",
    ask: "Divulgação em UBS (QR Code), dados oficiais de pontos de coleta, carta de apoio institucional.",
    revenue: "Gratuito (parceria institucional).",
    cta: "Agende uma apresentação",
  },
  {
    icon: "🌿",
    title: "ONGs Ambientais",
    color: "#059669",
    offer:
      "Co-branding em eventos e campanhas, missões especiais no app, dados de impacto ambiental, divulgação cruzada.",
    ask: "Alcance nas redes sociais, legitimidade ambiental, eventos conjuntos.",
    revenue: "Gratuito (troca de divulgação).",
    cta: "Proponha uma campanha",
  },
];

const FAQS = [
  {
    q: "Preciso pagar para ser parceiro?",
    a: "Não no MVP. A parceria básica (aparecer no mapa + receber relatório) é gratuita. Serviços premium (selo destacado, relatório ESG expandido) terão custo a partir da V1.0.",
  },
  {
    q: "Quanto tempo leva para ativar a parceria?",
    a: "Após o primeiro contato, a ativação leva 2–3 dias úteis. Envolve: coletar dados, inserir no mapa, gerar QR Code e entregar material.",
  },
  {
    q: "Que dados aparecem no relatório mensal?",
    a: 'Usuários direcionados à sua localização, cliques em "Como chegar", descartes registrados, litros de água protegidos, comparação com mês anterior e ranking entre parceiros.',
  },
  {
    q: "Meus dados ficam públicos?",
    a: "Apenas nome, endereço, horário e tipos de medicamento aceitos (informações que já são públicas no LogMed). Dados de tráfego e métricas são exclusivos para o parceiro.",
  },
  {
    q: "Posso indicar outra farmácia?",
    a: "Sim! Envie os dados pelo formulário ou por e-mail. Quanto mais farmácias no mapa, melhor para todos os usuários.",
  },
  {
    q: "O EcoMed é confiável?",
    a: "Sim. Somos open source (código auditável no GitHub), LGPD compliant, com IA local (dados não saem do servidor) e orientação do Prof. Ivon Matos.",
  },
];

function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <div className="flex flex-col gap-3 max-w-2xl mt-6">
      {FAQS.map((faq, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden"
        >
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full px-5 py-4 flex justify-between items-center text-left cursor-pointer bg-transparent border-none font-sans"
          >
            <span className="text-sm font-semibold text-gray-900">
              {faq.q}
            </span>
            <span
              className="text-gray-400 text-base transition-transform duration-200 shrink-0 ml-3"
              style={{
                transform: openIndex === i ? "rotate(180deg)" : "none",
              }}
            >
              ▼
            </span>
          </button>
          {openIndex === i && (
            <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function PartnerTypesSection() {
  const scrollToForm = () => {
    document.getElementById("formulario")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 max-w-4xl">
        <span className="inline-block text-eco-teal text-xs font-bold uppercase tracking-widest mb-2">
          Tipos de Parceria
        </span>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-6 tracking-tight">
          Encontre o modelo certo para você
        </h2>
        <div className="flex flex-col gap-5">
          {PARTNER_TYPES.map((pt, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-gray-300 hover:shadow-md transition-all"
              style={{ borderTop: `4px solid ${pt.color}` }}
            >
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{pt.icon}</span>
                    <h3 className="text-xl font-bold text-gray-900">
                      {pt.title}
                    </h3>
                  </div>
                  <div className="mb-3">
                    <div className="text-xs font-bold text-eco-teal mb-1 uppercase tracking-wide">
                      O Que Oferecemos
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {pt.offer}
                    </p>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-eco-teal mb-1 uppercase tracking-wide">
                      O Que Pedimos
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {pt.ask}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col justify-between">
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <div className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wide">
                      Investimento
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {pt.revenue}
                    </div>
                  </div>
                  <button
                    onClick={scrollToForm}
                    className="w-full py-3 px-5 rounded-xl text-sm font-semibold text-white cursor-pointer border-none transition-opacity hover:opacity-90"
                    style={{ background: pt.color }}
                  >
                    {pt.cta} →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="bg-green-50 border-2 border-eco-green rounded-2xl p-8 text-center max-w-lg">
        <div className="text-5xl mb-4">✅</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Formulário enviado!
        </h3>
        <p className="text-sm text-gray-600">
          Entraremos em contato em até 48 horas pelo e-mail informado. Obrigado
          pelo interesse em ser parceiro do EcoMed!
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
      className="max-w-lg"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1">
            Nome completo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Seu nome"
            required
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-eco-teal focus:ring-2 focus:ring-eco-teal/20 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1">
            E-mail <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            placeholder="seu@email.com"
            required
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-eco-teal focus:ring-2 focus:ring-eco-teal/20 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1">
            Telefone/WhatsApp <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            placeholder="(11) 99999-8888"
            required
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-eco-teal focus:ring-2 focus:ring-eco-teal/20 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1">
            Cargo/Função
          </label>
          <input
            type="text"
            placeholder="Farmacêutico, Professor..."
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-eco-teal focus:ring-2 focus:ring-eco-teal/20 transition-all"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-semibold text-gray-900 mb-1">
          Nome da organização <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="Nome da farmácia, escola, empresa..."
          required
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-eco-teal focus:ring-2 focus:ring-eco-teal/20 transition-all"
        />
      </div>

      <div className="mt-4">
        <label className="block text-sm font-semibold text-gray-900 mb-1">
          Tipo de parceria <span className="text-red-500">*</span>
        </label>
        <select
          required
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-eco-teal focus:ring-2 focus:ring-eco-teal/20 transition-all cursor-pointer bg-white"
        >
          <option value="">Selecione o tipo</option>
          {[
            "Farmácia",
            "Indústria Farmacêutica",
            "Escola / Universidade",
            "Secretaria de Saúde",
            "ONG Ambiental",
            "Outro",
          ].map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-semibold text-gray-900 mb-1">
          Cidade / Estado <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="São Paulo, SP"
          required
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-eco-teal focus:ring-2 focus:ring-eco-teal/20 transition-all"
        />
      </div>

      <div className="mt-4">
        <label className="block text-sm font-semibold text-gray-900 mb-1">
          Mensagem (opcional)
        </label>
        <textarea
          placeholder="Conte mais sobre como gostaria de colaborar com o EcoMed..."
          rows={4}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-eco-teal focus:ring-2 focus:ring-eco-teal/20 transition-all resize-y"
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          className="bg-eco-green text-white px-8 py-3 rounded-lg text-base font-bold hover:bg-eco-green/90 transition-colors cursor-pointer border-none"
        >
          Enviar Formulário
        </button>
        <span className="text-xs text-gray-400">
          Ou envie e-mail direto para{" "}
          <a
            href="mailto:parcerias@ecomed.eco.br"
            className="text-eco-teal hover:underline"
          >
            parcerias@ecomed.eco.br
          </a>
        </span>
      </div>
    </form>
  );
}

export function CTAScrollButton() {
  return (
    <button
      onClick={() =>
        document.getElementById("formulario")?.scrollIntoView({ behavior: "smooth" })
      }
      className="bg-eco-green text-white px-8 py-3.5 rounded-lg text-base font-bold hover:bg-eco-green/90 transition-colors cursor-pointer border-none"
    >
      Preencher Formulário
    </button>
  );
}

export { FAQAccordion };
