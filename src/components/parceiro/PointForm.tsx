"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPointSchema, type CreatePointInput } from "@/lib/schemas/point";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";

const RESIDUE_TYPES = [
  "Medicamentos",
  "Seringas e agulhas",
  "Ampolas",
  "Comprimidos",
  "Líquidos",
  "Pomadas e cremes",
  "Inaladores",
  "Embalagens contaminadas",
];

const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

interface PointFormProps {
  defaultValues?: Partial<CreatePointInput>;
  pointId?: string; // se passado, faz PUT, senão faz POST
}

export function PointForm({ defaultValues, pointId }: PointFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreatePointInput>({
    resolver: zodResolver(createPointSchema),
    defaultValues: {
      residueTypes: [],
      schedules: [],
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "schedules" });
  const residueTypes = watch("residueTypes");

  function toggleResidue(type: string) {
    if (residueTypes.includes(type)) {
      setValue("residueTypes", residueTypes.filter((t) => t !== type));
    } else {
      setValue("residueTypes", [...residueTypes, type]);
    }
  }

  async function onSubmit(data: CreatePointInput) {
    setLoading(true);
    try {
      const url = pointId ? `/api/parceiro/pontos/${pointId}` : "/api/parceiro/pontos";
      const method = pointId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Erro ao salvar");
      }

      toast.success(pointId ? "Ponto atualizado! Aguardando revisão." : "Ponto cadastrado! Aguardando aprovação.");
      router.push("/parceiro/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
      {/* Dados básicos */}
      <section className="rounded-xl border p-5 space-y-4">
        <h2 className="font-semibold">Informações do ponto</h2>

        <div className="space-y-1">
          <Label htmlFor="name">Nome do ponto *</Label>
          <Input id="name" placeholder="Ex: Farmácia Central" {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" placeholder="(11) 99999-9999" {...register("phone")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">E-mail de contato</Label>
            <Input id="email" type="email" placeholder="contato@farmacia.com.br" {...register("email")} />
          </div>
        </div>
      </section>

      {/* Endereço */}
      <section className="rounded-xl border p-5 space-y-4">
        <h2 className="font-semibold">Endereço</h2>

        <div className="space-y-1">
          <Label htmlFor="address">Endereço completo *</Label>
          <Input id="address" placeholder="Rua, número, complemento" {...register("address")} />
          {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="city">Cidade *</Label>
            <Input id="city" placeholder="São Paulo" {...register("city")} />
            {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="state">Estado *</Label>
            <Input id="state" placeholder="SP" maxLength={2} {...register("state")} />
            {errors.state && <p className="text-xs text-destructive">{errors.state.message}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="zipCode">CEP * (somente números)</Label>
            <Input id="zipCode" placeholder="01310100" maxLength={8} {...register("zipCode")} />
            {errors.zipCode && <p className="text-xs text-destructive">{errors.zipCode.message}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="latitude">Latitude *</Label>
            <Input id="latitude" type="number" step="any" placeholder="-23.5505" {...register("latitude", { valueAsNumber: true })} />
            {errors.latitude && <p className="text-xs text-destructive">{errors.latitude.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="longitude">Longitude *</Label>
            <Input id="longitude" type="number" step="any" placeholder="-46.6333" {...register("longitude", { valueAsNumber: true })} />
            {errors.longitude && <p className="text-xs text-destructive">{errors.longitude.message}</p>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Dica: use o Google Maps para obter as coordenadas — clique com botão direito no endereço.</p>
      </section>

      {/* Tipos de resíduo */}
      <section className="rounded-xl border p-5 space-y-4">
        <h2 className="font-semibold">Tipos de resíduo aceitos *</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {RESIDUE_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={residueTypes.includes(type)}
                onCheckedChange={() => toggleResidue(type)}
              />
              <span className="text-sm">{type}</span>
            </label>
          ))}
        </div>
        {errors.residueTypes && <p className="text-xs text-destructive">{errors.residueTypes.message}</p>}
      </section>

      {/* Horários */}
      <section className="rounded-xl border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Horários de funcionamento</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ dayOfWeek: 1, opens: "08:00", closes: "18:00", closed: false })}
          >
            <Plus className="size-4 mr-1.5" /> Adicionar dia
          </Button>
        </div>

        {fields.length === 0 && <p className="text-sm text-muted-foreground">Nenhum horário cadastrado.</p>}

        {fields.map((field, idx) => (
          <div key={field.id} className="flex items-center gap-3 flex-wrap">
            <select
              className="h-9 rounded-md border bg-background px-3 text-sm"
              {...register(`schedules.${idx}.dayOfWeek`, { valueAsNumber: true })}
            >
              {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
            <Input className="w-24" type="time" {...register(`schedules.${idx}.opens`)} />
            <span className="text-muted-foreground text-sm">até</span>
            <Input className="w-24" type="time" {...register(`schedules.${idx}.closes`)} />
            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
              <Checkbox
                checked={watch(`schedules.${idx}.closed`)}
                onCheckedChange={(v) => setValue(`schedules.${idx}.closed`, !!v)}
              />
              Fechado
            </label>
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(idx)}>
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ))}
      </section>

      <Button type="submit" className="bg-green-700 hover:bg-green-800 text-white w-full sm:w-auto" disabled={loading}>
        {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
        {pointId ? "Salvar alterações" : "Cadastrar ponto"}
      </Button>
    </form>
  );
}
