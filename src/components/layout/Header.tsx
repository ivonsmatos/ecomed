import Link from "next/link";
import { Leaf } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { auth } from "@/../auth";
import { signOut } from "@/../auth";
import { PwaInstallButton } from "@/components/shared/PwaInstallButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
            href="/#como-funciona"
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
            href="/#contato"
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
        </div>
      </div>
    </header>
  );
}


