"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, ShieldCheck, UserCheck, UserX } from "lucide-react";

const ROLE_LABEL: Record<string, string> = { CITIZEN: "Cidadão", PARTNER: "Parceiro", ADMIN: "Admin" };
type Role = "CITIZEN" | "PARTNER" | "ADMIN";

interface UserActionsProps {
  userId: string;
  role: Role;
  active: boolean;
}

export function UserActions({ userId, role, active }: UserActionsProps) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  async function patch(data: Record<string, unknown>) {
    const res = await fetch(`/api/admin/usuarios/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res;
  }

  async function handleToggleActive() {
    setLoading("active");
    const res = await patch({ active: !active });
    if (res.ok) {
      toast.success(active ? "Usuário desativado." : "Usuário reativado.");
      router.refresh();
    } else {
      toast.error("Erro ao atualizar usuário");
    }
    setLoading(null);
  }

  async function handleRoleChange(newRole: Role) {
    if (newRole === role) return;
    setLoading("role");
    const res = await patch({ role: newRole });
    if (res.ok) {
      toast.success(`Role alterado para ${ROLE_LABEL[newRole]}.`);
      router.refresh();
    } else {
      toast.error("Erro ao alterar role");
    }
    setLoading(null);
  }

  async function handleDelete() {
    setLoading("delete");
    const res = await fetch(`/api/admin/usuarios/${userId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Usuário excluído.");
      router.refresh();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err?.error ?? "Erro ao excluir usuário");
    }
    setLoading(null);
    setConfirmDelete(false);
  }

  return (
    <div className="flex items-center gap-1">
      {/* Role select */}
      <select
        className="rounded-md border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-eco-green disabled:opacity-50"
        value={role}
        onChange={(e) => handleRoleChange(e.target.value as Role)}
        disabled={loading === "role"}
        title="Alterar role"
      >
        <option value="CITIZEN">Cidadão</option>
        <option value="PARTNER">Parceiro</option>
        <option value="ADMIN">Admin</option>
      </select>

      {/* Toggle ativo */}
      <Button
        variant="ghost"
        size="icon"
        className={`size-8 ${active ? "text-eco-green hover:bg-eco-green/10" : "text-muted-foreground hover:bg-muted"}`}
        title={active ? "Desativar usuário" : "Ativar usuário"}
        onClick={handleToggleActive}
        disabled={!!loading}
      >
        {loading === "active" ? <Loader2 className="size-4 animate-spin" /> : active ? <UserCheck className="size-4" /> : <UserX className="size-4" />}
      </Button>

      {/* Excluir */}
      {!confirmDelete ? (
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-destructive hover:bg-destructive/10"
          title="Excluir usuário"
          onClick={() => setConfirmDelete(true)}
          disabled={!!loading}
        >
          <Trash2 className="size-4" />
        </Button>
      ) : (
        <div className="flex items-center gap-1">
          <Button variant="destructive" size="sm" className="h-7 text-xs px-2" onClick={handleDelete} disabled={!!loading}>
            {loading === "delete" ? <Loader2 className="size-3 mr-1 animate-spin" /> : null}
            Excluir?
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => setConfirmDelete(false)} disabled={!!loading}>
            Não
          </Button>
        </div>
      )}
    </div>
  );
}
