import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/ratelimit";
import { creditCoins } from "@/lib/coins";
import bcrypt from "bcryptjs";
import { registerSchema } from "@/lib/schemas/user";

const app = new Hono();

// POST /api/auth/register — cadastro via email/senha
app.post("/register", zValidator("json", registerSchema), async (c) => {
  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
  const { success } = await checkRateLimit("auth", ip);
  if (!success) return c.json({ error: "Muitas tentativas. Tente novamente em 1 minuto." }, 429);

  const { name, email, password, referralCode } = c.req.valid("json");

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return c.json({ error: "E-mail já cadastrado." }, 409);

  // Validar código de indicação (se fornecido)
  let referrer: { id: string } | null = null;
  if (referralCode) {
    referrer = await prisma.user.findUnique({
      where: { referralCode },
      select: { id: true },
    });
    // Código inválido não bloqueia o cadastro — apenas ignora
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

  // Creditar +20 EcoCoins ao usuário que indicou
  if (referrer) {
    await creditCoins(referrer.id, "REFERRAL", user.id);
  }

  return c.json(user, 201);
});

export const authRouter = app;
