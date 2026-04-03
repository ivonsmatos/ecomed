import { requireSession } from "@/lib/auth/session";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireSession();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 pb-20 md:pb-6">{children}</main>
      <BottomNav />
    </div>
  );
}
