"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Upload, ExternalLink } from "lucide-react";

interface Campaign {
  id: string;
  advertiser: string;
  title: string;
  imageUrl: string;
  targetUrl: string;
  placement: string;
  format: string;
  targetState: string | null;
  targetCity: string | null;
  centerLat: number | null;
  centerLng: number | null;
  radiusKm: number | null;
  active: boolean;
  endsAt: string | null;
  weight: number;
  impressions: number;
  clicks: number;
}

const PLACEMENTS = [
  { value: "MAP_LIST", label: "Lista do mapa" },
  { value: "CITY_DISCARD", label: "Página da cidade (/descarte)" },
  { value: "IMPACT", label: "Página de impacto" },
  { value: "BLOG_ARTICLE", label: "Fim de artigo do blog" },
];

const FORMATS = [
  { value: "LEADERBOARD", label: "Leaderboard (728×90)" },
  { value: "RECTANGLE", label: "Retângulo (300×250)" },
  { value: "MOBILE_BANNER", label: "Faixa mobile (320×100)" },
];

const PLACEMENT_LABEL = Object.fromEntries(PLACEMENTS.map((p) => [p.value, p.label]));

const UF_LIST = ["", "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

const EMPTY = {
  advertiser: "",
  partnerId: "",
  title: "",
  imageUrl: "",
  targetUrl: "",
  placement: "CITY_DISCARD",
  format: "LEADERBOARD",
  targetState: "",
  targetCity: "",
  centerLat: "",
  centerLng: "",
  radiusKm: "",
  endsAt: "",
  weight: "1",
};

interface PartnerOption {
  id: string;
  companyName: string;
  tradeName: string | null;
}

export function AdsManager({ initial }: { initial: Campaign[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [partners, setPartners] = useState<PartnerOption[]>([]);

  // Carrega os parceiros para o seletor quando o formulário abre (1x)
  useEffect(() => {
    if (showForm && partners.length === 0) {
      fetch("/api/admin/ads/partners")
        .then((r) => (r.ok ? r.json() : []))
        .then((data: PartnerOption[]) => setPartners(data))
        .catch(() => null);
    }
  }, [showForm, partners.length]);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/ads/upload", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.url) {
      set("imageUrl", data.url);
      toast.success("Imagem enviada!");
    } else {
      toast.error(data.error ?? "Falha no upload");
    }
    setUploading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.imageUrl) { toast.error("Envie o criativo do banner"); return; }

    setSaving(true);
    const res = await fetch("/api/admin/ads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        advertiser: form.advertiser,
        partnerId: form.partnerId || null,
        title: form.title,
        imageUrl: form.imageUrl,
        targetUrl: form.targetUrl,
        placement: form.placement,
        format: form.format,
        targetState: form.targetState || null,
        targetCity: form.targetCity || null,
        centerLat: form.centerLat ? Number(form.centerLat) : null,
        centerLng: form.centerLng ? Number(form.centerLng) : null,
        radiusKm: form.radiusKm ? Number(form.radiusKm) : null,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
        weight: Number(form.weight) || 1,
      }),
    });

    if (res.ok) {
      toast.success("Campanha criada!");
      setForm({ ...EMPTY });
      setShowForm(false);
      router.refresh();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err?.error ?? "Erro ao criar campanha");
    }
    setSaving(false);
  }

  async function toggleActive(c: Campaign) {
    const res = await fetch(`/api/admin/ads/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !c.active }),
    });
    if (res.ok) router.refresh();
    else toast.error("Erro ao atualizar");
  }

  async function remove(c: Campaign) {
    if (!confirm(`Excluir a campanha "${c.title}"? Esta ação não pode ser desfeita.`)) return;
    const res = await fetch(`/api/admin/ads/${c.id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Campanha excluída"); router.refresh(); }
    else toast.error("Erro ao excluir");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Publicidade</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Banners de parceiros. Só marca/loja/serviços — nunca medicamento de prescrição (ANVISA).
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm((s) => !s)}>
          <Plus className="mr-1.5 size-4" />
          Nova campanha
        </Button>
      </div>

      {/* Formulário de criação */}
      {showForm && (
        <Card>
          <CardContent className="pt-5">
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="advertiser">Anunciante *</Label>
                  <Input id="advertiser" value={form.advertiser} onChange={(e) => set("advertiser", e.target.value)} required placeholder="Farmácia São Rafael" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="title">Título interno *</Label>
                  <Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} required placeholder="SR — campanha junho SC" />
                </div>
              </div>

              {/* Vínculo com parceiro — habilita o painel de métricas do parceiro */}
              <div className="space-y-1.5">
                <Label htmlFor="partnerId">Parceiro vinculado (opcional)</Label>
                <select
                  id="partnerId"
                  aria-label="Parceiro vinculado"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={form.partnerId}
                  onChange={(e) => set("partnerId", e.target.value)}
                >
                  <option value="">Sem vínculo (anunciante externo)</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.tradeName ?? p.companyName}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Ao vincular, o parceiro vê as métricas desta campanha no painel dele.
                </p>
              </div>

              {/* Upload */}
              <div className="space-y-1.5">
                <Label>Criativo (banner) *</Label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent">
                    {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                    {uploading ? "Enviando…" : "Enviar imagem"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
                  </label>
                  {form.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.imageUrl} alt="Prévia" className="h-12 rounded border object-contain" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">JPG/PNG/WebP até 5 MB. Convertido para WebP automaticamente.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="targetUrl">URL de destino *</Label>
                <Input id="targetUrl" type="url" value={form.targetUrl} onChange={(e) => set("targetUrl", e.target.value)} required placeholder="https://farmaciasaorafael.com.br" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="placement">Onde exibir *</Label>
                  <select id="placement" aria-label="Onde exibir" className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.placement} onChange={(e) => set("placement", e.target.value)}>
                    {PLACEMENTS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="format">Formato *</Label>
                  <select id="format" aria-label="Formato" className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.format} onChange={(e) => set("format", e.target.value)}>
                    {FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="targetState">UF (opcional)</Label>
                  <select id="targetState" aria-label="UF alvo" className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.targetState} onChange={(e) => set("targetState", e.target.value)}>
                    {UF_LIST.map((uf) => <option key={uf} value={uf}>{uf || "Nacional"}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="targetCity">Cidade (opcional)</Label>
                  <Input id="targetCity" value={form.targetCity} onChange={(e) => set("targetCity", e.target.value)} placeholder="Chapecó" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="endsAt">Termina em (opcional)</Label>
                  <Input id="endsAt" type="date" value={form.endsAt} onChange={(e) => set("endsAt", e.target.value)} />
                </div>
              </div>

              {/* Raio hiperlocal — só vale no placement "Lista do mapa" (precisa do GPS do usuário) */}
              <div className="rounded-md border border-dashed p-3 space-y-2">
                <p className="text-sm font-medium">Raio hiperlocal (opcional)</p>
                <p className="text-xs text-muted-foreground">
                  Exibe o banner só a quem estiver a até X km da loja. Funciona apenas no espaço{" "}
                  <strong>Lista do mapa</strong> (usa o GPS do usuário). Tem prioridade sobre cidade/UF.
                </p>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="centerLat">Latitude da loja</Label>
                    <Input id="centerLat" type="number" step="any" value={form.centerLat} onChange={(e) => set("centerLat", e.target.value)} placeholder="-27.0965" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="centerLng">Longitude da loja</Label>
                    <Input id="centerLng" type="number" step="any" value={form.centerLng} onChange={(e) => set("centerLng", e.target.value)} placeholder="-52.6186" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="radiusKm">Raio (km)</Label>
                    <Input id="radiusKm" type="number" min={1} max={500} value={form.radiusKm} onChange={(e) => set("radiusKm", e.target.value)} placeholder="10" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={saving || uploading}>
                  {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                  Criar campanha
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de campanhas */}
      {initial.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
          Nenhuma campanha cadastrada ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {initial.map((c) => {
            const ctr = c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(1) : "0.0";
            return (
              <Card key={c.id}>
                <CardContent className="flex flex-wrap items-center gap-4 py-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.imageUrl} alt={c.advertiser} className="h-12 w-24 shrink-0 rounded border object-contain bg-muted/30" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{c.title}</p>
                      <Badge variant={c.active ? "default" : "secondary"}>{c.active ? "Ativa" : "Pausada"}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {c.advertiser} · {PLACEMENT_LABEL[c.placement] ?? c.placement}
                      {c.radiusKm && c.centerLat != null
                        ? ` · raio ${c.radiusKm} km`
                        : c.targetCity
                          ? ` · ${c.targetCity}`
                          : c.targetState
                            ? ` · ${c.targetState}`
                            : " · nacional"}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="font-semibold tabular-nums">{c.impressions.toLocaleString("pt-BR")}</p>
                      <p className="text-xs text-muted-foreground">impressões</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold tabular-nums">{c.clicks.toLocaleString("pt-BR")}</p>
                      <p className="text-xs text-muted-foreground">cliques</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold tabular-nums">{ctr}%</p>
                      <p className="text-xs text-muted-foreground">CTR</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <a href={c.targetUrl} target="_blank" rel="noopener noreferrer" className="rounded-md p-2 hover:bg-accent" title="Abrir destino">
                      <ExternalLink className="size-4" />
                    </a>
                    <Button variant="outline" size="sm" onClick={() => toggleActive(c)}>
                      {c.active ? "Pausar" : "Ativar"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(c)} title="Excluir">
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
