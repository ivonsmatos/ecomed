"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Leaf, Loader2 } from "lucide-react";
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

export default function CadastrarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogle() {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/app" });
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      referralCode: searchParams.get("ref") ?? "",
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
        <Link href="/" className="mx-auto flex items-center gap-2 text-green-700">
          <Leaf className="size-6" />
          <span className="text-xl font-bold">EcoMed</span>
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
            className="w-full bg-green-700 hover:bg-green-800 text-white"
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
          <Link href="/entrar" className="font-medium text-green-700 hover:underline">
            Entrar
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
