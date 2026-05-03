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

const RESIDUE_OPTIONS = [
  "Medicamentos",
  "Embalagens de medicamentos",
  "Seringas e agulhas",
  "Frascos e ampolas",
  "Termômetros de mercúrio",
  "Antibióticos",
  "Quimioterápicos",
];

const UF_LIST = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];

interface Partner {
  id: string;
  companyName: string;
  tradeName: string | null;
}

export default function NovoPontoPage() {
  const router = useRouter();
  const [partners, setPartners] = useState<Partner[] | null>(null);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    partnerId: "",
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    latitude: "",
    longitude: "",
    phone: "",
    email: "",
    residueTypes: [] as string[],
    status: "APPROVED",
  });

  async function fetchPartners() {
    if (partners !== null) return;
    setLoadingPartners(true);
    const res = await fetch("/api/admin/pontos?status=APPROVED&page=1");
    // precisamos de parceiros, não pontos — buscar via endpoint existente de parceiros
    const r2 = await fetch("/api/admin/parceiros");
    if (r2.ok) {
      const data: Array<{ id: string; companyName: string; tradeName: string | null }> = await r2.json();
      setPartners(data);
    }
    setLoadingPartners(false);
  }

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleResidue(type: string) {
    setForm((prev) => ({
      ...prev,
      residueTypes: prev.residueTypes.includes(type)
        ? prev.residueTypes.filter((t) => t !== type)
        : [...prev.residueTypes, type],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.partnerId) { toast.error("Selecione um parceiro"); return; }
    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);
    if (isNaN(lat) || isNaN(lng)) { toast.error("Coordenadas inválidas"); return; }

    setSaving(true);
    const res = await fetch("/api/admin/pontos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        latitude: lat,
        longitude: lng,
      }),
    });

    if (res.ok) {
      toast.success("Ponto criado com sucesso!");
      router.push("/admin/pontos");
      router.refresh();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err?.error ?? "Erro ao criar o ponto");
    }
    setSaving(false);
  }

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <Link href="/admin/pontos" className={buttonVariants({ variant: "ghost", size: "sm" }) + " mb-3 -ml-2"}>
          ← Voltar
        </Link>
        <h1 className="text-2xl font-bold">Novo ponto de coleta</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Parceiro */}
        <div className="space-y-1.5">
          <Label>Parceiro *</Label>
          <select
            id="parceiro"
            aria-label="Parceiro"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-eco-green"
            value={form.partnerId}
            onFocus={fetchPartners}
            onChange={(e) => set("partnerId", e.target.value)}
            required
          >
            <option value="">
              {loadingPartners ? "Carregando parceiros…" : "Selecione um parceiro"}
            </option>
            {partners?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.tradeName ?? p.companyName}
              </option>
            ))}
          </select>
        </div>

        {/* Nome */}
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome do ponto *</Label>
          <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} required minLength={2} placeholder="Ex.: Farmácia Central" />
        </div>

        {/* Endereço */}
        <div className="space-y-1.5">
          <Label htmlFor="address">Endereço *</Label>
          <Input id="address" value={form.address} onChange={(e) => set("address", e.target.value)} required placeholder="Rua, número, bairro" />
        </div>

        {/* Cidade / UF / CEP */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="city">Cidade *</Label>
            <Input id="city" value={form.city} onChange={(e) => set("city", e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="state">UF *</Label>
            <select
              id="state"
              aria-label="UF"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-eco-green"
              value={form.state}
              onChange={(e) => set("state", e.target.value)}
              required
            >
              <option value="">UF</option>
              {UF_LIST.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="zipCode">CEP *</Label>
          <Input id="zipCode" value={form.zipCode} onChange={(e) => set("zipCode", e.target.value)} required placeholder="00000-000" maxLength={9} />
        </div>

        {/* Coordenadas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="latitude">Latitude *</Label>
            <Input id="latitude" type="number" step="any" value={form.latitude} onChange={(e) => set("latitude", e.target.value)} required placeholder="-23.550520" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="longitude">Longitude *</Label>
            <Input id="longitude" type="number" step="any" value={form.longitude} onChange={(e) => set("longitude", e.target.value)} required placeholder="-46.633308" />
          </div>
        </div>

        {/* Contato */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(11) 99999-9999" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="contato@parceiro.com" />
          </div>
        </div>

        {/* Tipos de resíduo */}
        <div className="space-y-1.5">
          <Label>Tipos de resíduo aceitos</Label>
          <div className="flex flex-wrap gap-2">
            {RESIDUE_OPTIONS.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => toggleResidue(type)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  form.residueTypes.includes(type)
                    ? "bg-eco-green text-white border-eco-green"
                    : "border-muted-foreground/30 text-muted-foreground hover:border-eco-green hover:text-eco-green"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Status inicial */}
        <div className="space-y-1.5">
          <Label htmlFor="status">Status inicial</Label>
          <select
            id="status"
            aria-label="Status inicial"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-eco-green"
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
          >
            <option value="APPROVED">Aprovado</option>
            <option value="PENDING">Pendente</option>
          </select>
        </div>

        <Button type="submit" disabled={saving} className="w-full bg-eco-green hover:bg-eco-green/90 text-white">
          {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
          Criar ponto
        </Button>
      </form>
    </div>
  );
}
