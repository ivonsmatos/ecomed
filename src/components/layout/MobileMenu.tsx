"use client"

import Link from "next/link"
import {
  Leaf,
  Menu,
  Sparkles,
  Users,
  Handshake,
  HeartHandshake,
  BookOpen,
  Mail,
  Home,
  Trophy,
  Gift,
  UserIcon,
  ShieldCheck,
  HandshakeIcon,
  LogOut,
} from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { buttonVariants } from "@/components/ui/button-variants"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const publicNavItems = [
  { href: "/o-que-fazemos", label: "O que fazemos", icon: Sparkles },
  { href: "/sobre", label: "Quem somos", icon: Users },
  { href: "/parceiros", label: "Parceiros", icon: Handshake },
  { href: "/compromisso", label: "Compromisso", icon: HeartHandshake },
  { href: "/blog", label: "Blog", icon: BookOpen },
  { href: "/contato", label: "Contato", icon: Mail },
]

type MobileMenuProps = {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string | null
  } | null
  signOutAction?: () => Promise<void>
}

export function MobileMenu({ user, signOutAction }: MobileMenuProps) {
  const initial = user?.name?.[0]?.toUpperCase() ?? "U"

  return (
    <Sheet>
      <SheetTrigger
        aria-label="Abrir menu de navegação"
        className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground border-none bg-transparent cursor-pointer"
      >
        <Menu className="size-6 text-eco-teal-dark" />
        <span className="sr-only">Abrir menu</span>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-[85vw] sm:w-[360px] p-0 bg-gradient-to-b from-white via-white to-eco-teal/5 flex flex-col"
      >
        {/* Cabeçalho do Sheet */}
        <div className="px-6 pt-6 pb-5 border-b border-eco-teal/10 bg-eco-teal-dark text-white">
          <SheetClose
            render={
              <Link href="/" className="flex items-center gap-2 font-bold text-lg">
                <Leaf className="size-6" />
                <span>EcoMed</span>
              </Link>
            }
          />
          {user ? (
            <div className="mt-3 flex items-center gap-3">
              <Avatar className="size-9">
                <AvatarImage src={user.image ?? undefined} alt={user.name ?? "Usuário"} />
                <AvatarFallback className="bg-white/20 text-white font-semibold">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{user.name ?? "Usuário"}</p>
                <p className="truncate text-xs text-white/70">{user.email}</p>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-xs text-white/80">Descarte consciente de medicamentos</p>
          )}
        </div>

        <nav className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
          {/* Links do usuário logado */}
          {user && (
            <div className="mb-2">
              {[
                { href: "/app", label: "Minha área", icon: Home },
                { href: "/app/missoes", label: "Missões", icon: Trophy },
                { href: "/app/recompensas", label: "Recompensas", icon: Gift },
                { href: "/app/perfil", label: "Meu perfil", icon: UserIcon },
                ...(user.role === "ADMIN" ? [{ href: "/admin", label: "Admin", icon: ShieldCheck }] : []),
                ...(user.role === "PARTNER" ? [{ href: "/parceiro/dashboard", label: "Área do Parceiro", icon: HandshakeIcon }] : []),
              ].map(({ href, label, icon: Icon }) => (
                <SheetClose
                  key={href}
                  render={
                    <Link
                      href={href}
                      className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-eco-teal-dark hover:bg-eco-teal/10 transition-colors"
                    >
                      <Icon className="size-4 text-eco-teal group-hover:text-eco-teal-dark transition-colors" />
                      <span>{label}</span>
                    </Link>
                  }
                />
              ))}
              <div className="my-2 border-t border-eco-teal/10" />
            </div>
          )}

          {/* Links públicos */}
          {publicNavItems.map(({ href, label, icon: Icon }) => (
            <SheetClose
              key={href}
              render={
                <Link
                  href={href}
                  className="group flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-eco-teal-dark hover:bg-eco-teal/10 transition-colors"
                >
                  <Icon className="size-5 text-eco-teal group-hover:text-eco-teal-dark transition-colors" />
                  <span>{label}</span>
                </Link>
              }
            />
          ))}
        </nav>

        {/* Footer do Sheet */}
        <div className="border-t border-eco-teal/10 p-4 space-y-2 bg-white">
          {user ? (
            <button
              onClick={async () => { await signOutAction?.() }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="size-4" />
              <span>Sair</span>
            </button>
          ) : (
            <>
              <SheetClose
                render={
                  <Link
                    href="/entrar"
                    className={
                      buttonVariants({ variant: "outline", size: "default" }) +
                      " w-full border-eco-teal text-eco-teal-dark hover:bg-eco-teal/10"
                    }
                  >
                    Acesse aqui
                  </Link>
                }
              />
              <SheetClose
                render={
                  <Link
                    href="/cadastrar"
                    className={
                      buttonVariants({ size: "default" }) +
                      " w-full bg-eco-green hover:bg-eco-green/90 text-white"
                    }
                  >
                    Seja parceiro
                  </Link>
                }
              />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
