import { WifiOff } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Sem conexão | EcoMed",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 text-center">
      <WifiOff className="size-14 text-muted-foreground" strokeWidth={1.5} />

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Você está offline</h1>
        <p className="text-muted-foreground max-w-xs">
          Não foi possível carregar esta página. Verifique sua conexão com a internet e tente
          novamente.
        </p>
      </div>

      <Link href="/" className={cn(buttonVariants({ variant: "default" }))}>
        Tentar novamente
      </Link>
    </div>
  );
}
