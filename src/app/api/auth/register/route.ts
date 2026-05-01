import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/ratelimit";
import { creditCoins } from "@/lib/coins";
import { registerSchema } from "@/lib/schemas/user";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("CF-Connecting-IP") ?? "unknown";
  const { success } = await checkRateLimit("auth", ip);
  if (!success) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente em 1 minuto." },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }
  const { name, email, password, referralCode } = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: "E-mail já cadastrado." }, { status: 409 });
  }

  let referrer: { id: string } | null = null;
  if (referralCode) {
    referrer = await prisma.user.findUnique({
      where: { referralCode },
      select: { id: true },
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      referredById: referrer?.id ?? null,
    },
    select: { id: true, email: true },
  });

  if (referrer) {
    await creditCoins(referrer.id, "REFERRAL", user.id);
  }

  return NextResponse.json(user, { status: 201 });
}
