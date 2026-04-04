"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { partnerRegistrationSchema, type PartnerRegistrationInput } from "@/lib/schemas/partner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export function PartnerRegistrationForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PartnerRegistrationInput>({
    resolver: zodResolver(partnerRegistrationSchema),
  });

  async function onSubmit(data: PartnerRegistrationInput) {
    setLoading(true);
    try {
      const res = await fetch("/api/parceiro/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? "Erro ao enviar solicitação.");
        return;
      }

      toast.success("Solicitação enviada! Nossa equipe irá analisar em até 48 horas úteis.");
      router.push("/app");
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="cnpj">CNPJ *</Label>
        <Input
          id="cnpj"
          placeholder="00000000000000"
          maxLength={14}
          {...register("cnpj")}
          aria-invalid={!!errors.cnpj}
        />
        {errors.cnpj && (
          <p className="text-sm text-destructive">{errors.cnpj.message}</p>
        )}
        <p className="text-xs text-muted-foreground">Somente números, sem pontos ou traços.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="companyName">Razão Social *</Label>
        <Input
          id="companyName"
          placeholder="Nome Empresarial Ltda"
          {...register("companyName")}
          aria-invalid={!!errors.companyName}
        />
        {errors.companyName && (
          <p className="text-sm text-destructive">{errors.companyName.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tradeName">Nome Fantasia</Label>
        <Input
          id="tradeName"
          placeholder="Nome da farmácia ou UBS"
          {...register("tradeName")}
          aria-invalid={!!errors.tradeName}
        />
        {errors.tradeName && (
          <p className="text-sm text-destructive">{errors.tradeName.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Telefone de Contato</Label>
        <Input
          id="phone"
          placeholder="11999999999"
          maxLength={11}
          {...register("phone")}
          aria-invalid={!!errors.phone}
        />
        {errors.phone && (
          <p className="text-sm text-destructive">{errors.phone.message}</p>
        )}
        <p className="text-xs text-muted-foreground">Somente números, com DDD.</p>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Enviando...
          </>
        ) : (
          "Enviar solicitação"
        )}
      </Button>
    </form>
  );
}
