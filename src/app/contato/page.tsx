import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Phone, ExternalLink, Building2, Shield, Leaf, Globe, MessageCircle } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Contato | EcoMed",
  description:
    "Entre em contato com o EcoMed e confira os órgãos públicos responsáveis pelo descarte correto de medicamentos no Brasil: ANVISA, Ministério e Secretarias de Saúde, MMA e mais.",
  alternates: { canonical: "https://ecomed.eco.br/contato" },
};

/* ─── Órgãos responsáveis ───────────────────────────────────────────────── */
const orgaos = [
  {
    nome: "ANVISA",
    descricao:
      "Agência Nacional de Vigilância Sanitária — regula a destinação de resíduos farmacêuticos e fiscaliza a logística reversa de medicamentos no Brasil.",
    href: "https://www.gov.br/anvisa/pt-br",
    telefone: "0800 642 9782",
    icon: Shield,
    tag: "Regulação federal",
  },
  {
    nome: "Ministério da Saúde",
    descricao:
      "Formula políticas públicas nacionais de saúde e orienta campanhas de educação sanitária, incluindo descarte correto e uso racional de medicamentos.",
    href: "https://www.gov.br/saude/pt-br",
    telefone: "136",
    icon: Globe,
    tag: "Saúde pública federal",
  },
  {
    nome: "Secretaria de Estado da Saúde de São Paulo",
    descricao:
      "Coordena políticas estaduais de saúde, vigilância e ações de apoio à rede pública para prevenção de riscos sanitários e ambientais.",
    href: "https://www.saude.sp.gov.br",
    icon: Building2,
    tag: "Gestão estadual",
  },
  {
    nome: "Secretaria Municipal da Saúde de São Paulo",
    descricao:
      "Responsável pela rede municipal de saúde e ações locais de orientação à população sobre descarte e prevenção de riscos à saúde.",
    href: "https://www.prefeitura.sp.gov.br/cidade/secretarias/saude/",
    icon: Building2,
    tag: "Gestão municipal",
  },
  {
    nome: "Ministério do Meio Ambiente (MMA)",
    descricao:
      "Coordena a Política Nacional de Resíduos Sólidos (PNRS — Lei 12.305/2010) e supervisiona os programas de logística reversa de produtos pós-consumo.",
    href: "https://www.gov.br/mma/pt-br",
    icon: Leaf,
    tag: "Resíduos sólidos",
  },
  {
    nome: "SINIR",
    descricao:
      "Sistema Nacional de Informações sobre a Gestão dos Resíduos Sólidos — portal oficial para consulta de dados sobre geração e destinação de resíduos sólidos no Brasil.",
    href: "https://sinir.gov.br",
    icon: Globe,
    tag: "Dados e relatórios",
  },
  {
    nome: "ABRADILAN",
    descricao:
      "Associação Brasileira de Drogarias e Farmácias Independentes — representa os pontos de coleta LogMed em farmácias independentes em todo o país.",
    href: "https://www.abradilan.com.br",
    icon: Building2,
    tag: "Setor farmacêutico",
  },
  {
    nome: "LogMed",
    descricao:
      "Sistema oficial de Logística Reversa de Medicamentos, instituído pelo Decreto Federal 10.388/2020. Gerencia a coleta e destinação ambientalmente correta de medicamentos domiciliares vencidos ou em desuso.",
    href: "https://www.logmed.org.br",
    icon: Globe,
    tag: "Logística reversa",
  },
  {
    nome: "IBAMA",
    descricao:
      "Instituto Brasileiro do Meio Ambiente e dos Recursos Naturais Renováveis — fiscaliza o cumprimento das normas ambientais relativas ao descarte de resíduos farmacêuticos.",
    href: "https://www.gov.br/ibama/pt-br",
    icon: Shield,
    tag: "Fiscalização ambiental",
  },
];

