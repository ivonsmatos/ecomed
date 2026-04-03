import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { MapContainer } from "@/components/map/MapContainer";

export const metadata: Metadata = {
  title: "Mapa de pontos de coleta | EcoMed",
  description: "Encontre pontos de coleta de medicamentos vencidos perto de você.",
};

export default function MapaPage() {
  return (
    <div className="flex h-dvh flex-col">
      <Header />
      {/* O mapa ocupa todo o espaço restante */}
      <div className="flex-1 relative">
        <MapContainer />
      </div>
    </div>
  );
}
