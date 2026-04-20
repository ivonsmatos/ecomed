"use client"

import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type UserMenuProps = {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string | null
  }
  signOutAction: () => Promise<void>
}

export function UserMenu({ user, signOutAction }: UserMenuProps) {
  const initial = user.name?.[0]?.toUpperCase() ?? "U"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Menu do usuário"
        className="relative size-9 rounded-full bg-transparent border-0 p-0 cursor-pointer inline-flex items-center justify-center hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Avatar className="size-8">
          <AvatarImage src={user.image ?? undefined} alt={user.name ?? "Usuário"} />
          <AvatarFallback className="bg-eco-teal/10 text-eco-teal-dark font-semibold">
            {initial}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-48">
        {/* Cabeçalho do menu */}
        <div className="px-2 py-1.5 text-sm font-semibold truncate">
          {user.name ?? user.email}
        </div>
        <DropdownMenuSeparator />

        <DropdownMenuItem render={<Link href="/app" />}>
          🏠 Minha área
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/app/missoes" />}>
          🏆 Missões
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/app/recompensas" />}>
          🎁 Recompensas
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/app/perfil" />}>
          👤 Meu perfil
        </DropdownMenuItem>

        {user.role === "PARTNER" && (
          <DropdownMenuItem render={<Link href="/parceiro/dashboard" />}>
            🤝 Área do Parceiro
          </DropdownMenuItem>
        )}
        {user.role === "ADMIN" && (
          <DropdownMenuItem render={<Link href="/admin" />}>
            ⚙️ Admin
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={async () => {
            await signOutAction()
          }}
        >
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
