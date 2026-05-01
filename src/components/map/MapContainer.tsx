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
  const { coords, loading: geoLoading } = useGeolocation();
  const [points, setPoints] = useState<MapPoint[]>(initialPoints);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Carrega todos os pontos aprovados ao montar o mapa
  useEffect(() => {
    const ctrl = new AbortController();

    fetch("/api/pontos/mapa", { signal: ctrl.signal })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: MapPoint[]) => setPoints(data))
      .catch(() => {
        // abortado ou erro de rede — ignorar
      });

    return () => ctrl.abort();
  }, []);

  const fetchNearby = useCallback(async (lat: number, lng: number) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch(
        `/api/pontos/proximos?lat=${lat}&lng=${lng}&raio=5000`,
        { signal: ctrl.signal }
      );
      if (!res.ok) return;
      const data: MapPoint[] = await res.json();
      // Mescla pontos próximos (com distância) mantendo demais pontos
      setPoints((prev) => {
        const ids = new Set(data.map((p) => p.id));
        const rest = prev.filter((p) => !ids.has(p.id));
        return [...data, ...rest];
      });
    } catch {
      // abortado — ignorar
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

      {geoLoading && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-background/90 px-4 py-2 text-sm shadow">
          Obtendo sua localização…
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
