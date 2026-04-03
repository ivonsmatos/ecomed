import Link from "next/link";
import { Leaf } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/../../auth";
import { signOut } from "@/../../auth";
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-green-700">
          <Leaf className="size-5" />
          <span>EcoMed</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link
            href="/mapa"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Mapa
          </Link>
          <Link
            href="/blog"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Educação
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="relative size-9 rounded-full bg-transparent border-0 p-0 cursor-pointer inline-flex items-center justify-center hover:bg-muted transition-colors">
                <Avatar className="size-8">
                    <AvatarImage src={session.user.image ?? undefined} />
                    <AvatarFallback className="bg-green-100 text-green-800">
                      {session.user.name?.[0]?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem render={<Link href="/app" />}>Minha área</DropdownMenuItem>
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
              <Link href="/entrar" className={buttonVariants({ variant: "ghost", size: "sm" })}>Entrar</Link>
              <Link href="/cadastrar" className={buttonVariants({ size: "sm" }) + " bg-green-700 hover:bg-green-800 text-white hidden sm:inline-flex"}>Cadastrar</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
