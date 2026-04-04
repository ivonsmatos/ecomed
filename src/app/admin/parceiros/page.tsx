import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PartnerCandidateActions } from "@/components/admin/PartnerCandidateActions";
import { Clock } from "lucide-react";

export const metadata = { title: "Parceiros | Admin EcoMed" };
export const dynamic = "force-dynamic";

export default async function AdminParceirosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdmin();

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? 1));
  const take = 30;
  const skip = (page - 1) * take;

  const [candidates, partners, total] = await Promise.all([
    // Candidatos: têm registro Partner mas role ainda é CITIZEN
    prisma.partner.findMany({
      where: { user: { role: "CITIZEN" } },
      select: {
        id: true,
        companyName: true,
        tradeName: true,
        cnpj: true,
        phone: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    // Parceiros aprovados
    prisma.partner.findMany({
      where: { user: { role: { in: ["PARTNER", "ADMIN"] } } },
      select: {
        id: true,
        companyName: true,
        tradeName: true,
        cnpj: true,
        createdAt: true,
        user: { select: { name: true, email: true, active: true } },
        _count: { select: { points: true } },
        points: { where: { status: "PENDING" }, select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prisma.partner.count({ where: { user: { role: { in: ["PARTNER", "ADMIN"] } } } }),
  ]);

  const pages = Math.ceil(total / take);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Parceiros</h1>

      {/* Candidatos pendentes */}
      {candidates.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="size-5 text-orange-500" />
            <h2 className="text-lg font-semibold">
              Candidatos em análise
              <Badge variant="secondary" className="ml-2 text-orange-700 bg-orange-100">
                {candidates.length}
              </Badge>
            </h2>
          </div>

          <div className="divide-y rounded-xl border border-orange-200 overflow-hidden">
            {candidates.map((c) => {
              const displayName = c.tradeName ?? c.companyName;
              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-4 px-4 py-3 bg-orange-50/50"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{displayName}</p>
                    {c.tradeName && (
                      <p className="text-xs text-muted-foreground truncate">{c.companyName}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      CNPJ: {c.cnpj} · {c.user.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Solicitado em {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <PartnerCandidateActions partnerId={c.id} partnerName={displayName} />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Parceiros aprovados */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          Parceiros aprovados{" "}
          <span className="text-muted-foreground text-base font-normal">({total})</span>
        </h2>

        <div className="divide-y rounded-xl border overflow-hidden">
          {partners.length === 0 && (
            <p className="px-4 py-8 text-center text-muted-foreground text-sm">
              Nenhum parceiro aprovado ainda.
            </p>
          )}

          {partners.map((p) => {
            const pendentes = p.points.length;
            const displayName = p.tradeName ?? p.companyName;

            return (
              <div
                key={p.id}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/40 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{displayName}</p>
                  {p.tradeName && (
                    <p className="text-xs text-muted-foreground truncate">{p.companyName}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    CNPJ: {p.cnpj} · {p.user.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    desde {new Date(p.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  {!p.user.active && (
                    <Badge variant="destructive" className="text-xs">Inativo</Badge>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {p._count.points} pontos
                  </Badge>
                  {pendentes > 0 && (
                    <Badge className="text-xs bg-orange-100 text-orange-700">
                      {pendentes} pendente{pendentes > 1 ? "s" : ""}
                    </Badge>
                  )}
                  <Link
                    href={`/admin/pontos?parceiro=${p.id}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    Ver pontos
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {pages > 1 && (
          <div className="flex justify-center gap-2">
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/admin/parceiros?page=${p}`}
                className={cn(buttonVariants({ variant: page === p ? "default" : "outline", size: "sm" }))}
              >
                {p}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}


  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? 1));
  const take = 30;
  const skip = (page - 1) * take;

  const [partners, total] = await Promise.all([
    prisma.partner.findMany({
      select: {
        id: true,
        companyName: true,
        tradeName: true,
        cnpj: true,
        phone: true,
        createdAt: true,
        user: {
          select: { name: true, email: true, active: true },
        },
        _count: {
          select: {
            points: true,
          },
        },
        points: {
          where: { status: "PENDING" },
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prisma.partner.count(),
  ]);

  const pages = Math.ceil(total / take);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        Parceiros{" "}
        <span className="text-muted-foreground text-lg font-normal">({total})</span>
      </h1>

      <div className="divide-y rounded-xl border overflow-hidden">
        {partners.length === 0 && (
          <p className="px-4 py-8 text-center text-muted-foreground text-sm">
            Nenhum parceiro cadastrado.
          </p>
        )}

        {partners.map((p) => {
          const pendentes = p.points.length;
          const displayName = p.tradeName ?? p.companyName;

          return (
            <div
              key={p.id}
              className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/40 transition-colors"
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{p.companyName}</p>
                <p className="text-xs text-muted-foreground">
                  CNPJ: {p.cnpj} · {p.user.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  desde {new Date(p.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                {!p.user.active && (
                  <Badge variant="destructive" className="text-xs">
                    Inativo
                  </Badge>
                )}
                <Badge variant="secondary" className="text-xs">
                  {p._count.points} pontos
                </Badge>
                {pendentes > 0 && (
                  <Badge variant="default" className="text-xs">
                    {pendentes} pendente{pendentes > 1 ? "s" : ""}
                  </Badge>
                )}
                <Link
                  href={`/admin/pontos?parceiro=${p.id}`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Ver pontos
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/parceiros?page=${p}`}
              className={cn(
                buttonVariants({ variant: page === p ? "default" : "outline", size: "sm" }),
              )}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
