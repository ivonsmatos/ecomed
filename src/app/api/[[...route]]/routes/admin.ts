import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/../auth";
import { sendEmail } from "@/lib/email";

const app = new Hono();

async function requireAdminSession(c: Parameters<Parameters<typeof app.use>[1]>[0]) {
  const session = await auth();
  if (!session?.user?.id) return c.json({ error: "Não autenticado" }, 401);
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== "ADMIN") return c.json({ error: "Sem permissão" }, 403);
  return session;
}

// GET /api/admin/stats
app.get("/stats", async (c) => {
  const r = await requireAdminSession(c);
  if (r && typeof r === "object" && "json" in r) return r;

  const [users, approvedPoints, pendingPoints, openReports] = await Promise.all([
    prisma.user.count({ where: { active: true } }),
    prisma.point.count({ where: { status: "APPROVED" } }),
    prisma.point.count({ where: { status: "PENDING" } }),
    prisma.report.count({ where: { resolved: false } }),
  ]);

  return c.json({ users, approvedPoints, pendingPoints, openReports });
});

// GET /api/admin/pontos
app.get(
  "/pontos",
  zValidator("query", z.object({ status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(), page: z.coerce.number().default(1) })),
  async (c) => {
    const r = await requireAdminSession(c);
    if (r && typeof r === "object" && "json" in r) return r;

    const { status, page } = c.req.valid("query");
    const take = 20;
    const skip = (page - 1) * take;

    const [points, total] = await Promise.all([
      prisma.point.findMany({
        where: status ? { status } : undefined,
        include: { partner: { select: { companyName: true, tradeName: true } } },
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      prisma.point.count({ where: status ? { status } : undefined }),
    ]);

    return c.json({ points, total, page, pages: Math.ceil(total / take) });
  },
);

// POST /api/admin/pontos/:id/aprovar
app.post("/pontos/:id/aprovar", async (c) => {
  const r = await requireAdminSession(c);
  if (r && typeof r === "object" && "json" in r) return r;

  const point = await prisma.point.update({
    where: { id: c.req.param("id") },
    data: { status: "APPROVED", rejectedReason: null },
    select: {
      id: true,
      name: true,
      partner: { select: { companyName: true, tradeName: true, user: { select: { email: true } } } },
    },
  });

  const partnerName = point.partner.tradeName ?? point.partner.companyName;
  sendEmail("partner-approved", point.partner.user.email, {
    partnerName,
    pointName: point.name,
    dashboardUrl: `${process.env.NEXTAUTH_URL ?? "https://ecomed.eco.br"}/parceiro/dashboard`,
  }).catch(console.error);

  return c.json({ ok: true, point });
});

// POST /api/admin/pontos/:id/rejeitar
app.post(
  "/pontos/:id/rejeitar",
  zValidator("json", z.object({ motivo: z.string().min(5, "Informe o motivo") })),
  async (c) => {
    const r = await requireAdminSession(c);
    if (r && typeof r === "object" && "json" in r) return r;

    const { motivo } = c.req.valid("json");
    const point = await prisma.point.update({
      where: { id: c.req.param("id") },
      data: { status: "REJECTED", rejectedReason: motivo },
      select: {
        id: true,
        name: true,
        partner: { select: { companyName: true, tradeName: true, user: { select: { email: true } } } },
      },
    });

    const partnerName = point.partner.tradeName ?? point.partner.companyName;
    sendEmail("partner-rejected", point.partner.user.email, {
      partnerName,
      pointName: point.name,
      motivo,
    }).catch(console.error);

    return c.json({ ok: true, point });
  },
);

// GET /api/admin/usuarios
app.get(
  "/usuarios",
  zValidator("query", z.object({ page: z.coerce.number().default(1) })),
  async (c) => {
    const r = await requireAdminSession(c);
    if (r && typeof r === "object" && "json" in r) return r;

    const { page } = c.req.valid("query");
    const take = 30;
    const skip = (page - 1) * take;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      prisma.user.count(),
    ]);

    return c.json({ users, total, page, pages: Math.ceil(total / take) });
  },
);

// PATCH /api/admin/usuarios/:id
app.patch(
  "/usuarios/:id",
  zValidator("json", z.object({ role: z.enum(["CITIZEN", "PARTNER", "ADMIN"]).optional(), active: z.boolean().optional() })),
  async (c) => {
    const r = await requireAdminSession(c);
    if (r && typeof r === "object" && "json" in r) return r;

    const data = c.req.valid("json");
    const user = await prisma.user.update({ where: { id: c.req.param("id") }, data, select: { id: true, role: true, active: true } });
    return c.json({ ok: true, user });
  },
);

// GET /api/admin/reportes
app.get(
  "/reportes",
  zValidator("query", z.object({ resolved: z.coerce.boolean().optional(), page: z.coerce.number().default(1) })),
  async (c) => {
    const r = await requireAdminSession(c);
    if (r && typeof r === "object" && "json" in r) return r;

    const { resolved, page } = c.req.valid("query");
    const take = 20;
    const skip = (page - 1) * take;

    const where = resolved !== undefined ? { resolved } : {};

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

    return c.json({ reports, total, page, pages: Math.ceil(total / take) });
  },
);

// PATCH /api/admin/reportes/:id/resolver
app.patch("/reportes/:id/resolver", async (c) => {
  const r = await requireAdminSession(c);
  if (r && typeof r === "object" && "json" in r) return r;

  const report = await prisma.report.update({ where: { id: c.req.param("id") }, data: { resolved: true }, select: { id: true } });
  return c.json({ ok: true, report });
});

export { app as adminRouter };

