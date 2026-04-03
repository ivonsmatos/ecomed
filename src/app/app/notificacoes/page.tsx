import { Bell, BellOff, Check } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { NotificationsClient } from "@/components/app/NotificationsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notificações | EcoMed",
};

export default async function NotificacoesPage() {
  const session = await requireSession();

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user!.id! },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="size-6" />
          Notificações
        </h1>
      </div>

      <NotificationsClient notifications={notifications} />
    </div>
  );
}
