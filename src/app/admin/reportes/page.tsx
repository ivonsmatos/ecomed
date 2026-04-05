import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ResolveButton } from "./ResolveButton";

export const metadata = { title: "Reportes | Admin EcoMed" };

const TIPO_LABEL: Record<string, string> = {
  CLOSED: "Fechado",
  WRONG_ADDRESS: "Endereço errado",
  NOT_ACCEPTING: "Não aceita mais",
  OTHER: "Outro",
};

export default async function AdminReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ resolved?: string; page?: string }>;
}) {
  await requireAdmin();

  const { resolved: resolvedParam, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? 1));
  const take = 20;
  const skip = (page - 1) * take;

  const showResolved = resolvedParam === "1";
  const where = { resolved: showResolved };

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      include: {
        point: { select: { id: true, name: true, city: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prisma.report.count({ where }),
  ]);

  const pages = Math.ceil(total / take);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Reportes</h1>
        <div className="flex gap-2">
          <Link href="/admin/reportes" className={cn(buttonVariants({ variant: !showResolved ? "default" : "outline", size: "sm" }), !showResolved && "bg-eco-green hover:bg-eco-green/90")}>Abertos</Link>
          <Link href="/admin/reportes?resolved=1" className={cn(buttonVariants({ variant: showResolved ? "default" : "outline", size: "sm" }), showResolved && "bg-eco-green hover:bg-eco-green/90")}>Resolvidos</Link>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{total} reporte{total !== 1 ? "s" : ""}</p>

      <div className="divide-y rounded-xl border overflow-hidden">
        {reports.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">Nenhum reporte aqui.</p>
        ) : (
          reports.map((r) => (
            <div key={r.id} className="p-4 space-y-1 hover:bg-muted/40 transition-colors">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    <Link href={`/admin/pontos/${r.point.id}`} className="hover:underline text-eco-teal-dark">{r.point.name}</Link>
                    <span className="text-muted-foreground font-normal"> — {r.point.city}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.user ? `${r.user.name ?? r.user.email}` : "Anônimo"} · {new Date(r.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="secondary">{TIPO_LABEL[r.type] ?? r.type}</Badge>
                  {!r.resolved && <ResolveButton reportId={r.id} />}
                </div>
              </div>
              {r.description && <p className="text-sm text-muted-foreground pl-0.5">{r.description}</p>}
            </div>
          ))
        )}
      </div>

      {pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/reportes?${showResolved ? "resolved=1&" : ""}page=${p}`}
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

