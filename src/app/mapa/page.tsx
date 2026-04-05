import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { SideNav } from "@/components/layout/SideNav";
import { BottomNav } from "@/components/layout/BottomNav";
import { MapContainer } from "@/components/map/MapContainer";

export const metadata: Metadata = {
  title: "Mapa de pontos de coleta | EcoMed",
  description: "Encontre pontos de coleta de medicamentos vencidos perto de você.",
  alternates: { canonical: "https://ecomed.eco.br/mapa" },
};

export default function MapaPage() {
  return (
    <div className="flex h-dvh flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <SideNav />
        <div className="relative flex-1">
          <MapContainer />
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
