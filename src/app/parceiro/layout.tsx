import { requirePartner } from "@/lib/auth/session";
import { Header } from "@/components/layout/Header";
import Link from "next/link";
import { LayoutDashboard, MapPin, BarChart2, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/parceiro/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/parceiro/pontos", label: "Meus pontos", icon: MapPin },
  { href: "/parceiro/estatisticas", label: "Estatísticas", icon: BarChart2 },
  { href: "/parceiro/scanner", label: "Scanner de Check-in", icon: QrCode },
];

export default async function ParceiroLayout({ children }: { children: React.ReactNode }) {
  await requirePartner();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="container mx-auto flex flex-1 gap-6 px-4 py-6">
        {/* Sidebar desktop */}
        <aside className="hidden w-52 shrink-0 md:block">
          <nav className="space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
