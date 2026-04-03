"use client";

import { useState } from "react";
import { Phone, MapPin, Clock, Heart, Flag } from "lucide-react";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDistance } from "@/lib/utils";
import type { MapPoint } from "./types";

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface PointDrawerProps {
  point: MapPoint | null;
  open: boolean;
  onClose: () => void;
}

export function PointDrawer({ point, open, onClose }: PointDrawerProps) {
  const [favorited, setFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  if (!point) return null;

  async function toggleFavorite() {
    if (!point) return;
    setFavLoading(true);
    try {
      const method = favorited ? "DELETE" : "POST";
      const res = await fetch("/api/favoritos", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pontoId: point.id }),
      });
      if (res.ok) {
        setFavorited((f) => !f);
        toast.success(favorited ? "Removido dos favoritos" : "Adicionado aos favoritos!");
      } else if (res.status === 401) {
        toast.error("Faça login para salvar favoritos.");
      }
    } finally {
      setFavLoading(false);
    }
  }

  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerContent>
        <DrawerHeader className="pb-0">
          <DrawerTitle className="text-left">{point.name}</DrawerTitle>
          <DrawerDescription className="text-left flex items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0" />
            {point.address}, {point.city} — {point.state}
          </DrawerDescription>
        </DrawerHeader>

        <div className="p-4 space-y-4">
          {/* Distância */}
          {point.distancia_metros != null && (
            <p className="text-sm text-muted-foreground">
              A {formatDistance(point.distancia_metros)} de você
            </p>
          )}

          {/* Tipos de resíduo */}
          <div className="flex flex-wrap gap-1.5">
            {point.residueTypes.map((type) => (
              <Badge key={type} variant="secondary" className="text-xs">
                {type}
              </Badge>
            ))}
          </div>

          <Separator />

          {/* Horários */}
          {point.schedules && point.schedules.length > 0 && (
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium">
                <Clock className="size-4" /> Horários
              </h4>
              <ul className="space-y-1">
                {point.schedules.map((s) => (
                  <li key={s.dayOfWeek} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{DIAS[s.dayOfWeek]}</span>
                    <span>
                      {s.closed ? (
                        <span className="text-red-500">Fechado</span>
                      ) : (
                        `${s.opens} – ${s.closes}`
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-2 pt-2">
            {point.phone && (
              <a href={`tel:${point.phone}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "flex-1")}>
                  <Phone className="mr-1.5 size-4" />
                  Ligar
                </a>
            )}
            <Button
              variant={favorited ? "default" : "outline"}
              size="sm"
              className={`flex-1 ${favorited ? "bg-red-100 text-red-700 hover:bg-red-200 border-red-200 dark:bg-red-950 dark:text-red-400" : ""}`}
              onClick={toggleFavorite}
              disabled={favLoading}
            >
              <Heart className={`mr-1.5 size-4 ${favorited ? "fill-current" : ""}`} />
              {favorited ? "Salvo" : "Salvar"}
            </Button>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${point.latitude},${point.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Abrir rota no Google Maps"
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "shrink-0")}
            >
              <MapPin className="size-4" />
            </a>
          </div>

          {/* Reportar */}
          <a
            href={`/mapa/ponto/${point.id}/reportar`}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-full text-muted-foreground text-xs")}
          >
            <Flag className="mr-1.5 size-3" />
            Reportar problema
          </a>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
