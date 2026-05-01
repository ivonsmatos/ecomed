/**
 * seed-ubs.ts — Importa todas as UBS do Brasil via DATASUS/CNES
 *
 * Uso:
 *   pnpm exec tsx scripts/seed-ubs.ts
 *
 * O que faz:
 *   1. Cria um parceiro-sistema "DATASUS" (User + Partner) se não existir
 *   2. Baixa o catálogo de municípios do IBGE (para nomes de cidades)
 *   3. Consulta a API do CNES filtrando diretamente por tipo de unidade
 *      (tipos 01 = Posto de Saúde, 02 = Centro de Saúde/UBS, 05 = PSF)
 *      usando o parâmetro ?codigo_tipo_unidade=XX — muito mais eficiente
 *      do que baixar todos os estabelecimentos e filtrar localmente.
 *   4. Pula registros sem coordenadas válidas ou desabilitados
 *   5. Apaga os pontos anteriores do parceiro DATASUS e insere os novos
 */

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false }, // AWS RDS requer SSL; cert não validado (necessário em produção e dev)
});
const prisma = new PrismaClient({ adapter, log: ["error"] });

// A API limita a 20 registros por página independente do valor de limit
const PAGE_SIZE = 20;

// ─── Mapeamento UF code (IBGE) → sigla ───────────────────────────────────────
const UF_MAP: Record<number, string> = {
  11: "RO", 12: "AC", 13: "AM", 14: "RR", 15: "PA", 16: "AP", 17: "TO",
  21: "MA", 22: "PI", 23: "CE", 24: "RN", 25: "PB", 26: "PE", 27: "AL",
  28: "SE", 29: "BA",
  31: "MG", 32: "ES", 33: "RJ", 35: "SP",
  41: "PR", 42: "SC", 43: "RS",
  50: "MS", 51: "MT", 52: "GO", 53: "DF",
};

// Tipos CNES consultados separadamente via filtro na API
const TIPOS_UBS = [1, 2, 5] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { "Accept": "application/json", "User-Agent": "EcoMed/1.0" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  return res.json();
}

/** Retorna mapa codigoMunicipio6Digitos → nomeDoMunicipio */
async function buildMunicipioMap(): Promise<Map<number, string>> {
  console.log("📍 Baixando municípios do IBGE...");
  const data = (await fetchJson(
    "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=id",
  )) as Array<{ id: number; nome: string }>;
  const map = new Map<number, string>();
  for (const m of data) {
    // CNES usa 6 dígitos; IBGE usa 7. Os primeiros 6 coincidem.
    map.set(Math.floor(m.id / 10), m.nome);
  }
  console.log(`   ${map.size} municípios carregados.`);
  return map;
}

interface CnesRecord {
  codigo_cnes: number;
  nome_razao_social?: string;
  nome_fantasia?: string;
  codigo_tipo_unidade?: number;
  endereco_estabelecimento?: string;
  numero_estabelecimento?: string;
  bairro_estabelecimento?: string;
  codigo_cep_estabelecimento?: string;
  numero_telefone_estabelecimento?: string;
  endereco_email_estabelecimento?: string;
  latitude_estabelecimento_decimo_grau?: number | null;
  longitude_estabelecimento_decimo_grau?: number | null;
  codigo_uf?: number;
  codigo_municipio?: number;
  codigo_motivo_desabilitacao_estabelecimento?: unknown;
}

/**
 * Pagina a API do CNES filtrando por tipo de unidade.
 * A API aceita ?codigo_tipo_unidade=XX e limita a 20 registros por página.
 */
async function* fetchCnesByTipo(tipo: number): AsyncGenerator<CnesRecord[]> {
  let offset = 0;
  let emptyPages = 0;

  while (true) {
    const url =
      `https://apidadosabertos.saude.gov.br/cnes/estabelecimentos` +
      `?limit=${PAGE_SIZE}&offset=${offset}&codigo_tipo_unidade=${String(tipo).padStart(2, "0")}`;

    let data: { estabelecimentos?: CnesRecord[] } | null = null;

    // 3 tentativas com back-off exponencial
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        data = (await fetchJson(url)) as { estabelecimentos?: CnesRecord[] };
        break;
      } catch (err) {
        if (attempt === 3) throw err;
        await sleep(1500 * attempt);
      }
    }

    const items = data?.estabelecimentos ?? [];

    if (items.length === 0) {
      emptyPages++;
      if (emptyPages >= 3) break; // 3 páginas vazias consecutivas = fim
      await sleep(500);
      offset += PAGE_SIZE;
      continue;
    }

    emptyPages = 0;
    yield items;

    if (items.length < PAGE_SIZE) break; // última página

    offset += PAGE_SIZE;
    await sleep(200); // gentil com a API
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Parceiro-sistema "DATASUS" ───────────────────────────────────────────────

