"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, BookOpen, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/app", label: "Início", icon: Home, exact: true },
  { href: "/mapa", label: "Mapa", icon: MapPin },
  { href: "/app/quiz", label: "Quiz", icon: BookOpen },
  { href: "/app/chat", label: "EcoBot", icon: MessageCircle },
  { href: "/app/perfil", label: "Perfil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <ul className="flex h-16 items-center justify-around">
        {links.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-xs transition-colors",
                  active
                    ? "text-eco-teal-dark dark:text-eco-teal"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon
                  className={cn("size-5", active && "stroke-[2.5]")}
                  aria-hidden
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