/* ─── Links úteis ───────────────────────────────────────────────────────── */
const linksUteis = [
  {
    label: "Decreto Federal 10.388/2020 — Logística Reversa de Medicamentos",
    href: "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2020/decreto/D10388.htm",
  },
  {
    label: "Lei 12.305/2010 — Política Nacional de Resíduos Sólidos (PNRS)",
    href: "https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2010/lei/l12305.htm",
  },
  {
    label: "RDC ANVISA nº 306/2004 — Resíduos de Serviços de Saúde",
    href: "https://bvsms.saude.gov.br/bvs/saudelegis/anvisa/2004/res0306_07_12_2004.html",
  },
  {
    label: "Resolução CONAMA nº 358/2005 — Resíduos Farmacêuticos",
    href: "https://www.ibama.gov.br/sophia/cnia/legislacao/CONAMA/RE0358-290405.PDF",
  },
  {
    label: "Disque Saúde — Ministério da Saúde (136)",
    href: "https://www.gov.br/saude/pt-br/acesso-a-informacao/disque-saude",
  },
  {
    label: "Secretaria de Estado da Saúde de São Paulo",
    href: "https://www.saude.sp.gov.br",
  },
  {
    label: "Secretaria Municipal da Saúde de São Paulo",
    href: "https://www.prefeitura.sp.gov.br/cidade/secretarias/saude/",
  },
];

const contatosInstitucionais = [
  {
    label: "Contato geral",
    value: "contato@ecomed.eco.br",
    href: "mailto:contato@ecomed.eco.br",
    description: "Dúvidas gerais, imprensa e assuntos institucionais.",
    icon: Mail,
  },
  {
    label: "Parcerias",
    value: "parceiro@ecomed.eco.br",
    href: "mailto:parceiro@ecomed.eco.br",
    description: "Farmácias, instituições, empresas e órgãos públicos.",
    icon: Building2,
  },
  {
    label: "Suporte",
    value: "suporte@ecomed.eco.br",
    href: "mailto:suporte@ecomed.eco.br",
    description: "Problemas técnicos na plataforma e acesso de conta.",
    icon: Mail,
  },
  {
    label: "WhatsApp",
    value: "(11) 94190-6079",
    href: "https://wa.me/5511941906079?text=Olá%2C%20quero%20falar%20com%20o%20EcoMed.",
    description: "Atendimento direto para orientações e contato rápido.",
    icon: MessageCircle,
  },
] as const;

