"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useGeolocation } from "@/hooks/useGeolocation";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { PointDrawer } from "@/components/map/PointDrawer";
import type { MapPoint } from "@/components/map/types";

// Leaflet só funciona no client — importação dinâmica evita SSR
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  ),
});

interface MapContainerProps {
  initialPoints?: MapPoint[];
}

export function MapContainer({ initialPoints = [] }: MapContainerProps) {
  const { coords, loading: geoLoading, error: geoError } = useGeolocation();
  const [points, setPoints] = useState<MapPoint[]>(initialPoints);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchNearby = useCallback(async (lat: number, lng: number) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setNearbyLoading(true);

    try {
      const res = await fetch(
        `/api/pontos/proximos?lat=${lat}&lng=${lng}&raio=5000`,
        { signal: ctrl.signal }
      );
      if (!res.ok) return;
      const data: MapPoint[] = await res.json();
      setPoints(data);
    } catch {
      // abortado — ignorar
    } finally {
      setNearbyLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!coords) return;
    const timeoutId = window.setTimeout(() => {
      void fetchNearby(coords.latitude, coords.longitude);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [coords, fetchNearby]);

  function handlePinClick(point: MapPoint) {
    setSelectedPoint(point);
    setDrawerOpen(true);
  }

  const center: [number, number] = coords
    ? [coords.latitude, coords.longitude]
    : [-15.7801, -47.9292]; // Brasília como fallback

  const userZoom = coords ? 14 : 5;

  return (
    <div className="relative h-full w-full">
      <MapView
        center={center}
        zoom={userZoom}
        points={points}
        userLocation={coords ? [coords.latitude, coords.longitude] : undefined}
        onPinClick={handlePinClick}
      />

      {/* Estado: aguardando permissão de localização */}
      {geoLoading && points.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm z-1000">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-background px-8 py-6 shadow-lg text-center max-w-xs">
            <span className="text-3xl">📍</span>
            <p className="text-sm font-semibold text-foreground">Obtendo sua localização…</p>
            <p className="text-xs text-muted-foreground">Os pontos de coleta próximos aparecerão automaticamente.</p>
          </div>
        </div>
      )}

      {/* Estado: localização negada ou indisponível */}
      {geoError && points.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm z-1000">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-background px-8 py-6 shadow-lg text-center max-w-xs">
            <span className="text-3xl">🔒</span>
            <p className="text-sm font-semibold text-foreground">Localização não autorizada</p>
            <p className="text-xs text-muted-foreground">
              Ative a localização no seu navegador para ver os pontos de coleta mais próximos de você.
            </p>
          </div>
        </div>
      )}

      {/* Estado: carregando pontos próximos */}
      {nearbyLoading && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-background/90 px-4 py-2 text-sm shadow z-1000">
          Buscando pontos próximos…
        </div>
      )}

      {/* Estado: sem pontos no raio */}
      {!nearbyLoading && !geoLoading && coords && points.length === 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-background/90 px-4 py-2 text-sm shadow z-1000">
          Nenhum ponto encontrado em 5 km
        </div>
      )}

      <PointDrawer
        point={selectedPoint}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
