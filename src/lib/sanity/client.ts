import { createClient } from "next-sanity";

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2024-01-01",
  // CDN desabilitado: garante dados sempre frescos (sem cache de até 1h do Sanity CDN)
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});
