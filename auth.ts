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
    // signIn apenas libera o acesso — wallet/coins são criados no jwt callback,
    // depois que o PrismaAdapter persistiu o User no banco.
    async signIn() {
      return true;
    },

    async redirect({ url, baseUrl }) {
      // Se não há URL customizada (login direto), verificar se deve ir para onboarding
      if (url === baseUrl || url === `${baseUrl}/`) return `${baseUrl}/app`;
      if (url.startsWith(baseUrl)) return url;
      return baseUrl;
    },

    async jwt({ token, user, account }) {
      if (user) {
        // Primeiro login: user.id aqui é o CUID do banco (após o adapter criar o User)
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "CITIZEN";

        // Criar Wallet e creditar SIGNUP coins na primeira autenticação
        try {
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

            // Processar código de indicação via cookie (fluxo Google OAuth)
            if (account?.provider === "google") {
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
                // Cookie pode não estar disponível em todos os contextos
              }
            }
          }
        } catch (err) {
          // Nunca bloquear o login por falha no setup de wallet/coins
          console.error("[auth:jwt] erro no setup de wallet:", err);
        }
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
