# Importação de Pontos de Coleta — EcoMed

> Documento técnico que descreve como os 58.804+ pontos de descarte de medicamentos foram inseridos no banco de dados do EcoMed.

---

## Visão Geral

O EcoMed mantém dois conjuntos de pontos de coleta:

| Origem      | Tipo                          | Quantidade | Status     | Script responsável   |
|-------------|-------------------------------|------------|------------|----------------------|
| **DATASUS** | Unidades Básicas de Saúde     | ~50.864    | `APPROVED` | `scripts/seed-ubs.ts`       |
| **LogMed**  | Farmácias de descarte         | 7.940      | `APPROVED` | `scripts/import_logmed.py`  |
| **Seeds**   | Pontos manuais de teste       | ~15        | `APPROVED` | `prisma/seed.ts`            |

---

## 1. DATASUS — Unidades Básicas de Saúde (UBS)

### 1.1 Fonte dos dados

A API pública do **CNES** (Cadastro Nacional de Estabelecimentos de Saúde) do Ministério da Saúde, mantida pelo DATASUS:

```
https://apidadosabertos.saude.gov.br/cnes/estabelecimentos
```

Parâmetros de filtro utilizados: `?codigo_tipo_unidade=XX`, onde `XX` é:

| Código | Tipo de unidade                     |
|--------|-------------------------------------|
| `01`   | Posto de Saúde                      |
| `02`   | Centro de Saúde / UBS               |
| `20`   | Pronto-Atendimento (UPA)            |
| `32`   | Unidade de Saúde da Família (ESF)   |

A API retorna no máximo 20 registros por página — a paginação é feita via `?offset=N`.

### 1.2 Fluxo de importação

```
API CNES (paginada, 20/req)
        ↓
  fetchCnesByTipo()           ← AsyncGenerator com back-off 3x
        ↓
  cnesToPoint()               ← conversão + validação
  • descarta desabilitados (codigo_motivo_desabilitacao ≠ null)
  • descarta sem coordenadas válidas (|lat| < 0.01 ou |lng| < 0.01)
        ↓
  prisma.point.createMany()   ← lotes automáticos do Prisma
        ↓
  PostgreSQL (tabela "Point")
```

### 1.3 Estrutura do registro inserido

```typescript
{
  partnerId: string,          // ID do parceiro "DATASUS"
  name: string,               // nome_fantasia ou nome_razao_social (max 255)
  address: string,            // logradouro + número + bairro (max 255)
  city: string,               // nome do município (via API IBGE)
  state: string,              // sigla UF (ex: "SP")
  zipCode: string,            // CEP sem traço, 8 dígitos
  latitude: number,           // latitude_estabelecimento_decimo_grau
  longitude: number,          // longitude_estabelecimento_decimo_grau
  status: "APPROVED",
  residueTypes: ["medicamentos", "seringas"],
}
```

### 1.4 Parceiro-sistema DATASUS

O script cria automaticamente (idempotente):

- **User:** `sistema-datasus@ecomed.eco.br` | role = `ADMIN`
- **Partner:** CNPJ `00394544000185` (CNPJ público do Ministério da Saúde)

Antes de importar, todos os pontos anteriores deste parceiro são removidos:
```typescript
await prisma.point.deleteMany({ where: { partnerId: partner.id } });
```

### 1.5 Como executar

```bash
# Pré-requisito: DATABASE_URL no .env
pnpm exec tsx scripts/seed-ubs.ts
```

Duração estimada: **~2–3 horas** (50 mil registros × paginação de 20/req + delays para não sobrecarregar a API pública).

---

## 2. LogMed — Farmácias de descarte de medicamentos

A importação LogMed é dividida em **3 scripts independentes** que devem ser executados em sequência.

### 2.1 Fonte dos dados

