/**
 * Script para pré-cadastrar categorias no Sanity CMS.
 *
 * Como usar:
 *   cd app
 *   node scripts/seed-sanity-categories.mjs
 *
 * Requer as variáveis de ambiente:
 *   NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_API_TOKEN
 *
 * Configure em .env.local ou exporte no terminal antes de rodar.
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";

// Carrega variáveis do .env.local
config({ path: resolve(process.cwd(), ".env.local") });

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset   = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
const token     = process.env.SANITY_API_TOKEN;

if (!projectId || !token) {
  console.error("❌ Defina NEXT_PUBLIC_SANITY_PROJECT_ID e SANITY_API_TOKEN no .env.local");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2024-01-01",
  token,
  useCdn: false,
});

// ── Categorias pré-definidas (SEO/GEO otimizadas) ─────────────────────────────
const categories = [
  {
    title: "Descarte Correto",
    slug: "descarte-correto",
    description:
      "Como descartar medicamentos com segurança: pontos de coleta, embalagens e boas práticas.",
  },
  {
    title: "Legislação Ambiental",
    slug: "legislacao-ambiental",
    description:
      "Leis, decretos e normas sobre resíduos de serviços de saúde — CONAMA, ANVISA e PNRS.",
  },
  {
    title: "Saúde Ambiental",
    slug: "saude-ambiental",
    description:
      "Impacto dos medicamentos descartados incorretamente no meio ambiente e na saúde pública.",
  },
  {
    title: "Dicas Práticas",
    slug: "dicas-praticas",
    description:
      "Orientações do dia a dia para cidadãos e famílias sobre descarte responsável de medicamentos.",
  },
  {
    title: "EcoMed",
    slug: "ecomed",
    description:
      "Novidades, atualizações, parcerias e conteúdo institucional da plataforma EcoMed.",
  },
  {
    title: "Medicamentos e Saúde",
    slug: "medicamentos-saude",
    description:
      "Educação sobre uso correto, validade e armazenamento seguro de medicamentos.",
  },
  {
    title: "Sustentabilidade",
    slug: "sustentabilidade",
    description:
      "Práticas sustentáveis, economia circular e consciência ambiental no setor farmacêutico.",
  },
];

async function seedCategories() {
  console.log(`\n🌱 Seeding ${categories.length} categorias no projeto "${projectId}" (dataset: ${dataset})...\n`);

  for (const cat of categories) {
    // Verifica se já existe pelo slug
    const existing = await client.fetch(
      `*[_type == "category" && slug.current == $slug][0]._id`,
      { slug: cat.slug },
    );

    if (existing) {
      console.log(`⏭️  Já existe: ${cat.title}`);
      continue;
    }

    await client.create({
      _type: "category",
      title: cat.title,
      slug: { _type: "slug", current: cat.slug },
      description: cat.description,
    });

    console.log(`✅ Criada: ${cat.title}`);
  }

  console.log("\n🎉 Concluído!\n");
}

seedCategories().catch((err) => {
  console.error("❌ Erro:", err.message);
  process.exit(1);
});
