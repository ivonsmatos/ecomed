import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { SideNav } from "@/components/layout/SideNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const userId = session.user!.id!;

  // Verificar se o usuário já viu o onboarding (tem CoinTransaction ONBOARDING_SCREENS)
  const headersList = await headers();
  const pathname = headersList.get("x-pathname");

  // Fail-safe: se o header não estiver disponível, não força redirect aqui para evitar loop.
  const canEnforceOnboarding = Boolean(pathname);
  const isOnboardingFlow =
    pathname === "/app/onboarding" || pathname?.startsWith("/app/onboarding/") === true;

  if (canEnforceOnboarding && !isOnboardingFlow) {
    const visiouOnboarding = await prisma.coinTransaction.findFirst({
      where: { wallet: { userId }, event: "ONBOARDING_SCREENS" },
      select: { id: true },
    });

    if (!visiouOnboarding) {
      redirect("/app/onboarding");
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <SideNav />
        <main id="main-content" className="flex-1 min-w-0 px-4 py-6 pb-24 md:pb-8 md:px-8">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
