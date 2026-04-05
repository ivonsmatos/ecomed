import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="min-h-[70vh] flex items-center justify-center bg-white">
        <div className="text-center px-4 max-w-md">
          <div className="text-eco-lime text-8xl font-extrabold mb-4">404</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Página não encontrada
          </h1>
          <p className="text-gray-600 mb-8">
            Esta página não existe. Mas você pode encontrar pontos de coleta de
            medicamentos no mapa ou tirar dúvidas com o EcoBot.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/mapa"
              className="bg-[#0d3b1a] text-white font-semibold px-6 py-3 rounded-full hover:bg-[#0a2e13] transition-colors"
            >
              Ver mapa de coleta
            </Link>
            <Link
              href="/"
              className="border border-gray-300 text-gray-700 font-semibold px-6 py-3 rounded-full hover:bg-gray-50 transition-colors"
            >
              Voltar ao início
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
