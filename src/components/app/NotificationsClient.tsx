"use client";

import { useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Bell, BellOff, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: Date;
}

interface Props {
  notifications: Notification[];
}

export function NotificationsClient({ notifications: initial }: Props) {
  const [notifications, setNotifications] = useState(initial);
  const [isPending, startTransition] = useTransition();

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markRead(id: string) {
    const res = await fetch(`/api/notificacoes/${id}/ler`, { method: "POST" });
    if (res.ok) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    }
  }

  async function markAllRead() {
    startTransition(async () => {
      const res = await fetch("/api/notificacoes/ler-todas", { method: "POST" });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        toast.success("Todas notificações marcadas como lidas");
      }
    });
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center text-muted-foreground">
        <BellOff className="size-12 opacity-30" />
        <p className="text-sm">Nenhuma notificação por aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={markAllRead}
            disabled={isPending}
          >
            <CheckCheck className="size-3.5" />
            Marcar todas como lidas
          </Button>
        </div>
      )}

      <ul className="space-y-2">
        {notifications.map((n) => (
          <li
            key={n.id}
            className={cn(
              "flex gap-3 rounded-lg border p-4 transition-colors",
              !n.read && "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
            )}
          >
            <Bell
              className={cn(
                "mt-0.5 size-4 shrink-0",
                n.read ? "text-muted-foreground" : "text-green-700"
              )}
            />
            <div className="flex-1 space-y-0.5">
              <p className={cn("text-sm font-medium", n.read && "text-muted-foreground")}>
                {n.title}
              </p>
              <p className="text-xs text-muted-foreground">{n.body}</p>
              <p className="text-xs text-muted-foreground/60">
                {formatDistanceToNow(new Date(n.createdAt), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </p>
            </div>
            {!n.read && (
              <button
                onClick={() => markRead(n.id)}
                className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                title="Marcar como lida"
              >
                <Check className="size-3.5" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
