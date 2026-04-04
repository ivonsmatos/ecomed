import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Sobre o EcoMed",
  description:
    "Conheça o EcoMed — a plataforma brasileira que conecta cidadãos a pontos de coleta de medicamentos para descarte correto e sustentável.",
};

export default function SobrePage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-[#0d3b1a] py-24 text-center">
          <div className="container mx-auto px-4 max-w-3xl">
            <span className="inline-block text-[#79b900] text-sm font-medium uppercase tracking-wider mb-4">
              Nossa missão
            </span>
            <h1 className="font-[&apos;Albert_Sans&apos;] text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-6">
              Descarte certo,{" "}
              <span className="text-[#79b900]">planeta saudável</span>
            </h1>
            <p className="text-white/80 text-lg leading-relaxed">
              91% dos brasileiros descartam medicamentos de forma incorreta —
              não por má vontade, mas porque ninguém ensinou como fazer certo.
              O EcoMed existe para mudar isso.
            </p>
          </div>
        </section>

        {/* Problema */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-[&apos;Albert_Sans&apos;] text-3xl font-bold text-gray-900 mb-6">
                  Por que o descarte correto importa?
                </h2>
                <ul className="space-y-4 text-gray-600">
                  <li className="flex gap-3">
                    <span className="text-[#79b900] font-bold text-lg">✓</span>
                    <span>Um único comprimido pode contaminar até <strong>450.000 litros de água</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#79b900] font-bold text-lg">✓</span>
                    <span>Antibióticos descartados no esgoto geram <strong>superbactérias resistentes</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#79b900] font-bold text-lg">✓</span>
                    <span>Hormônios afetam a vida aquática e a cadeia alimentar</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#79b900] font-bold text-lg">✓</span>
                    <span>O descarte no lixo é proibido pela <strong>Lei 12.305/2010 (PNRS)</strong></span>
                  </li>
                </ul>
              </div>
              <div className="bg-green-50 rounded-2xl p-8 text-center">
                <div className="text-5xl font-extrabold text-[#0d3b1a] mb-2">30 mil t</div>
                <div className="text-gray-600 mb-6">de medicamentos descartados incorretamente por ano no Brasil</div>
                <div className="text-5xl font-extrabold text-[#0d3b1a] mb-2">7.500+</div>
                <div className="text-gray-600">pontos de coleta LogMed espalhados pelo país</div>
              </div>
            </div>
          </div>
        </section>

        {/* Como funciona */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="font-[&apos;Albert_Sans&apos;] text-3xl font-bold text-gray-900 mb-4">
              Como o EcoMed funciona
            </h2>
            <p className="text-gray-600 mb-12 max-w-xl mx-auto">
              Uma plataforma simples e gratuita para conectar você ao ponto de coleta mais próximo.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  emoji: "📍",
                  title: "Encontre",
                  desc: "Veja no mapa os pontos de coleta mais próximos — farmácias, UBS, hospitais. Filtre e abra a rota no celular.",
                },
                {
                  emoji: "💬",
                  title: "Pergunte ao EcoBot",
                  desc: "Nosso assistente com IA responde dúvidas sobre descarte, legislação e impacto ambiental em linguagem simples, 24h.",
                },
                {
                  emoji: "🪙",
                  title: "Ganhe EcoMed Coins",
                  desc: "Cada descarte correto, artigo lido ou quiz respondido gera moedas. Suba de nível e complete missões ambientais.",
                },
              ].map((item) => (
                <div key={item.title} className="bg-white rounded-2xl p-8 shadow-sm text-left">
                  <div className="text-4xl mb-4">{item.emoji}</div>
                  <h3 className="font-bold text-xl text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Base legal */}
        <section className="py-20 bg-[#0d3b1a] text-white">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h2 className="font-[&apos;Albert_Sans&apos;] text-3xl font-bold mb-6">
              Respaldo legal
            </h2>
            <p className="text-white/80 leading-relaxed mb-8">
              O EcoMed atua alinhado à <strong className="text-[#79b900]">Lei 12.305/2010</strong> (Política Nacional de Resíduos Sólidos) e ao <strong className="text-[#79b900]">Decreto 10.388/2020</strong>, que regulamenta a logística reversa de medicamentos domiciliares no Brasil — obrigando fabricantes, distribuidores e importadores a manter pontos de coleta acessíveis à população.
            </p>
            <a
              href="/mapa"
              className="inline-block bg-[#79b900] text-white font-semibold px-8 py-4 rounded-full hover:bg-[#659d00] transition-colors"
            >
              Encontrar ponto de coleta perto de mim
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
