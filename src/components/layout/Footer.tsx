import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, ChevronRight } from "lucide-react";

/* Ícones sociais inline (lucide-react v1.x removeu brand icons) */
const SvgFacebook = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>);
const SvgInstagram = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>);
const SvgTwitter = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l16 16M4 20L20 4"/></svg>);
const SvgLinkedin = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>);

/* Fiel ao Echofy Footer.jsx — dark bg com footer-bg.jpg, social box, shapes */
export function Footer() {
  return (
    <footer className="bg-[url('/footer-bg-ecomed.jpg')] bg-no-repeat bg-center bg-cover relative z-10 pt-28 overflow-hidden">

      {/* footer-line.png — canto inferior direito, opacidade */}
      <Image
        src="/echofy/footer-line.png"
        alt=""
        width={300}
        height={300}
        draggable={false}
        className="absolute -z-10 right-0 -bottom-20 opacity-70"
      />

      {/* footer-shape.png — canto superior esquerdo, dançando */}
      <Image
        src="/echofy/footer-shape.png"
        alt=""
        width={120}
        height={120}
        draggable={false}
        className="absolute -z-10 top-0 left-0 animate-echofy-dance"
      />

      <div className="echofy-container">

        {/* ── Social box — bg: footer-social.jpg ──────────────────── */}
        <div className="relative mb-[90px]">
          <div className="bg-[url('/echofy/footer-social.jpg')] bg-no-repeat bg-cover bg-center relative rounded-md">
            <div className="flex flex-col gap-7 lg:gap-0 lg:flex-row lg:items-center lg:justify-between p-10">
              <div>
                <h2 className="font-['Albert_Sans'] font-bold text-white text-[30px] sm:text-[40px]">
                  Siga o EcoMed nas Redes
                </h2>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <h5 className="font-['Albert_Sans'] font-semibold text-white text-lg uppercase">
                  Siga-nos:
                </h5>
                <ul className="flex gap-3">
                  {[
                    { icon: <SvgFacebook />, href: "https://facebook.com", label: "Facebook" },
                    { icon: <SvgInstagram />, href: "https://instagram.com", label: "Instagram" },
                    { icon: <SvgTwitter />, href: "https://twitter.com", label: "Twitter" },
                    { icon: <SvgLinkedin />, href: "https://linkedin.com", label: "LinkedIn" },
                  ].map(({ icon, href, label }) => (
                    <li key={label}>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                        className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center
                                   text-white overflow-hidden transition-all duration-500
                                   hover:text-[#79b900] relative z-10
                                   before:absolute before:top-0 before:left-0 before:w-full before:h-full
                                   before:-z-10 before:bg-white before:transition-all before:duration-500
                                   before:scale-0 hover:before:scale-100"
                      >
                        {icon}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* footer-shape2.png — animado dentro do social box */}
            <div className="md:flex justify-center items-center w-full absolute top-1/4 left-16 md:left-1/3 lg:left-16 hidden">
              <Image
                src="/echofy/footer-shape2.png"
                alt=""
                width={60}
                height={60}
                draggable={false}
                className="animate-echofy-zoom"
              />
            </div>
          </div>

          {/* footer-social-shape.png — canto inferior direito do social box */}
          <Image
            src="/echofy/footer-social-shape.png"
            alt=""
            width={100}
            height={100}
            draggable={false}
            className="absolute -z-10 -bottom-[70px] -right-[10px] animate-echofy-dance"
          />
        </div>

        {/* ── Colunas do Footer ────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

          {/* Coluna 1 — Logo + contato */}
          <div>
            <Link href="/" className="inline-block">
              <span className="font-['Albert_Sans'] font-bold text-2xl text-[#79b900]">EcoMed</span>
            </Link>
            <p className="font-['Albert_Sans'] text-white/80 mt-7 mb-5">
              Descarte correto de medicamentos para um Brasil mais sustentável e protegido.
            </p>
            <div>
              <h6 className="font-['Albert_Sans'] font-medium text-white text-lg pl-8 relative
                             before:absolute before:top-1/2 before:left-0 before:-translate-y-1/2
                             before:bg-[#79b900] before:w-[22px] before:h-[2px]">
                Contato
              </h6>
              <a href="tel:+5500000000000" className="mt-[18px] flex items-center gap-3 font-['Albert_Sans'] text-white/80
                                                       transition-all duration-500 hover:text-[#79b900]">
                <Phone className="size-4 text-[#79b900]" />
                +55 (00) 0000-0000
              </a>
              <a href="mailto:contato@ecomed.eco.br" className="mt-[18px] flex items-center gap-3 font-['Albert_Sans'] text-white/80
                                                                  transition-all duration-500 hover:text-[#79b900]">
                <Mail className="size-4 text-[#79b900]" />
                contato@ecomed.eco.br
              </a>
            </div>
          </div>

          {/* Coluna 2 — Cidadão */}
          <div>
            <h4 className="font-['Albert_Sans'] text-2xl text-white font-semibold mb-[30px]">Cidadão</h4>
            <ul>
              {[
                { label: "Encontrar ponto", href: "/mapa" },
                { label: "Assistente IA", href: "/app/chat" },
                { label: "Blog educativo", href: "/blog" },
                { label: "Perguntas frequentes", href: "/#faq" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href}
                    className="flex items-center gap-2 font-['Albert_Sans'] text-white/60 transition-all duration-500
                               hover:text-[#79b900] hover:opacity-100 mb-[18px]">
                    <ChevronRight className="size-3 opacity-60" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna 3 — Parceiro */}
          <div>
            <h4 className="font-['Albert_Sans'] text-2xl text-white font-semibold mb-[30px]">Parceiro</h4>
            <ul>
              {[
                { label: "Cadastre seu ponto", href: "/cadastrar" },
                { label: "Dashboard", href: "/parceiro/dashboard" },
                { label: "Estatísticas", href: "/parceiro/estatisticas" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href}
                    className="flex items-center gap-2 font-['Albert_Sans'] text-white/60 transition-all duration-500
                               hover:text-[#79b900] hover:opacity-100 mb-[18px]">
                    <ChevronRight className="size-3 opacity-60" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna 4 — Legal */}
          <div>
            <h4 className="font-['Albert_Sans'] text-2xl text-white font-semibold mb-[30px]">Sobre</h4>
            <ul>
              {[
                { label: "Sobre o projeto", href: "/sobre" },
                { label: "Política de Privacidade", href: "/privacidade" },
                { label: "Termos de Uso", href: "/termos" },
                { label: "Aviso Médico", href: "/aviso-medico" },
                { label: "GitHub", href: "https://github.com/ivonsmatos/ecomed" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href}
                    className="flex items-center gap-2 font-['Albert_Sans'] text-white/60 transition-all duration-500
                               hover:text-[#79b900] hover:opacity-100 mb-[18px]">
                    <ChevronRight className="size-3 opacity-60" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Copyright ────────────────────────────────────────────── */}
        <div className="border-t border-white/10 mt-10 py-6 text-center">
          <p className="font-['Albert_Sans'] text-white/50 text-sm">
            © {new Date().getFullYear()} EcoMed. Desenvolvido para o meio ambiente. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
