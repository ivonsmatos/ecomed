import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MapPin, FileText, AlertTriangle, Building2 } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Painel Admin | EcoMed" };

export default async function AdminPage() {
  await requireAdmin();

  const [users, pendingPoints, approvedPoints, reports, pendingCandidates] = await Promise.all([
    prisma.user.count(),
    prisma.point.count({ where: { status: "PENDING" } }),
    prisma.point.count({ where: { status: "APPROVED" } }),
    prisma.report.count({ where: { resolved: false } }),
    prisma.partner.count({ where: { user: { role: "CITIZEN" } } }),
  ]);

  const recentPoints = await prisma.point.findMany({
    where: { status: "PENDING" },
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { partner: { select: { companyName: true } } },
  });

  const stats = [
    { label: "Usuários", value: users, icon: Users, href: "/admin/usuarios" },
    { label: "Pontos aprovados", value: approvedPoints, icon: MapPin, href: "/admin/pontos" },
    { label: "Candidatos parceiros", value: pendingCandidates, icon: Building2, href: "/admin/parceiros", alert: pendingCandidates > 0 },
    { label: "Pontos pendentes", value: pendingPoints, icon: AlertTriangle, href: "/admin/pontos?status=PENDING", alert: pendingPoints > 0 },
    { label: "Reportes abertos", value: reports, icon: FileText, href: "/admin/reportes", alert: reports > 0 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Painel Admin</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map(({ label, value, icon: Icon, href, alert }) => (
          <Link key={label} href={href}>
            <Card className={`hover:shadow-md transition-shadow cursor-pointer ${alert ? "border-orange-300" : ""}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {label}
                </CardTitle>
                <Icon className={`size-4 ${alert ? "text-orange-500" : "text-muted-foreground"}`} />
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-bold ${alert ? "text-orange-600" : ""}`}>{value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Pontos pendentes */}
      {recentPoints.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Pontos aguardando aprovação</h2>
            <Link href="/admin/pontos?status=PENDING" className={buttonVariants({ variant: "ghost", size: "sm" })}>Ver todos</Link>
          </div>
          <div className="space-y-2">
            {recentPoints.map((p) => (
              <Card key={p.id}>
                <CardContent className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.partner.companyName} · {p.city}, {p.state}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary">Pendente</Badge>
                    <Link href={`/admin/pontos/${p.id}`} className={buttonVariants({ size: "sm" })}>Revisar</Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

