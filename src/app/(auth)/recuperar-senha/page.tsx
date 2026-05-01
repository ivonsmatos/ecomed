"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
});

type FormData = z.infer<typeof schema>;

export default function RecuperarSenhaPage() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    await fetch("/api/auth/recuperar-senha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.email }),
    });
    // Always show success to avoid email enumeration
    setSent(true);
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center space-y-2">
        <div className="flex justify-center">
          <Image src="/favicon.svg" alt="EcoMed" width={56} height={46} className="h-11 w-auto" />
        </div>
        <CardTitle className="text-2xl">Recuperar senha</CardTitle>
        <CardDescription>
          {sent
            ? "Verifique seu e-mail"
            : "Digite seu e-mail para receber um link de redefinição de senha"}
        </CardDescription>
      </CardHeader>

      {sent ? (
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Se um cadastro com esse e-mail existir, você receberá um link para redefinir sua
            senha em breve. Verifique também a caixa de spam.
          </p>
          <Link
            href="/entrar"
            className="inline-flex items-center justify-center w-full rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            Voltar ao login
          </Link>
        </CardContent>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar link de recuperação
            </Button>
            <Link
              href="/entrar"
              className="text-sm text-muted-foreground hover:underline text-center"
            >
              Voltar ao login
            </Link>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
