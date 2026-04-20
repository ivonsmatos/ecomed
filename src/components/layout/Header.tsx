import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button-variants";
import { auth } from "@/../auth";
import { PwaInstallButton } from "@/components/shared/PwaInstallButton";
import { UserMenu } from "@/components/layout/UserMenu";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { signOutAction } from "@/lib/actions/auth";

export async function Header() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.svg"
            alt="EcoMed"
            width={120}
            height={29}
            priority
            className="h-7 w-auto"
          />
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
            <UserMenu
              user={{
                name: session.user.name,
                email: session.user.email,
                image: session.user.image,
                role: (session.user as { role?: string }).role,
              }}
              signOutAction={signOutAction}
            />
          ) : (
            <>
              <Link href="/entrar" className={buttonVariants({ variant: "ghost", size: "sm" })}>Acesse aqui</Link>
              <Link href="/cadastrar" className={buttonVariants({ size: "sm" }) + " bg-eco-green hover:bg-eco-green/90 text-white hidden sm:inline-flex"}>Seja parceiro</Link>
            </>
          )}
          
          <div className="md:hidden flex items-center">
            <MobileMenu
              user={session?.user ? {
                name: session.user.name,
                email: session.user.email,
                image: session.user.image,
                role: (session.user as { role?: string }).role,
              } : null}
              signOutAction={signOutAction}
            />
          </div>

        </div>
      </div>
    </header>
  );
}