O site **[logmed.org.br](https://logmed.org.br/onde-descartar/pdf)** mantém um catálogo público de farmácias participantes do programa de logística reversa de medicamentos, regulamentado pela ANVISA (RDC 222/2018).

A URL `/onde-descartar/pdf` retorna um HTML de ~13 MB com uma tabela HTML completa contendo todos os pontos cadastrados.

---

### Etapa 1 — Scraping: `scripts/scrape_logmed.py`

#### O que faz

1. Baixa o HTML completo de `https://logmed.org.br/onde-descartar/pdf`
2. Parseia com `BeautifulSoup` todas as `<tr>` com exatamente 6 `<td>`s
3. Extrai: UF · Cidade · Nome · CNPJ · Endereço · CEP · Rede
4. Normaliza o campo "rede" via `normalizar_rede()`, consolidando variantes em 8 redes principais
5. Salva `prisma/logmed_pontos.json` com `latitude: 0.0, longitude: 0.0` (preenchido na etapa 2)

#### Estrutura da tabela HTML

| Coluna | Conteúdo                                      |
|--------|-----------------------------------------------|
| `td[0]` | UF (2 chars)                                 |
| `td[1]` | Cidade                                       |
| `td[2]` | `div.font-semibold` = Nome; segundo div = CNPJ formatado |
| `td[3]` | Endereço                                     |
| `td[4]` | CEP                                          |
| `td[5]` | Rede/associação                              |

#### Normalização de redes

```python
REDES_CONHECIDAS_PALAVRAS = ("FARMA", "DROGA", "REDE", "SINCO", "ABRA", "FEBRA", "ABC")
```

Nomes que não contêm estas palavras (ex.: nomes de pessoas como responsável técnico) são reclassificados como `"INDEPENDENTE"`. Redes explicitamente marcadas como "NÃO POSSUI" também viram `"INDEPENDENTE"`.

Redes resultantes (8 grupos):

| Rede             | Descrição                                    |
|------------------|----------------------------------------------|
| `ABRAFARMA`      | Associação Brasileira de Redes de Farmácias  |
| `FEBRAFAR`       | Federação Brasileira das Redes Associativistas |
| `ABC`            | Rede ABC de Farmácias                        |
| `ABCFARMA`       | Associação Brasileira do Comércio Farmacêutico |
| `REDEFARMA`      | RedefarmaS                                   |
| `SINCOFARMA`     | Sindicatos regionais de farmácias            |
| `ABCDEFARMA`     | Rede regional                                |
| `INDEPENDENTE`   | Farmácias sem rede ou rede não identificada  |

#### Como executar

```bash
# Sem geocodificação (recomendado — usar script dedicado na etapa 2)
python scripts/scrape_logmed.py --skip-geo

# Com geocodificação via Nominatim (lento, ~15 min, 1 req/s)
python scripts/scrape_logmed.py
```

---

### Etapa 2 — Geocodificação: `scripts/geocode_logmed.py`

#### O que faz

Lê `prisma/logmed_pontos.json` e preenche `latitude`/`longitude` de cada ponto usando um **dataset CSV local** em vez de chamar APIs externas.

#### Fonte de coordenadas

Dataset público [kelvins/municipios-brasileiros](https://github.com/kelvins/municipios-brasileiros):

```
prisma/municipios_br.csv
```

- **5.571 municípios** brasileiros com latitude/longitude do centroide
- Geocodificação é **instantânea** — sem requisições de rede, sem delay, sem custo
- Cobertura: **100%** (todos os 7.940 pontos LogMed foram geocodificados)

#### Estratégia

A geocodificação é feita por **centroide de município** — todos os pontos de uma mesma cidade recebem as mesmas coordenadas. Isso é suficiente para o mapa de overview; a busca detalhada usa a geolocalização do usuário.

```python
# Normaliza nome: remove acentos, maiúsculas, espaços extras
chave = (normalizar(cidade), uf)
lat, lon = municipios[chave]
```

#### Overrides manuais

7 cidades precisaram de tratamento especial por variações de grafia histórica ou erros no cadastro:

```python
OVERRIDES = {
    ("DIAS D`AVILA", "BA"): (-12.6077, -38.2977),   # apóstrofo diferente
    ("MOJI MIRIM", "SP"):   (-22.4328, -46.9578),   # grafia antiga (Mogi)
    ("PARATI", "RJ"):       (-23.2197, -44.7149),   # nome antigo (Paraty)
    ("SANTA BARBARA D`OESTE", "SP"): (-22.7539, -47.4139),
    ("SANTANA DO LIVRAMENTO", "RS"): (-30.8906, -55.5322),
    ("BERNARDINO DE CAMPOS", "MG"): (-23.0119, -49.4708),  # UF errada no cadastro
    ("TAUBATE", "MG"):      (-23.0266, -45.5556),   # UF errada no cadastro
}
```

#### Como executar

```bash
python scripts/geocode_logmed.py
```

---

### Etapa 3 — Importação: `scripts/import_logmed.py`

#### O que faz

1. Lê `prisma/logmed_pontos.json` (já geocodificado)
2. Para cada rede, cria um **User** + **Partner** no banco (idempotente por CNPJ)
3. Remove pontos parciais de execuções anteriores
4. Faz **bulk insert** de todos os 7.940 pontos em lotes de 500

#### IDs determinísticos

Cada ponto recebe um ID fixo no formato `logmed-NNNNNN`:

```
logmed-000000, logmed-000001, ..., logmed-007939
```

Isso garante idempotência via `ON CONFLICT (id) DO NOTHING` — re-executar o script não cria duplicatas.

#### Parceiros criados (8)

| Email                              | Rede             |
|------------------------------------|------------------|
| `rede.abrafarma@ecomed.eco.br`     | ABRAFARMA        |
| `rede.febrafar@ecomed.eco.br`      | FEBRAFAR         |
| `rede.abc@ecomed.eco.br`           | ABC              |
| `rede.abcfarma@ecomed.eco.br`      | ABCFARMA         |
| `rede.redefarma@ecomed.eco.br`     | REDEFARMA        |
| `rede.sincofarma@ecomed.eco.br`    | SINCOFARMA       |
| `rede.abcdefarma@ecomed.eco.br`    | ABCDEFARMA       |
| `rede.independente@ecomed.eco.br`  | INDEPENDENTE     |

#### Bulk insert via psycopg2

```python
execute_values(
    cur,
    """
    INSERT INTO "Point" (
        id, "partnerId", name, address, city, state, "zipCode",
        latitude, longitude, status, "residueTypes", "createdAt", "updatedAt"
    ) VALUES %s
    ON CONFLICT (id) DO NOTHING
    """,
    data,
    template="(%s, %s, %s, %s, %s, %s, %s, %s, %s, 'APPROVED', ARRAY['medicamento'], NOW(), NOW())",
    page_size=500,
)
```

Tempo de execução: **~3 segundos** para 7.940 pontos.

#### Como executar

```bash
# Pré-requisito: seed-logmed.ts rodado ao menos uma vez
pnpm exec tsx prisma/seed-logmed.ts   # cria usuário sistema seed@ecomed.eco.br

# Importação (usa DATABASE_URL do .env)
DATABASE_URL="postgresql://..." python scripts/import_logmed.py

# Teste sem alterar o banco
DATABASE_URL="postgresql://..." python scripts/import_logmed.py --dry-run
```

---

## 3. Fluxo completo LogMed (ordem de execução)

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Preparação do banco                                         │
│     pnpm exec tsx prisma/seed-logmed.ts                         │
│     → cria User: seed@ecomed.eco.br                             │
└──────────────────────────┬──────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│  2. Scraping do site LogMed                                     │
│     python scripts/scrape_logmed.py --skip-geo                  │
│     → prisma/logmed_pontos.json (lat=0, lng=0)                  │
└──────────────────────────┬──────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│  3. Geocodificação local (sem API)                              │
│     python scripts/geocode_logmed.py                            │
│     → prisma/logmed_pontos.json (lat/lng preenchidos, 100%)     │
└──────────────────────────┬──────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│  4. Importação para o banco                                     │
│     DATABASE_URL=... python scripts/import_logmed.py            │
│     → 8 Partners criados, 7.940 Points inseridos                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Estado do banco após importação completa

```
Tabela "Point" — status = APPROVED
─────────────────────────────────────────────
 DATASUS (UBS)     ~50.864  pontos
 LogMed (farmácias)  7.940  pontos
 Seeds manuais         ~15  pontos
─────────────────────────────────────────────
 TOTAL              ~58.819  pontos
```

```
Tabela "Partner"
─────────────────────────────────────────────
 DATASUS                           1 parceiro
 LogMed (8 redes)                  8 parceiros
 Outros (seeds manuais)            ~3 parceiros
─────────────────────────────────────────────
 TOTAL                            ~12 parceiros
```

---

## 5. Como o mapa usa esses dados

O endpoint `/api/pontos/mapa` usa `DISTINCT ON (city, state)` para retornar **um ponto representativo por cidade** (~780 pontos) em vez de todos os 58 mil, evitando travar o Leaflet:

```sql
SELECT DISTINCT ON (city, state)
  id, name, address, city, state, latitude, longitude,
  phone, "photoUrl", "residueTypes"
FROM "Point"
WHERE status = 'APPROVED'
ORDER BY city, state, "createdAt" DESC
```

Quando o usuário ativa a geolocalização, o endpoint `/api/pontos/proximos` retorna até **30 pontos próximos** dentro de um bounding box calculado em tempo real.

---

## 6. Arquivos relevantes

| Arquivo                          | Descrição                                      |
|----------------------------------|------------------------------------------------|
| `scripts/seed-ubs.ts`            | Importação DATASUS via API CNES                |
| `scripts/scrape_logmed.py`       | Scraping HTML do site LogMed                   |
| `scripts/geocode_logmed.py`      | Geocodificação via dataset IBGE local          |
| `scripts/import_logmed.py`       | Bulk insert no PostgreSQL                      |
| `prisma/municipios_br.csv`       | Dataset IBGE: 5.571 municípios com lat/lng     |
| `prisma/seed-logmed.ts`          | Cria usuário sistema `seed@ecomed.eco.br`      |
| `prisma/schema.prisma`           | Modelos `Point`, `Partner`, `User`             |
| `src/app/api/[[...route]]/routes/pontos.ts` | Endpoints do mapa (DISTINCT ON)   |

> **Nota:** `prisma/logmed_pontos.json` é um arquivo gerado e não deve ser versionado. Está incluído no `.gitignore`.
