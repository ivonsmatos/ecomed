import Link from "next/link";
import Image from "next/image";
import { MapPin, ArrowRight, ArrowUpRight, ChevronDown } from "lucide-react";
import { getLatestArticles } from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/image";

// A página já é dinâmica (Header usa auth/cookies). force-dynamic garante
// que getLatestArticles sempre busque artigos frescos do Sanity.
export const dynamic = "force-dynamic";

/* Ícones sociais inline (lucide-react v1.x removeu brand icons) */
const SvgInstagram = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>);
const SvgFacebook = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>);
const SvgTwitter = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l16 16M4 20L20 4"/></svg>);
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "https://ecomed.eco.br" },
};

/* ─── FAQ Data ───────────────────────────────────────────────────────────────── */
const faqItems = [
  {
    question: "Por que não posso jogar remédio no lixo ou na pia?",
    answer:
      "Um único comprimido pode contaminar até 450.000 litros de água. Antibióticos geram superbactérias resistentes. Hormônios afetam a vida aquática. As estações de tratamento não conseguem filtrar substâncias farmacêuticas. O descarte no lixo ou esgoto é proibido pela Lei 12.305/2010 (PNRS).",
  },
  {
    question: "Onde posso descartar medicamentos vencidos?",
    answer:
      "Existem mais de 7.500 pontos de coleta no Brasil pelo sistema LogMed (Decreto 10.388/2020): farmácias e drogarias parceiras, Unidades Básicas de Saúde (UBS), hospitais e ecopontos municipais. O EcoMed mapeia todos esses pontos — use o mapa para encontrar o mais próximo de você.",
  },
  {
    question: "Quais medicamentos posso entregar nos pontos de coleta?",
    answer:
      "São aceitos medicamentos vencidos, sobras de tratamento, comprimidos, cápsulas, xaropes, pomadas, ampolas e injetáveis de uso domiciliar — com ou sem embalagem. Não é necessário abrir embalagens nem retirar bulas. Leve tudo como está.",
  },
  {
    question: "Farmácias são obrigadas a aceitar medicamentos para descarte?",
    answer:
      "Sim. O Decreto Federal 10.388/2020 regulamenta a logística reversa de medicamentos domiciliares e obriga fabricantes, distribuidores e importadores a manter pontos de coleta acessíveis. Farmácias e drogarias são os principais pontos de recebimento no Brasil.",
  },
  {
    question: "O EcoMed é gratuito? Preciso criar conta?",
    answer:
      "O mapa de pontos de coleta é gratuito e não exige cadastro. Para acessar o EcoBot (IA), favoritar pontos e acumular EcoMed Coins, basta criar uma conta gratuita. O EcoMed não vende dados dos usuários e é LGPD compliant.",
  },
  {
    question: "Como minha farmácia pode aparecer no mapa do EcoMed?",
    answer:
      "Farmácias e estabelecimentos com ponto de coleta LogMed podem se cadastrar gratuitamente. Após verificação pela nossa equipe, o ponto aparece no mapa, recebe o badge \"Farmácia Parceira EcoMed\" e você passa a receber relatórios mensais de usuários direcionados até você.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

/* ─── Sections Data ─────────────────────────────────────────────────────────── */
const sliderItems = [
  "Medicamentos Vencidos",
  "Descarte Correto",
  "Meio Ambiente",
  "Pontos de Coleta",
  "Logística Reversa",
  "Saúde Pública",
  "EcoMed Coins",
  "450 mil Litros Protegidos",
  "#DescarteCerto",
];

const services = [
  {
    img: "/echofy/service-thumb.webp",
    icon: "/echofy/service-icon1.png",
    shape: "/echofy/service-shape.png",
    title: "📍 Encontre — Mapa Interativo",
    desc: "Veja os pontos de coleta mais próximos de você: farmácias LogMed, UBS e hospitais. Filtros por tipo, horário de funcionamento e rota direta no Google Maps ou Waze.",
    href: "/mapa",
  },
  {
    img: "/echofy/service-thumb2.webp",
    icon: "/echofy/service-icon2.png",
    shape: "/echofy/service-shape.png",
    title: "💬 Pergunte — EcoBot com IA",
    desc: "Tire dúvidas com o EcoBot, nosso assistente de inteligência artificial. Responde em linguagem simples sobre descarte, legislação e impacto ambiental — disponível 24 horas.",
    href: "/app/chat",
  },
  {
    img: "/echofy/service-thumb3.webp",
    icon: "/echofy/service-icon3.png",
    shape: "/echofy/service-shape.png",
    title: "🪙 Ganhe — EcoMed Coins",
    desc: "Cada descarte correto, artigo lido ou quiz respondido gera EcoMed Coins. Suba de nível, complete missões e receba recompensas — porque cuidar do planeta merece reconhecimento.",
    href: "/app",
  },
];

const counters = [
  { icon: "/echofy/counter-icon.png",  value: "91%",     label: "Descartam incorretamente" },
  { icon: "/echofy/counter-icon2.png", value: "7.500+",  label: "Pontos de coleta no Brasil" },
  { icon: "/echofy/counter-icon3.png", value: "30mil",   label: "Toneladas descartadas/ano" },
  { icon: "/echofy/counter-icon4.png", value: "450mil",  label: "Litros de água protegidos" },
];

const steps = [
  {
    icon: "/echofy/process-icon.png",
    arrow: "/echofy/process-arrow.png",
    title: "Encontre o ponto",
    desc: "Use o mapa para localizar o ponto de coleta de medicamentos mais próximo: farmácia, UBS ou ecoponto.",
  },
  {
    icon: "/echofy/process-icon2.png",
    arrow: "/echofy/process-arrow2.png",
    title: "Separe os medicamentos",
    desc: "Separe comprimidos, xaropes, pomadas e resíduos farmacêuticos. Não é preciso abrir as embalagens.",
  },
  {
    icon: "/echofy/process-icon3.png",
    arrow: null,
    title: "Faça o descarte correto",
    desc: "Leve ao ponto de coleta e entregue. Sua atitude protege rios, solos e a saúde de toda a comunidade.",
  },
];

/* ─── Page Component ────────────────────────────────────────────────────────── */
export default async function HomePage() {
  const latestArticles = await getLatestArticles(3);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Header />
      <main className="overflow-hidden">

        {/* ════════════════════════════════════════════════
            1. HERO — banner-bg.jpg | xl:h-[960px] | pt-36
        ════════════════════════════════════════════════ */}
        <section
          className="bg-[url('/banner-ecomed.jpg')] bg-cover bg-left lg:bg-center bg-no-repeat
                     h-[750px] sm:h-[700px] md:h-[750px] lg:h-[760px] xl:h-[960px]
                     flex items-center"
        >
          <div className="echofy-container">
            <div className="pt-36 relative">
              <div className="relative banner-content">
                <h5 className="font-sans text-eco-lime font-medium uppercase tracking-wider text-sm sm:text-base mb-3">
                  Descarte certo, planeta saudável
                </h5>
                <h1 className="font-sans font-extrabold text-white
                               text-[32px] sm:text-[56px] md:text-[70px] lg:text-[52px] xl:text-[62px] 2xl:text-[70px]
                               leading-tight">
                  Proteja o Planeta.
                </h1>
                <h1 className="font-sans font-extrabold text-white
                               text-[32px] sm:text-[56px] md:text-[70px] lg:text-[52px] xl:text-[62px] 2xl:text-[70px]
                               leading-tight -mt-3 sm:-mt-5">
                  <span className="text-eco-lime">Descarte Certo.</span>
                </h1>
                <p className="font-sans text-lg text-white/90 mb-10 max-w-xl">
                  91% dos brasileiros descartam medicamentos errado — não por má vontade,
                  mas porque ninguém ensinou como fazer certo. O EcoMed muda isso.
                </p>
                <div className="flex flex-col sm:flex-row gap-5">
                  <Link href="/mapa" className="echofy-btn">
                    <MapPin className="size-4" />
                    Encontrar Ponto
                    <Image src="/echofy/button-shape-1.png" alt="" width={24} height={24} draggable={false} />
                  </Link>
                  <Link href="/cadastrar" className="echofy-btn-outline">
                    Cadastrar Farmácia
                    <ArrowRight className="size-4" />
                  </Link>
                </div>

                {/* Social vertical — visible on xl+ like Echofy */}
                <div className="banner-share hidden xl:flex gap-[100px] items-center -rotate-90
                                absolute top-full -translate-y-1/2 xl:-left-[16%] 2xl:-left-[23%]">
                  <h5 className="font-sans text-white relative
                                 before:absolute before:top-1/2 before:-right-[82px] before:w-16 before:h-[1px] before:bg-gray-500">
                    FOLLOW US
                  </h5>
                  <ul className="flex gap-7 items-center">
                    <li>
                      <a href="https://www.instagram.com/ecomed.eco/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                         className="rotate-45 block text-white hover:text-eco-lime transition-colors">
                        <SvgInstagram />
                      </a>
                    </li>
                    <li>
                      <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                         className="rotate-45 block text-white hover:text-eco-lime transition-colors">
                        <SvgFacebook />
                      </a>
                    </li>
                    <li>
                      <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter/X"
                         className="rotate-45 block text-white hover:text-eco-lime transition-colors">
                        <SvgTwitter />
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════
            2. CONTENT SLIDER — bg:#79b900 | white text
               Duas cópias = scroll infinito sem JS
        ════════════════════════════════════════════════ */}
        <div className="echofy-content-slider-wrap">
          {[0, 1].map((g) => (
            <div key={g} className="echofy-content-slider">
              {sliderItems.map((item, i) => (
                <div key={i} className="flex items-center gap-[50px]">
                  <h3>{item}</h3>
                  <Image src="/echofy/text-shape.png" alt="" width={40} height={40} draggable={false} />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* ════════════════════════════════════════════════
            3. ABOUT — bg:about-bg.jpg
               Esquerda: about.png + about-award.png (float)
               Direita: sub-title-shape | about-icon | about-icon2
               about-shape-1.png (top-right, zoom) | about-shape.png (dance)
        ════════════════════════════════════════════════ */}
        <section className="py-[120px] bg-[url('/echofy/about-bg.jpg')] bg-no-repeat bg-center bg-cover relative">
          {/* about-shape-1.png — canto superior direito, zoom */}
          <Image
            src="/echofy/about-shape-1.png"
            alt=""
            width={80}
            height={80}
            draggable={false}
            className="absolute top-32 right-20 animate-echofy-zoom hidden 2xl:block"
          />

          <div className="echofy-container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-[92px] lg:gap-5 xl:gap-24 items-center">

              {/* Esquerda: about.png com about-award.png flutuando */}
              <div className="relative">
                <Image src="/echofy/about.webp" alt="Sobre o EcoMed" width={550} height={500}
                  className="w-full" draggable={false} />
              </div>

              {/* Direita: texto */}
              <div className="relative">
                <h5 className="font-sans font-medium text-eco-lime flex items-center gap-2 uppercase tracking-wider text-sm">
                  <Image src="/echofy/sub-title-shape.png" alt="" width={20} height={20} draggable={false} />
                  Sobre o EcoMed
                </h5>
                <h1 className="font-sans font-bold
                               text-[22px] leading-8 sm:text-[38px] sm:leading-[48px]
                               md:text-[44px] md:leading-[54px] lg:text-[32px] lg:leading-[42px]
                               xl:text-[40px] xl:leading-[50px] 2xl:text-[46px] 2xl:leading-[56px]
                               text-[#001819] mt-5 mb-3">
                  Descarte Sustentável<br />
                  para um Brasil Mais Verde
                </h1>

                {/* about-icon row 1 */}
                <div className="flex gap-6 mt-12">
                  <div className="shrink-0">
                    <Image src="/echofy/about-icon.png" alt="" width={56} height={56} draggable={false} />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-sans font-semibold text-2xl text-[#001819] -mt-2">
                      Impacto Ambiental
                    </h5>
                    <p className="font-sans text-gray-500 pt-3 leading-relaxed">
                      Medicamentos descartados no lixo ou esgoto contaminam rios e solos.
                      O descarte correto protege o ecossistema e a cadeia alimentar.
                    </p>
                  </div>
                </div>

                {/* about-icon2 row 2 */}
                <div className="flex gap-6 mt-9 pb-9 mb-10 border-b border-gray-200">
                  <div className="shrink-0">
                    <Image src="/echofy/about-icon2.png" alt="" width={56} height={56} draggable={false} />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-sans font-semibold text-2xl text-[#001819] -mt-2">
                      Saúde Pública
                    </h5>
                    <p className="font-sans text-gray-500 pt-3 leading-relaxed">
                      Antibióticos e hormônios no ambiente favorecem resistência bacteriana
                      e comprometem o abastecimento de água potável.
                    </p>
                  </div>
                </div>

                <Link href="/mapa" className="echofy-btn">
                  Saiba Mais
                  <Image src="/echofy/button-shape-1.png" alt="" width={24} height={24} draggable={false} />
                </Link>

                {/* about-shape.png — dançando no canto inferior */}
                <Image src="/echofy/about-shape.png" alt="" width={60} height={60}
                  draggable={false}
                  className="absolute -bottom-0 left-1/2 animate-echofy-dance hidden sm:block" />
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════
            4. SERVICES — bg:service-bg.jpg
               3 cards com service-shape.png no canto
               Hover: overlay escuro #001819
        ════════════════════════════════════════════════ */}
        <section className="relative pt-28 pb-[120px] bg-[url('/echofy/service-bg.jpg')] bg-cover bg-no-repeat bg-center">
          <div className="echofy-container">
            <div className="md:-mb-[11.2rem]">
              <h5 className="font-sans font-medium text-eco-lime flex items-center gap-2 uppercase tracking-wider text-sm">
                <Image src="/echofy/sub-title-shape.png" alt="" width={20} height={20} draggable={false} />
                Nossos Serviços
              </h5>
              <h1 className="font-sans font-bold
                             text-xl leading-6 sm:text-[38px] sm:leading-[48px]
                             md:text-[40px] md:leading-[54px] lg:text-[32px] lg:leading-[42px]
                             xl:text-[40px] xl:leading-[50px] 2xl:text-[46px] 2xl:leading-[56px]
                             text-[#001819] mt-5 mb-3 border-b border-gray-200 pb-9">
                EcoMed Oferece Tudo que<br />
                Você Precisa para Descartar
              </h1>
            </div>

            <div className="mt-[180px] sm:mt-[220px] md:mt-[200px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {services.map((s) => (
                <div key={s.title} className="echofy-service-card group">
                  {/* Imagem com overlay no hover */}
                  <div className="echofy-service-img-wrap">
                    <Image src={s.img} alt={s.title} width={400} height={260} className="w-full" draggable={false} />
                  </div>

                  {/* Ícone + botão seta */}
                  <div className="flex justify-between items-center mt-8 mb-6">
                    <Image src={s.icon} alt="" width={48} height={48} draggable={false} />
                    <Link href={s.href}>
                      <div className="echofy-service-arrow">
                        <ArrowUpRight className="size-5" />
                      </div>
                    </Link>
                  </div>

                  {/* Título */}
                  <Link href={s.href}>
                    <h3 className="echofy-service-title font-sans font-semibold text-[22px] pb-[10px]
                                   text-[#001819] transition-colors duration-500 relative
                                   before:absolute before:bottom-0 before:left-0 before:w-8 before:h-[2px] before:bg-eco-lime">
                      {s.title}
                    </h3>
                  </Link>

                  {/* Descrição */}
                  <p className="echofy-service-desc font-sans text-gray-500 pt-6 pb-[10px] transition-colors duration-500">
                    {s.desc}
                  </p>

                  {/* service-shape.png — canto inferior direito */}
                  <Image src={s.shape} alt="" width={120} height={120} draggable={false}
                    className="absolute -z-10 rotate-90 -bottom-28 -right-28 transition-all duration-500
                               group-hover:-bottom-[14px] group-hover:-right-2" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════
            5. COUNTER — bg:counter-bg.png | 4 colunas
        ════════════════════════════════════════════════ */}
        <section className="py-28 bg-[url('/counter-bg.png')] bg-no-repeat bg-cover bg-center">
          <div className="echofy-container">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-7 lg:gap-0 lg:grid-cols-4 items-center justify-center">
              {counters.map((c) => (
                <div key={c.label} className="text-center">
                  <Image src={c.icon} alt="" width={64} height={64} draggable={false} className="mx-auto" />
                  <p className="font-sans text-[46px] text-white font-bold mt-3 -mb-1">{c.value}</p>
                  <p className="font-sans text-white text-xl">{c.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════
            6. PROCESS — cards centralizados
               Círculo tracejado rotacionando = animate-echofy-rotate
               Seta entre cards: process-arrow.png (xl+)
        ════════════════════════════════════════════════ */}
        <section id="como-funciona" className="pb-10 relative z-10 pt-28 echofy-process-section">
          <div className="echofy-container">
            <div className="text-center">
              <h5 className="font-sans font-medium text-eco-lime flex items-center gap-2 justify-center uppercase tracking-wider text-sm">
                <Image src="/echofy/sub-title-shape.png" alt="" width={20} height={20} draggable={false} />
                Como Descartar
              </h5>
              <h1 className="font-sans font-bold
                             text-[22px] leading-8 sm:text-[38px] sm:leading-[48px]
                             md:text-[44px] md:leading-[54px] lg:text-[32px] lg:leading-[42px]
                             xl:text-[40px] xl:leading-[50px] 2xl:text-[46px] 2xl:leading-[56px]
                             text-[#001819] mt-5 mb-3">
                Processo para Descarte Seguro
              </h1>
            </div>

            <div className="pb-16 mt-[60px]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {steps.map((step, i) => (
                  <div key={i} className="text-center group relative">
                    {/* Ícone com círculo tracejado — imagem natural 180×207 (folha inclusa) */}
                    <div className="inline-block m-auto relative z-10
                                    before:absolute before:top-[18px] before:-left-[10px]
                                    before:w-[200px] before:h-[200px]
                                    before:border-2 before:border-dashed before:border-eco-lime
                                    before:rounded-full before:animate-echofy-rotate">
                      <Image src={step.icon} alt="" width={180} height={207} draggable={false} />

                      {/* Seta entre cards (xl+) */}
                      {step.arrow && (
                        <Image src={step.arrow} alt="" width={100} height={26} draggable={false}
                          className="absolute top-[120px] -translate-y-1/2 -right-[150px] 2xl:-right-[175px] hidden xl:block" />
                      )}
                    </div>

                    <h5 className="font-sans font-semibold text-[#001819] text-2xl mt-6 mb-4">
                      {step.title}
                    </h5>
                    <p className="font-sans text-gray-500 sm:w-2/3 md:w-full 2xl:w-3/4 mx-auto">
                      {step.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════
            7. CTA — bg:banner-bg2.jpg + overlay escuro
        ════════════════════════════════════════════════ */}
        <section className="py-[80px] bg-[url('/brand-bg.jpg')] bg-cover bg-center bg-no-repeat relative">
          <div className="absolute inset-0 bg-[#001819]/75" />
          <div className="echofy-container relative z-10 text-center">
            <h5 className="font-sans font-medium text-eco-lime text-sm uppercase tracking-widest mb-4">
              Sua farmácia já coleta medicamentos?
            </h5>
            <h2 className="font-sans font-bold text-white text-[28px] sm:text-[44px] leading-tight mb-6 max-w-2xl mx-auto">
              Cadastre gratuitamente e apareça no mapa do EcoMed
            </h2>
            <p className="font-sans text-white/75 mb-10 max-w-lg mx-auto">
              Ajude sua comunidade com o descarte correto de medicamentos.
              Verificação rápida e visibilidade para milhares de cidadãos.
            </p>
            <Link href="/cadastrar" className="echofy-btn">
              Cadastrar minha farmácia
              <Image src="/echofy/button-shape-1.png" alt="" width={24} height={24} draggable={false} />
            </Link>
          </div>
        </section>

        {/* ════════════════════════════════════════════════
            8. ÚLTIMOS ARTIGOS — bg:gray-50
        ════════════════════════════════════════════════ */}
        {latestArticles.length > 0 && (
          <section className="py-20 bg-gray-50">
            <div className="echofy-container">
              {/* Cabeçalho */}
              <div className="flex items-center justify-between mb-10">
                <h2 className="font-sans font-bold text-[28px] sm:text-[36px] text-[#001819]">
                  Últimos Artigos
                </h2>
                <Link href="/blog"
                  className="font-sans text-eco-teal-dark font-medium hover:text-eco-teal-dark transition-colors text-sm sm:text-base">
                  Ver todos &rarr;
                </Link>
              </div>

              {/* Grid de cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {latestArticles.map((article) => {
                  const coverUrl = article.coverImage
                    ? urlFor(article.coverImage).width(600).height(340).url()
                    : null;
                  const dateStr = article.publishedAt
                    ? new Date(article.publishedAt).toLocaleDateString("pt-BR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : null;
                  return (
                    <Link
                      key={article._id}
                      href={`/blog/${article.slug}`}
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow"
                    >
                      {/* Imagem */}
                      {coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={coverUrl}
                          alt={article.coverImage?.alt ?? article.title}
                          className="w-full h-44 object-cover"
                        />
                      ) : (
                        <div className="w-full h-44 bg-eco-teal/10 flex items-center justify-center">
                          <span className="text-green-300 text-4xl">🌿</span>
                        </div>
                      )}

                      {/* Conteúdo */}
                      <div className="flex flex-col flex-1 p-5">
                        {dateStr && (
                          <p className="font-sans text-xs text-gray-400 mb-2">{dateStr}</p>
                        )}
                        <h3 className="font-sans font-bold text-[#001819] text-base leading-snug mb-2 line-clamp-2">
                          {article.title}
                        </h3>
                        {article.excerpt && (
                          <p className="font-sans text-gray-500 text-sm leading-relaxed line-clamp-3 mb-3">
                            {article.excerpt}
                          </p>
                        )}
                        {article.aiSummary && (
                          <p className="font-sans text-xs text-eco-teal-dark italic line-clamp-2 mt-auto">
                            IA: {article.aiSummary}
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════════
            9. COMPROMISSO — teaser institucional
        ════════════════════════════════════════════════ */}
        <section className="py-28 bg-[#0d3b1a] relative overflow-hidden">
          <Image
            src="/echofy/about-shape.png"
            alt=""
            width={90}
            height={90}
            draggable={false}
            className="absolute top-10 left-10 animate-echofy-dance hidden xl:block"
          />
          <Image
            src="/echofy/about-shape-1.png"
            alt=""
            width={80}
            height={80}
            draggable={false}
            className="absolute bottom-10 right-10 animate-echofy-zoom hidden xl:block"
          />

          <div className="echofy-container relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h5 className="font-sans font-medium text-eco-lime flex items-center gap-2 justify-center text-sm uppercase tracking-wider">
                <Image src="/echofy/sub-title-shape.png" alt="" width={20} height={20} draggable={false} />
                Compromisso EcoMed
              </h5>
              <h2 className="font-sans font-bold text-[30px] sm:text-[44px] text-white mt-4 leading-tight">
                Tecnologia com propósito para
                <span className="text-eco-lime"> descarte correto</span>
              </h2>
              <p className="font-sans text-white/80 text-base sm:text-lg mt-5 max-w-3xl mx-auto leading-relaxed">
                Conheça os compromissos institucionais que orientam nossas decisões de produto,
                conteúdo e impacto: sustentabilidade, educação acessível, transparência e inovação
                responsável com IA.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-9">
                {[
                  "Sustentabilidade em primeiro lugar",
                  "Educação acessível para todos",
                  "Impacto mensurável e transparente",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 font-sans text-sm text-white"
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-9 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/compromisso"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-eco-green px-7 py-3 font-sans font-semibold text-white transition-colors hover:bg-eco-green/90"
                >
                  Ver página de compromisso
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/mapa"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-7 py-3 font-sans font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Encontrar ponto de coleta
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════
          10. FAQ — bg:about-bg.jpg
        ════════════════════════════════════════════════ */}
        <section id="faq" className="py-[100px] bg-[url('/echofy/about-bg.jpg')] bg-cover bg-center bg-no-repeat">
          <div className="echofy-container max-w-3xl">
            <div className="text-center mb-14">
              <h5 className="font-sans font-medium text-eco-lime flex items-center gap-2 justify-center text-sm uppercase tracking-wider">
                <Image src="/echofy/sub-title-shape.png" alt="" width={20} height={20} draggable={false} />
                Perguntas Frequentes
              </h5>
              <h2 className="font-sans font-bold text-[28px] sm:text-[42px] text-[#001819] mt-4">
                Tudo sobre descarte correto<br className="hidden sm:block" />
                de medicamentos no Brasil
              </h2>
            </div>
            <dl className="space-y-4">
              {faqItems.map((item) => (
                <div key={item.question} className="bg-white/90 rounded-xl border border-gray-100 p-6 shadow-sm backdrop-blur-sm">
                  <dt className="flex items-start justify-between gap-4">
                    <span className="font-sans font-semibold text-[#001819]">{item.question}</span>
                    <ChevronDown className="size-5 shrink-0 text-eco-lime mt-0.5" />
                  </dt>
                  <dd className="mt-3 font-sans text-gray-500 text-sm leading-relaxed">
                    {item.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}