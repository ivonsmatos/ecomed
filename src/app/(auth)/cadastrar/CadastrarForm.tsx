"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { registerSchema } from "@/lib/schemas/user";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type FormData = z.infer<typeof registerSchema>;

function setShortLivedCookie(name: string, value: string, secure = false) {
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=600;SameSite=Lax${secure ? ";Secure" : ""}`;
}

export function CadastrarForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogle() {
    if (!getValues("adultConfirmed")) {
      toast.error("Confirme que você tem 18 anos ou mais.");
      return;
    }
    setGoogleLoading(true);
    setShortLivedCookie("ecomed_adult_confirmed", "1", window.location.protocol === "https:");
    // Salva o código de indicação em cookie antes do redirect OAuth
    const ref = searchParams.get("ref");
    if (ref) {
      setShortLivedCookie("ecomed_ref", ref);
    }
    await signIn("google", { callbackUrl: "/app" });
  }

  const {
    register,
    getValues,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      referralCode: searchParams.get("ref") ?? "",
      adultConfirmed: false,
    },
  });

  async function onSubmit(data: FormData) {
    const payload = { ...data, referralCode: data.referralCode || undefined };
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      toast.error(json.error ?? "Erro ao criar conta.");
      return;
    }

    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    toast.success("Conta criada! Bem-vindo(a) ao EcoMed.");
    router.push("/app");
  }

  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <Link href="/" className="mx-auto flex items-center">
          <Image src="/logo.svg" alt="EcoMed" width={110} height={27} className="h-7 w-auto" />
        </Link>
        <CardTitle className="text-2xl">Criar conta</CardTitle>
        <CardDescription>Comece a usar o EcoMed gratuitamente</CardDescription>
      </CardHeader>

      <CardContent>
        {/* Google OAuth */}
        <Button
          variant="outline"
          className="w-full mb-4"
          onClick={handleGoogle}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src="/google.svg" alt="" className="mr-2 size-4" aria-hidden />
          )}
          Continuar com Google
        </Button>

        <div className="flex items-center gap-3 mb-4">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">ou crie uma conta</span>
          <Separator className="flex-1" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome completo</Label>
            <Input id="name" autoComplete="name" placeholder="Seu nome" {...register("name")} />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1 size-4"
                {...register("adultConfirmed")}
              />
              <span>
                Confirmo que tenho 18 anos ou mais e aceito os{" "}
                <Link href="/termos" className="underline">Termos de Uso</Link>.
              </span>
            </label>
            {errors.adultConfirmed && (
              <p className="text-xs text-red-600">{errors.adultConfirmed.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="voce@exemplo.com"
              {...register("email")}
            />
            {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="referralCode">
              Código de indicação{" "}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              id="referralCode"
              placeholder="Deixe em branco se não tiver"
              autoComplete="off"
              {...register("referralCode")}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-eco-green hover:bg-eco-green/90 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Criar conta
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/entrar" className="font-medium text-eco-teal-dark hover:underline">
            Entrar
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
