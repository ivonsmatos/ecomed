"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import type { MapPoint } from "@/components/map/types";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  ),
});

interface EmbedMapProps {
  lat?: number;
  lng?: number;
  zoom?: number;
}

export function EmbedMap({ lat, lng, zoom }: EmbedMapProps) {
  const [points, setPoints] = useState<MapPoint[]>([]);

  const hasCoords = lat !== undefined && lng !== undefined;
  const center: [number, number] = hasCoords ? [lat, lng] : [-15.7801, -47.9292];
  const mapZoom = zoom ?? (hasCoords ? 13 : 5);

  useEffect(() => {
    const ctrl = new AbortController();
    const url = hasCoords
      ? `/api/pontos/proximos?lat=${lat}&lng=${lng}&raio=15000`
      : "/api/pontos/mapa";
    fetch(url, { signal: ctrl.signal })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: MapPoint[]) => setPoints(data))
      .catch(() => {});
    return () => ctrl.abort();
  }, [hasCoords, lat, lng]);

  return (
    <div className="relative h-dvh w-full">
      <MapView
        center={center}
        zoom={mapZoom}
        points={points}
        onPinClick={(p) => {
          window.open(`https://ecomed.eco.br/mapa/ponto/${p.id}`, "_blank", "noopener");
        }}
      />
      {/* Atribuição obrigatória do widget */}
      <a
        href="https://ecomed.eco.br/mapa?utm_source=embed"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-2 left-2 z-1000 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-800 shadow ring-1 ring-gray-200 hover:bg-white"
      >
        🌿 Dados: <span className="text-eco-green">EcoMed</span> + LogMed/Sindusfarma
      </a>
    </div>
  );
}
