"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, Heart, MessageCircle, User, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/mapa", label: "Mapa", icon: MapPin },
  { href: "/app/favoritos", label: "Favoritos", icon: Heart },
  { href: "/app/impacto", label: "Impacto", icon: Leaf },
  { href: "/app/chat", label: "Assistente", icon: MessageCircle },
  { href: "/app/perfil", label: "Perfil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <ul className="flex h-16 items-center justify-around">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-xs transition-colors",
                  active
                    ? "text-green-700 dark:text-green-400"
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
