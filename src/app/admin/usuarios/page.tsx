import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { UserActions } from "./UserActions";
import { Plus } from "lucide-react";
import { AdminSearchInput } from "../AdminSearchInput";

export const metadata = { title: "Usuários | Admin EcoMed" };

const ROLE_LABEL: Record<string, string> = { CITIZEN: "Cidadão", PARTNER: "Parceiro", ADMIN: "Admin" };
const ROLE_VARIANT: Record<string, "default" | "secondary" | "destructive"> = { CITIZEN: "secondary", PARTNER: "default", ADMIN: "destructive" };

export default async function AdminUsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  await requireAdmin();

  const { page: pageParam, q } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? 1));
  const take = 30;
  const skip = (page - 1) * take;

  const search = q?.trim();
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prisma.user.count({ where }),
  ]);

  const pages = Math.ceil(total / take);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Usuários <span className="text-muted-foreground text-lg font-normal">({total})</span></h1>
        <Link href="/admin/usuarios/novo" className={cn(buttonVariants({ size: "sm" }), "bg-eco-green hover:bg-eco-green/90 text-white")}>
          <Plus className="size-4 mr-1" /> Novo usuário
        </Link>
      </div>

      <AdminSearchInput placeholder="Buscar por nome ou e-mail…" />

      <div className="divide-y rounded-xl border overflow-hidden">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/40 transition-colors">
            <div className="min-w-0">
              <p className="font-medium truncate">{u.name ?? "—"}</p>
              <p className="text-xs text-muted-foreground truncate">{u.email}</p>
              <p className="text-xs text-muted-foreground">desde {new Date(u.createdAt).toLocaleDateString("pt-BR")}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!u.active && <Badge variant="destructive" className="text-xs">Inativo</Badge>}
              <Badge variant={ROLE_VARIANT[u.role]}>{ROLE_LABEL[u.role]}</Badge>
              <UserActions userId={u.id} role={u.role as "CITIZEN" | "PARTNER" | "ADMIN"} active={u.active} />
            </div>
          </div>
        ))}
      </div>

      {pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/usuarios?page=${p}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
              className={cn(buttonVariants({ variant: page === p ? "default" : "outline", size: "sm" }))}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

