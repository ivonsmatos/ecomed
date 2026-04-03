import Link from "next/link";
import { Leaf } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-background mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="sm:col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-bold text-green-700">
              <Leaf className="size-5" />
              <span>EcoMed</span>
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">
              Descarte correto de medicamentos para um Brasil mais sustentável.
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">Cidadão</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/mapa" className="hover:text-foreground">Encontrar ponto</Link></li>
              <li><Link href="/app/chat" className="hover:text-foreground">Assistente IA</Link></li>
              <li><Link href="/blog" className="hover:text-foreground">Educação ambiental</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">Parceiro</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/cadastrar" className="hover:text-foreground">Cadastre seu ponto</Link></li>
              <li><Link href="/parceiro/dashboard" className="hover:text-foreground">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">Sobre</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/sobre" className="hover:text-foreground">Sobre o projeto</Link></li>
              <li>
                <a
                  href="https://github.com/ivonsmatos/ecomed"
                  className="hover:text-foreground"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} EcoMed. Desenvolvido para o meio ambiente.
        </div>
      </div>
    </footer>
  );
}
