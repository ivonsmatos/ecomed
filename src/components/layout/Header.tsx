import Link from "next/link";
import {
  Leaf,
  Menu,
  Sparkles,
  Users,
  Handshake,
  HeartHandshake,
  BookOpen,
  Mail,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { auth } from "@/../auth";
import { signOut } from "@/../auth";
import { PwaInstallButton } from "@/components/shared/PwaInstallButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";

const mobileNavItems = [
  { href: "/o-que-fazemos", label: "O que fazemos", icon: Sparkles },
  { href: "/sobre", label: "Quem somos", icon: Users },
  { href: "/parceiros", label: "Parceiros", icon: Handshake },
  { href: "/compromisso", label: "Compromisso", icon: HeartHandshake },
  { href: "/blog", label: "Blog", icon: BookOpen },
  { href: "/contato", label: "Contato", icon: Mail },
];
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export async function Header() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-eco-teal-dark">
          <Leaf className="size-5" />
          <span>EcoMed</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link
            href="/o-que-fazemos"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            O que fazemos
          </Link>
          <Link
            href="/sobre"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Quem somos
          </Link>
          <Link
            href="/parceiros"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Parceiros
          </Link>
          <Link
            href="/compromisso"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Compromisso
          </Link>
          <Link
            href="/blog"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Blog
          </Link>
          <Link
            href="/contato"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Contato
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <PwaInstallButton />

          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="relative size-9 rounded-full bg-transparent border-0 p-0 cursor-pointer inline-flex items-center justify-center hover:bg-muted transition-colors">
                <Avatar className="size-8">
                    <AvatarImage src={session.user.image ?? undefined} />
                    <AvatarFallback className="bg-eco-teal/10 text-eco-teal-dark">
                      {session.user.name?.[0]?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem render={<Link href="/app" />}>Minha área</DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/app/missoes" />}>🏆 Missões</DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/app/recompensas" />}>🎁 Recompensas</DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/app/perfil" />}>Meu perfil</DropdownMenuItem>
                {(session.user as { role?: string }).role === "PARTNER" && (
                  <DropdownMenuItem render={<Link href="/parceiro/dashboard" />}>Parceiro</DropdownMenuItem>
                )}
                {(session.user as { role?: string }).role === "ADMIN" && (
                  <DropdownMenuItem render={<Link href="/admin" />}>Admin</DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <form
                    action={async () => {
                      "use server";
                      await signOut({ redirectTo: "/" });
                    }}
                    className="w-full"
                  >
                    <button type="submit" className="w-full text-left">
                      Sair
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/entrar" className={buttonVariants({ variant: "ghost", size: "sm" })}>Acesse aqui</Link>
              <Link href="/cadastrar" className={buttonVariants({ size: "sm" }) + " bg-eco-green hover:bg-eco-green/90 text-white hidden sm:inline-flex"}>Seja parceiro</Link>
            </>
          )}
          
          <div className="md:hidden flex items-center">
            <Sheet>
              <SheetTrigger className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground border-none bg-transparent cursor-pointer">
                <Menu className="size-6 text-eco-teal-dark" />
                <span className="sr-only">Abrir menu</span>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[85vw] sm:w-[360px] p-0 bg-gradient-to-b from-white via-white to-eco-teal/5 flex flex-col"
              >
                <div className="px-6 pt-6 pb-5 border-b border-eco-teal/10 bg-eco-teal-dark text-white">
                  <SheetClose
                    render={
                      <Link href="/" className="flex items-center gap-2 font-bold text-lg">
                        <Leaf className="size-6" />
                        <span>EcoMed</span>
                      </Link>
                    }
                  />
                  <p className="mt-1 text-xs text-white/80">Descarte consciente de medicamentos</p>
                </div>

                <nav className="flex-1 flex flex-col gap-1 p-4">
                  {mobileNavItems.map(({ href, label, icon: Icon }) => (
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

                {!session?.user && (
                  <div className="border-t border-eco-teal/10 p-4 space-y-2 bg-white">
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
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>

        </div>
      </div>
    </header>
  );
}


