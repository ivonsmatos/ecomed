import type { Metadata } from "next";
import { EmbedMap } from "@/components/map/EmbedMap";

// Widget embeddable do mapa — projetado para iframe de terceiros.
// Uso: <iframe src="https://ecomed.eco.br/embed/mapa?lat=-23.55&lng=-46.63&zoom=13" />
// Sem header, navegação, cookie banner ou VLibras; X-Frame-Options liberado
// para /embed/* no next.config.ts (frame-ancestors *).

export const metadata: Metadata = {
  title: "Mapa de Pontos de Coleta | EcoMed",
  robots: { index: false }, // página utilitária — não indexar
};

interface Props {
  searchParams: Promise<{ lat?: string; lng?: string; zoom?: string }>;
}

function parseNum(v: string | undefined, min: number, max: number): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || n > max) return undefined;
  return n;
}

export default async function EmbedMapaPage({ searchParams }: Props) {
  const params = await searchParams;
  const lat = parseNum(params.lat, -90, 90);
  const lng = parseNum(params.lng, -180, 180);
  const zoom = parseNum(params.zoom, 3, 18);

  return <EmbedMap lat={lat} lng={lng} zoom={zoom} />;
}
