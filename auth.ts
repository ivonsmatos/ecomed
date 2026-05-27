import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { loginSchema } from "@/lib/schemas/user";
import { creditCoins } from "@/lib/coins";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/entrar",
    error: "/entrar",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user?.id) return true;

      try {
        // Na primeira autenticação, criar Wallet e creditar SIGNUP coins
        const walletExists = await prisma.wallet.findUnique({
          where: { userId: user.id },
          select: { id: true },
        });

        if (!walletExists) {
          await prisma.wallet.upsert({
            where: { userId: user.id },
            update: {},
            create: { userId: user.id, balance: 0, totalEarned: 0 },
          });
          await creditCoins(user.id, "SIGNUP");

          // Processar código de indicação salvo em cookie (fluxo Google OAuth)
          try {
            const cookieStore = await cookies();
            const refCookie = cookieStore.get("ecomed_ref");
            if (refCookie?.value) {
              const referralCode = decodeURIComponent(refCookie.value);
              const referrer = await prisma.user.findUnique({
                where: { referralCode },
                select: { id: true },
              });
              if (referrer && referrer.id !== user.id) {
                await prisma.user.update({
                  where: { id: user.id },
                  data: { referredById: referrer.id },
                });
                await creditCoins(referrer.id, "REFERRAL", user.id);
              }
            }
          } catch {
            // Cookie pode não estar disponível em todos os contextos — falha silenciosa
          }
        }
      } catch (err) {
        // Nunca bloquear o login por falha no setup de wallet/coins
        console.error("[auth:signIn] erro no setup pós-login:", err);
      }

      return true;
    },

    async redirect({ url, baseUrl }) {
      // Se não há URL customizada (login direto), verificar se deve ir para onboarding
      if (url === baseUrl || url === `${baseUrl}/`) return `${baseUrl}/app`;
      if (url.startsWith(baseUrl)) return url;
      return baseUrl;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "CITIZEN";
      }
      // Sempre busca o role atualizado do banco para refletir promoções sem re-login
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        });
        if (dbUser) token.role = dbUser.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
});
