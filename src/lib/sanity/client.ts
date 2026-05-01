import { createClient } from "next-sanity";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;

// Se NEXT_PUBLIC_SANITY_PROJECT_ID não estiver definido (ex: build sem a variável),
// o cliente retorna null e as queries retornam dados vazios — o blog simplesmente
// não aparece, mas o build não quebra.
export const sanityClient = projectId
  ? createClient({
      projectId,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
      apiVersion: "2024-01-01",
      // CDN desabilitado: garante dados sempre frescos (sem cache de até 1h do Sanity CDN)
      useCdn: false,
      token: process.env.SANITY_API_TOKEN,
    })
  : null;