export default function ContatoPage() {
  return (
    <>
      <Header />
      <main>

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="bg-[#0d3b1a] py-24 text-center">
          <div className="container mx-auto px-4 max-w-3xl">
            <span className="inline-block text-eco-lime text-sm font-medium uppercase tracking-wider mb-4">
              Fale conosco
            </span>
            <h1 className="font-sans text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-6">
              Contato e{" "}
              <span className="text-eco-lime">Órgãos Responsáveis</span>
            </h1>
            <p className="text-white/80 text-lg leading-relaxed">
              Entre em contato com o EcoMed ou consulte diretamente os órgãos
              reguladores e entidades responsáveis pelo descarte correto de
              medicamentos no Brasil.
            </p>
          </div>
        </section>

        {/* ── Contato EcoMed ───────────────────────────────────────────── */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="font-sans text-3xl font-bold text-gray-900 mb-3">
                Fale com o EcoMed
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                Para dúvidas, parcerias, imprensa ou suporte técnico — estamos
                disponíveis pelos canais abaixo.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              {contatosInstitucionais.map((contato) => {
                const Icon = contato.icon;

                return (
                  <a
                    key={contato.href}
                    href={contato.href}
                    target={contato.href.startsWith("http") ? "_blank" : undefined}
                    rel={contato.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="flex items-start gap-4 rounded-2xl border border-gray-200 p-6 hover:border-eco-lime hover:shadow-md transition-all group bg-white"
                  >
                    <div className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-xl bg-eco-teal/10 text-eco-lime group-hover:bg-eco-teal group-hover:text-white transition-colors">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">{contato.label}</p>
                      <p className="font-semibold text-gray-900 break-all">{contato.value}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{contato.description}</p>
                    </div>
                  </a>
                );
              })}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="tel:+5511941906079"
                className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:border-eco-lime hover:text-gray-900 transition-colors"
              >
                <Phone className="size-4 text-eco-lime" />
                Ligar para (11) 94190-6079
              </a>
              <a
                href="https://wa.me/5511941906079?text=Olá%2C%20quero%20falar%20com%20o%20EcoMed."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-eco-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-eco-green/90 transition-colors"
              >
                <MessageCircle className="size-4" />
                Falar no WhatsApp
              </a>
            </div>

            <p className="text-center text-sm text-gray-400 mt-8">
              Respondemos em até 2 dias úteis. Para urgências de saúde, contate{" "}
              <a href="tel:136" className="text-eco-lime font-medium hover:underline">
                Disque Saúde (136)
              </a>
              .
            </p>
          </div>
        </section>

        {/* ── Órgãos responsáveis ─────────────────────────────────────── */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-12">
              <span className="inline-block text-eco-lime text-xs font-semibold uppercase tracking-wider mb-3">
                Regulação e fiscalização
              </span>
              <h2 className="font-sans text-3xl font-bold text-gray-900 mb-3">
                Órgãos Responsáveis e Canais Públicos
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                O descarte correto de medicamentos é regulado por lei federal e
                fiscalizado por diferentes instâncias governamentais. Conheça
                as entidades responsáveis.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {orgaos.map((o) => {
                const Icon = o.icon;
                return (
                  <a
                    key={o.nome}
                    href={o.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col gap-4 rounded-2xl bg-white border border-gray-200 p-6
                               hover:border-eco-lime hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center
                                        rounded-xl bg-eco-teal/10 text-eco-lime group-hover:bg-eco-teal group-hover:text-white transition-colors">
                          <Icon className="size-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 leading-tight">{o.nome}</h3>
                          <span className="text-xs text-eco-lime font-medium">{o.tag}</span>
                        </div>
                      </div>
                      <ExternalLink className="size-4 text-gray-300 group-hover:text-eco-lime shrink-0 mt-1 transition-colors" />
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">{o.descricao}</p>
                    {o.telefone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                        <Phone className="size-3.5 text-eco-lime" />
                        {o.telefone}
                      </div>
                    )}
                    <span className="text-xs text-eco-lime group-hover:underline font-medium mt-auto">
                      Acessar site oficial →
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Legislação e links úteis ─────────────────────────────────── */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center mb-10">
              <h2 className="font-sans text-3xl font-bold text-gray-900 mb-3">
                Legislação e Links Úteis
              </h2>
              <p className="text-gray-500">
                Documentos oficiais que regulamentam o descarte correto de medicamentos no Brasil.
              </p>
            </div>

            <ul className="space-y-3">
              {linksUteis.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-gray-200 px-5 py-4
                               hover:border-eco-lime hover:bg-eco-teal/10 transition-all group"
                  >
                    <ExternalLink className="size-4 text-gray-300 group-hover:text-eco-lime shrink-0 transition-colors" />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">{l.label}</span>
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-12 rounded-2xl bg-[#0d3b1a] p-8 text-center">
              <p className="text-eco-lime text-sm font-semibold uppercase tracking-wider mb-2">
                Ficou com dúvidas?
              </p>
              <p className="text-white text-lg font-semibold mb-4">
                O EcoBot responde em segundos
              </p>
              <p className="text-white/70 text-sm mb-6">
                Nossa IA foi treinada com a legislação vigente, FAQs da ANVISA e guias de descarte.
              </p>
              <Link
                href="/app/chat"
                className="inline-flex items-center gap-2 rounded-full bg-eco-green px-6 py-3
                           text-white font-semibold text-sm hover:bg-[#6aa600] transition-colors"
              >
                Perguntar ao EcoBot
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
