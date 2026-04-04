import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EcoMed — Seu remédio tem destino certo.",
    short_name: "EcoMed",
    description: "Encontre pontos de coleta de medicamentos vencidos perto de você.",
    start_url: "/mapa",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#16a34a",
    orientation: "portrait",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    screenshots: [],
    shortcuts: [
      {
        name: "Mapa de pontos",
        short_name: "Mapa",
        description: "Abrir o mapa de pontos de coleta",
        url: "/mapa",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
