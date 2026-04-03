import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acesso",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
