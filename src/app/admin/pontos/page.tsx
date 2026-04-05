import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  await requireAdmin();

  const { status, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? 1));
  const take = 20;
  const skip = (page - 1) * take;

  const validStatus = ["PENDING", "APPROVED", "REJECTED"].includes(status ?? "") ? status as "PENDING" | "APPROVED" | "REJECTED" : undefined;

  const [points, total] = await Promise.all([
    prisma.point.findMany({
      where: validStatus ? { status: validStatus } : undefined,
      include: { partner: { select: { companyName: true } } },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prisma.point.count({ where: validStatus ? { status: validStatus } : undefined }),
  ]);

  const pages = Math.ceil(total / take);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Pontos de coleta</h1>
        <div className="flex gap-2">
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
              </div>
            </div>
          ))
        )}
      </div>

      {pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/pontos?${validStatus ? `status=${validStatus}&` : ""}page=${p}`}
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

