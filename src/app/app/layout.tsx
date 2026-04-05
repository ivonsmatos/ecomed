import { requireSession } from "@/lib/auth/session";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { SideNav } from "@/components/layout/SideNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireSession();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <SideNav />
        <main className="flex-1 min-w-0 px-4 py-6 pb-24 md:pb-8 md:px-8">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