async function getOrCreateDatasusPartner() {
  const DATASUS_EMAIL = "sistema-datasus@ecomed.eco.br";

  let user = await prisma.user.findUnique({ where: { email: DATASUS_EMAIL } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: DATASUS_EMAIL,
        name: "DATASUS — Ministério da Saúde",
        role: "ADMIN",
        emailVerified: new Date(),
      },
    });
    console.log("   Usuário DATASUS criado:", user!.id);
  }

  let partner = await prisma.partner.findFirst({ where: { userId: user!.id } });

  if (!partner) {
    partner = await prisma.partner.create({
      data: {
        userId: user!.id,
        cnpj: "00394544000185", // CNPJ público do Ministério da Saúde
        companyName: "Ministério da Saúde — DATASUS",
        tradeName: "Rede Pública de Saúde (UBS)",
        phone: "136",
      },
    });
    console.log("   Parceiro DATASUS criado:", partner.id);
  }

  return partner;
}

// ─── Converte registro CNES → objeto Point ────────────────────────────────────

function cnesToPoint(
  r: CnesRecord,
  partnerId: string,
  municipios: Map<number, string>,
) {
  if (r.codigo_motivo_desabilitacao_estabelecimento) return null;

  const lat = r.latitude_estabelecimento_decimo_grau ?? 0;
  const lng = r.longitude_estabelecimento_decimo_grau ?? 0;

  if (!lat || !lng || Math.abs(lat) < 0.01 || Math.abs(lng) < 0.01) return null;

  const uf = UF_MAP[r.codigo_uf ?? 0] ?? "BR";
  const cidade = municipios.get(r.codigo_municipio ?? 0) ?? "Não informado";
  const nome = (r.nome_fantasia?.trim() || r.nome_razao_social?.trim() || "UBS").slice(0, 255);

  const logradouro = [r.endereco_estabelecimento?.trim(), r.numero_estabelecimento?.trim()]
    .filter(Boolean)
    .join(", ");
  const endereco = [logradouro, r.bairro_estabelecimento?.trim()]
    .filter(Boolean)
    .join(" — ")
    .slice(0, 255) || "Endereço não informado";

  const cep = (r.codigo_cep_estabelecimento ?? "")
    .replace(/\D/g, "").padStart(8, "0").slice(0, 8);

  return {
    partnerId,
    name: nome,
    address: endereco,
    city: cidade,
    state: uf,
    zipCode: cep || "00000000",
    latitude: lat,
    longitude: lng,
    phone: r.numero_telefone_estabelecimento?.trim().slice(0, 20) || null,
    email: r.endereco_email_estabelecimento?.trim().slice(0, 100) || null,
    status: "APPROVED" as const,
    residueTypes: ["medicamentos", "seringas"],
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  EcoMed — Importação de UBS do DATASUS/CNES");
  console.log("═══════════════════════════════════════════════════════\n");

  // 1. Parceiro
  console.log("1. Configurando parceiro DATASUS...");
  const partner = await getOrCreateDatasusPartner();
  console.log(`   Parceiro: ${partner.id}\n`);

  // 2. Municípios
  const municipios = await buildMunicipioMap();
  console.log();

  // 3. Limpa pontos anteriores
  console.log("3. Removendo pontos anteriores do DATASUS...");
  const { count: removidos } = await prisma.point.deleteMany({
    where: { partnerId: partner.id },
  });
  console.log(`   ${removidos} pontos removidos.\n`);

  // 4. Busca por tipo e insere em lotes
  console.log("4. Importando da API CNES por tipo de unidade...");
  console.log("   (tipos: 01=Posto de Saúde, 02=Centro de Saúde/UBS, 05=PSF)\n");

  let totalInserido = 0;
  let totalIgnorado = 0;

  for (const tipo of TIPOS_UBS) {
    console.log(`\n▶ Tipo ${String(tipo).padStart(2, "0")}...`);
    let pageTipo = 0;
    let inseridoTipo = 0;

    for await (const batch of fetchCnesByTipo(tipo)) {
      pageTipo++;
      const toInsert = batch
        .map((r) => cnesToPoint(r, partner.id, municipios))
        .filter((p): p is NonNullable<typeof p> => p !== null);

      totalIgnorado += batch.length - toInsert.length;

      if (toInsert.length > 0) {
        await prisma.point.createMany({ data: toInsert, skipDuplicates: true });
        totalInserido += toInsert.length;
        inseridoTipo += toInsert.length;
      }

      process.stdout.write(
        `\r   Página ${pageTipo} | Inseridas este tipo: ${inseridoTipo} | Total: ${totalInserido}   `,
      );
    }

    console.log(`\n   Tipo ${String(tipo).padStart(2, "0")} concluído: ${inseridoTipo} UBS inseridas.`);
  }

  console.log(`\n\n═══════════════════════════════════════════════════════`);
  console.log(`✅ Concluído!`);
  console.log(`   UBS inseridas : ${totalInserido}`);
  console.log(`   Ignoradas     : ${totalIgnorado} (sem coord. ou desabilitadas)`);
  console.log(`═══════════════════════════════════════════════════════`);
}

main()
  .catch((err) => {
    console.error("\n❌ Erro:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
