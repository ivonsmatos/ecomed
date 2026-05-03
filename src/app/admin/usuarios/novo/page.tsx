"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";

export default function NovoUsuarioPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "CITIZEN",
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const body: Record<string, string> = { name: form.name, email: form.email, role: form.role };
    if (form.password) body.password = form.password;

    const res = await fetch("/api/admin/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      toast.success("Usuário criado com sucesso!");
      router.push("/admin/usuarios");
      router.refresh();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err?.error ?? "Erro ao criar usuário");
    }
    setSaving(false);
  }

  return (
    <div className="max-w-md space-y-8">
      <div>
        <Link href="/admin/usuarios" className={buttonVariants({ variant: "ghost", size: "sm" }) + " mb-3 -ml-2"}>
          ← Voltar
        </Link>
        <h1 className="text-2xl font-bold">Novo usuário</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome *</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            required
            minLength={2}
            placeholder="Nome completo"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail *</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            required
            placeholder="usuario@exemplo.com"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            minLength={6}
            placeholder="Mínimo 6 caracteres (opcional)"
          />
          <p className="text-xs text-muted-foreground">Deixe em branco se o usuário fará login via Google.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="role">Perfil *</Label>
          <select
            id="role"
            aria-label="Perfil"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-eco-green"
            value={form.role}
            onChange={(e) => set("role", e.target.value)}
          >
            <option value="CITIZEN">Cidadão</option>
            <option value="PARTNER">Parceiro</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        <Button type="submit" disabled={saving} className="w-full bg-eco-green hover:bg-eco-green/90 text-white">
          {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
          Criar usuário
        </Button>
      </form>
    </div>
  );
}
