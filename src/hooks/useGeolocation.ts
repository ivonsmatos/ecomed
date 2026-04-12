"use client";

import { useState, useEffect } from "react";

interface Coords {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface UseGeolocationReturn {
  coords: Coords | null;
  loading: boolean;
  error: GeolocationPositionError | null;
}

export function useGeolocation(): UseGeolocationReturn {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<GeolocationPositionError | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      const timeoutId = window.setTimeout(() => {
        setLoading(false);
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }

    const watcher = navigator.geolocation.watchPosition(
      (pos) => {
        setCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 10_000 }
    );

    return () => navigator.geolocation.clearWatch(watcher);
  }, []);

  return { coords, loading, error };
}
