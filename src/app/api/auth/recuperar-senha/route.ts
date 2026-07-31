import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/ratelimit";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "unknown";
  const rateLimit = await checkRateLimit("auth", `password-reset:${ip}`);
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Muitas solicitações. Tente novamente mais tarde." }, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "E-mail inválido" }, { status: 400 });
  }
  const { email } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  // Always return 200 to prevent email enumeration
  if (!user || !user.active) {
    return NextResponse.json({ ok: true });
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
    prisma.passwordResetToken.create({ data: { tokenHash, userId: user.id, expiresAt } }),
  ]);

  const resetUrl = `${process.env.NEXTAUTH_URL ?? "https://ecomed.eco.br"}/redefinir-senha?token=${token}`;

  await sendEmail("password-reset", user.email, {
    name: user.name ?? "Usuário",
    resetUrl,
  });

  return NextResponse.json({ ok: true });
}
