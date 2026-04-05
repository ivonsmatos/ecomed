import { requireAdmin } from "@/lib/auth/session";
import { Header } from "@/components/layout/Header";
import Link from "next/link";
import { Users, MapPin, FileText, LayoutDashboard, Flag, UserCog, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/parceiros", label: "Parceiros", icon: Users },
  { href: "/admin/pontos", label: "Pontos", icon: MapPin },
  { href: "/admin/reportes", label: "Reportes", icon: Flag },
  { href: "/admin/usuarios", label: "Usuários", icon: UserCog },
  { href: "/admin/conteudo", label: "Conteúdo", icon: FileText },
  { href: "/admin/kpis", label: "KPIs", icon: TrendingUp },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="container mx-auto flex flex-1 gap-6 px-4 py-6">
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
