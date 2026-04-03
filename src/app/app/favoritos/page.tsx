import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { EmptyState } from "@/components/shared/EmptyState";
import { Heart, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const metadata = { title: "Meus favoritos — EcoMed" };

export default async function FavoritosPage() {
  const session = await requireSession();

  const favoritos = await prisma.favorite.findMany({
    where: { userId: session.user!.id! },
    include: {
      point: {
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          state: true,
          status: true,
          residueTypes: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Heart className="h-6 w-6 text-red-500 fill-red-500" />
        Meus favoritos
      </h1>

      {favoritos.length === 0 ? (
      <EmptyState
          title="Nenhum favorito ainda"
          description="Salve pontos de coleta no mapa para acessá-los rapidamente aqui."
          action={
            <Link
              href="/mapa"
              className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
            >
              <MapPin className="h-4 w-4" />
              Explorar o mapa
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {favoritos.map(({ point, id }) => (
            <li
              key={id}
              className="rounded-xl border bg-card p-4 flex items-start justify-between gap-4 hover:shadow-sm transition-shadow"
            >
              <div className="space-y-1 min-w-0">
                <p className="font-semibold truncate">{point.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {point.address} — {point.city}/{point.state}
                </p>
                {point.residueTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {point.residueTypes.slice(0, 3).map((t: string) => (
                      <Badge key={t} variant="secondary" className="text-xs">
                        {t}
                      </Badge>
                    ))}
                    {point.residueTypes.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{point.residueTypes.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              <Link
                href={`/mapa?ponto=${point.id}`}
                className="shrink-0 text-sm text-green-600 hover:underline font-medium"
              >
                Ver no mapa
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
