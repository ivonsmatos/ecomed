import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { DeletePointRowButton } from "./DeletePointRowButton";
import { Plus } from "lucide-react";
import { AdminSearchInput } from "../AdminSearchInput";

function Pagination({ current, total, status, q }: { current: number; total: number; status?: string; q?: string }) {
  const parts: string[] = [];
  if (status) parts.push(`status=${status}`);
  if (q) parts.push(`q=${encodeURIComponent(q)}`);
  const qs = parts.length ? parts.join("&") + "&" : "";
  const href = (p: number) => `/admin/pontos?${qs}page=${p}`;

  const pages: (number | "…")[] = [];
  const WING = 2;

  if (total <= 9) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current - WING > 2) pages.push("…");
    for (let i = Math.max(2, current - WING); i <= Math.min(total - 1, current + WING); i++) pages.push(i);
    if (current + WING < total - 1) pages.push("…");
    pages.push(total);
  }

  return (
    <div className="flex flex-wrap justify-center gap-1">
      {current > 1 && (
        <Link href={href(current - 1)} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>‹</Link>
      )}
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="px-2 py-1 text-sm text-muted-foreground">…</span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            className={cn(
              buttonVariants({ variant: current === p ? "default" : "outline", size: "sm" }),
              current === p && "bg-eco-green hover:bg-eco-green/90",
            )}
          >
            {p}
          </Link>
        )
      )}
      {current < total && (
        <Link href={href(current + 1)} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>›</Link>
      )}
    </div>
  );
}

export const metadata = { title: "Pontos de Coleta | Admin EcoMed" };

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
};

export default async function AdminPontosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; q?: string }>;
}) {
  await requireAdmin();

  const { status, page: pageParam, q } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? 1));
  const take = 20;
  const skip = (page - 1) * take;

  const validStatus = ["PENDING", "APPROVED", "REJECTED"].includes(status ?? "") ? status as "PENDING" | "APPROVED" | "REJECTED" : undefined;

  const search = q?.trim();
  const where = {
    ...(validStatus ? { status: validStatus } : {}),
    ...(search ? {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { city: { contains: search, mode: "insensitive" as const } },
        { state: { contains: search, mode: "insensitive" as const } },
        { partner: { companyName: { contains: search, mode: "insensitive" as const } } },
      ],
    } : {}),
  };

  const [points, total] = await Promise.all([
    prisma.point.findMany({
      where,
      include: { partner: { select: { companyName: true } } },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prisma.point.count({ where }),
  ]);

  const pages = Math.ceil(total / take);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Pontos de coleta</h1>
        <div className="flex gap-2 flex-wrap items-center">
          <Link href="/admin/pontos/novo" className={cn(buttonVariants({ size: "sm" }), "bg-eco-green hover:bg-eco-green/90 text-white")}>
            <Plus className="size-4 mr-1" /> Novo ponto
          </Link>
          {[undefined, "PENDING", "APPROVED", "REJECTED"].map((s) => (
            <Link
              key={s ?? "all"}
              href={s ? `/admin/pontos?status=${s}` : "/admin/pontos"}
              className={cn(
                buttonVariants({ variant: validStatus === s ? "default" : "outline", size: "sm" }),
                validStatus === s && "bg-eco-green hover:bg-eco-green/90",
              )}
            >
              {s ? STATUS_LABEL[s] : "Todos"}
            </Link>
          ))}
        </div>
      </div>

      <AdminSearchInput placeholder="Buscar por nome, cidade, UF, parceiro…" />

      <p className="text-sm text-muted-foreground">{total} ponto{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}</p>

      <div className="divide-y rounded-xl border overflow-hidden">
        {points.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">Nenhum ponto neste filtro.</p>
        ) : (
          points.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-4 p-4 hover:bg-muted/40 transition-colors">
              <div className="min-w-0">
                <p className="font-medium truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {p.partner.companyName} · {p.city}/{p.state} · {new Date(p.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={STATUS_VARIANT[p.status]}>{STATUS_LABEL[p.status]}</Badge>
                <Link href={`/admin/pontos/${p.id}`} className={buttonVariants({ size: "sm" })}>
                  Revisar
                </Link>
                <DeletePointRowButton pointId={p.id} />
              </div>
            </div>
          ))
        )}
      </div>

      {pages > 1 && (
        <Pagination current={page} total={pages} status={validStatus} q={search} />
      )}
    </div>
  );
}

