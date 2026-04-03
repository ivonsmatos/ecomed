import { auth } from "@/../../auth";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";

/**
 * Retorna a sessão do usuário em Server Components.
 * Uso: const session = await getSession()
 */
export async function getSession(): Promise<Session | null> {
  return auth();
}

/**
 * Garante que existe sessão válida — redireciona para /entrar se não houver.
 * Uso: const session = await requireSession()
 */
export async function requireSession(): Promise<Session> {
  const session = await auth();
  if (!session?.user) redirect("/entrar");
  return session;
}

/**
 * Garante que o usuário tem role ADMIN.
 */
export async function requireAdmin(): Promise<Session> {
  const session = await requireSession();
  if ((session.user as { role?: string }).role !== "ADMIN") redirect("/app");
  return session;
}

/**
 * Garante que o usuário tem role PARTNER ou ADMIN.
 */
export async function requirePartner(): Promise<Session> {
  const session = await requireSession();
  const role = (session.user as { role?: string }).role;
  if (role !== "PARTNER" && role !== "ADMIN") redirect("/app");
  return session;
}
