"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapPoint } from "./types";

// Fix do ícone padrão do Leaflet (problema com webpack)
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const pinIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const greenIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 41" width="25" height="41">
        <path fill="#24A645" stroke="#fff" stroke-width="1.5" d="M12 0C5.4 0 0 5.4 0 12c0 7.2 12 29 12 29S24 19.2 24 12C24 5.4 18.6 0 12 0z"/>
        <circle cx="12" cy="12" r="5" fill="#fff"/>
      </svg>`
    ),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function FlyToCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom(), { duration: 1 });
  }, [map, center]);
  return null;
}

interface MapViewProps {
  center: [number, number];
  points: MapPoint[];
  userLocation?: [number, number];
  onPinClick: (point: MapPoint) => void;
}

export default function MapView({ center, points, userLocation, onPinClick }: MapViewProps) {
  return (
    <MapContainer
      center={center}
      zoom={14}
      className="h-full w-full z-0"
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
        maxZoom={19}
      />

      <FlyToCenter center={center} />

      {userLocation && (
        <>
          <Marker position={userLocation} icon={greenIcon}>
            <Popup>Você está aqui</Popup>
          </Marker>
          <Circle
            center={userLocation}
            radius={5000}
            color="#24A645"
            fillColor="#24A645"
            fillOpacity={0.05}
            weight={1}
          />
        </>
      )}

      {points.map((point) => (
        <Marker
          key={point.id}
          position={[point.latitude, point.longitude]}
          icon={pinIcon}
          eventHandlers={{ click: () => onPinClick(point) }}
        >
          <Popup>
            <strong>{point.name}</strong>
            <br />
            {point.address}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
