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

  const fetchNearby = useCallback(
    async (lat: number, lng: number) => {
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
        setPoints(data);
      } catch {
        // abortado — ignorar
      }
    },
    []
  );

  useEffect(() => {
    if (coords) fetchNearby(coords.latitude, coords.longitude);
  }, [coords, fetchNearby]);

  function handlePinClick(point: MapPoint) {
    setSelectedPoint(point);
    setDrawerOpen(true);
  }

  const center: [number, number] = coords
    ? [coords.latitude, coords.longitude]
    : [-15.7801, -47.9292]; // Brasília como fallback

  return (
    <div className="relative h-full w-full">
      <MapView
        center={center}
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
