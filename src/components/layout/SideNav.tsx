"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, BookOpen, MessageCircle, User, Heart, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Início", icon: Home, exact: true },
  { href: "/mapa", label: "Mapa", icon: MapPin },
  { href: "/app/quiz", label: "Quiz", icon: BookOpen },
  { href: "/app/chat", label: "EcoBot", icon: MessageCircle },
  { href: "/app/favoritos", label: "Favoritos", icon: Heart },
  { href: "/app/missoes", label: "Missões", icon: Trophy },
  { href: "/app/perfil", label: "Perfil", icon: User },
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-background/95">
      <nav className="sticky top-14 flex flex-col gap-1 p-3">
        {links.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-eco-teal/10 text-eco-teal-dark dark:bg-eco-teal/20 dark:text-eco-teal"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className={cn("size-4 shrink-0", active && "stroke-[2.5]")} aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
