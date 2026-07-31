"""
seed_ubs.py — Importa todas as UBS do Brasil via DATASUS/CNES
Requer: psycopg (v3), httpx
Uso dentro do container ecomed-ia:
    python3 /tmp/seed_ubs.py
"""

import argparse, json, os, sys, time, urllib.parse
import httpx
import psycopg
from psycopg.rows import dict_row

# ─── Config ──────────────────────────────────────────────────────────────────

DB_URL_RAW = os.environ.get("DATABASE_URL", "")
_p         = urllib.parse.urlparse(DB_URL_RAW)
DB_PARAMS  = dict(
    host=_p.hostname,
    port=_p.port or 5432,
    dbname=(_p.path or "/ecomed").lstrip("/"),
    user=urllib.parse.unquote(_p.username or ""),
    password=urllib.parse.unquote(_p.password or ""),
    sslmode="require",
)

DATASUS_EMAIL = "sistema-datasus@ecomed.eco.br"
CNPJ_MS       = "00394544000185"
TIPOS_UBS     = {1, 2, 5}   # 01=Posto de Saúde  02=UBS  05=PSF/Saúde da Família

UF_MAP = {
    11:"RO",12:"AC",13:"AM",14:"RR",15:"PA",16:"AP",17:"TO",
    21:"MA",22:"PI",23:"CE",24:"RN",25:"PB",26:"PE",27:"AL",28:"SE",29:"BA",
    31:"MG",32:"ES",33:"RJ",35:"SP",
    41:"PR",42:"SC",43:"RS",
    50:"MS",51:"MT",52:"GO",53:"DF",
}

# ─── Helpers ─────────────────────────────────────────────────────────────────

def cuid_like(prefix: str, n: int) -> str:
    """Gera um ID único simples suficiente para o seed (não precisa ser cuid real)."""
    import hashlib, time as t
    raw = f"{prefix}-{n}-{t.time_ns()}"
    return "c" + hashlib.md5(raw.encode()).hexdigest()[:23]


def fetch_municipios(client: httpx.Client) -> dict[int, str]:
    print("📍 Baixando municípios do IBGE...", flush=True)
    r = client.get(
        "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=id",
        timeout=30,
    )
    r.raise_for_status()
    mapa = {}
    for m in r.json():
        mapa[m["id"] // 10] = m["nome"]   # 7 dígitos → 6 dígitos CNES
    print(f"   {len(mapa)} municípios carregados.", flush=True)
    return mapa


def iter_cnes(client: httpx.Client, limit=20):
    """Gera lotes de estabelecimentos da API CNES com retry e back-off."""
    offset, pages_sem_ubs = 0, 0
    while True:
        url = f"https://apidadosabertos.saude.gov.br/cnes/estabelecimentos?limit={limit}&offset={offset}"
        data = None
        for attempt in range(1, 4):
            try:
                r = client.get(url, timeout=30)
                r.raise_for_status()
                data = r.json()
                break
            except Exception as exc:
                if attempt == 3:
                    raise
                time.sleep(attempt * 1.5)

        items = data.get("estabelecimentos") or []
        if not items:
            break

        yield items

        tem_ubs = any(i.get("codigo_tipo_unidade") in TIPOS_UBS for i in items)
        pages_sem_ubs = 0 if tem_ubs else pages_sem_ubs + 1
        if pages_sem_ubs > 100:
            print("\n   100 páginas sem UBS — interrompendo.", flush=True)
            break
        if len(items) < limit:
            break  # última página

        offset += limit
        time.sleep(0.15)

# ─── DB helpers ──────────────────────────────────────────────────────────────

def get_or_create_partner(conn) -> str:
    """Retorna o partnerId do parceiro DATASUS, criando se necessário."""
    with conn.cursor(row_factory=dict_row) as cur:
        # Usuário
        cur.execute('SELECT id FROM "User" WHERE email = %s', (DATASUS_EMAIL,))
        row = cur.fetchone()
        if row:
            user_id = row["id"]
        else:
            user_id = cuid_like("u", 0)
            cur.execute(
                '''INSERT INTO "User" (id, email, name, role, "emailVerified", "referralCode", "createdAt", "updatedAt")
                   VALUES (%s, %s, %s, %s, NOW(), %s, NOW(), NOW())''',
                (user_id, DATASUS_EMAIL, "DATASUS — Ministério da Saúde", "ADMIN", "ECOMED-DATASUS"),
            )
            print(f"   Usuário DATASUS criado: {user_id}", flush=True)

        # Parceiro
        cur.execute('SELECT id FROM "Partner" WHERE "userId" = %s', (user_id,))
        row = cur.fetchone()
        if row:
            partner_id = row["id"]
        else:
            partner_id = cuid_like("p", 0)
            cur.execute(
                '''INSERT INTO "Partner" (id, "userId", cnpj, "companyName", "tradeName", phone)
                   VALUES (%s, %s, %s, %s, %s, %s)''',
                (partner_id, user_id, CNPJ_MS,
                 "Ministério da Saúde — DATASUS",
                 "Rede Pública de Saúde (UBS)", "136"),
            )
            print(f"   Parceiro DATASUS criado: {partner_id}", flush=True)

    conn.commit()
    return partner_id


def delete_old_points(conn, partner_id: str) -> int:
    with conn.cursor() as cur:
        cur.execute('DELETE FROM "Point" WHERE "partnerId" = %s', (partner_id,))
        count = cur.rowcount
    conn.commit()
    return count


def insert_batch(conn, rows: list[dict]):
    if not rows:
        return
    with conn.cursor() as cur:
        cur.executemany(
            '''INSERT INTO "Point"
               (id, "partnerId", name, address, city, state, "zipCode",
                latitude, longitude, phone, email, status, "residueTypes",
                "createdAt", "updatedAt")
               VALUES
               (%(id)s, %(partnerId)s, %(name)s, %(address)s, %(city)s, %(state)s,
                %(zipCode)s, %(latitude)s, %(longitude)s, %(phone)s, %(email)s,
                %(status)s, %(residueTypes)s, NOW(), NOW())
               ON CONFLICT DO NOTHING''',
            rows,
        )
    conn.commit()

# ─── Main ────────────────────────────────────────────────────────────────────

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--limit", type=int)
    parser.add_argument("--city")
    parser.add_argument("--state")
    parser.add_argument("--min-records", type=int, default=100)
    return parser.parse_args()


def main():
    args = parse_args()
    if not DB_URL_RAW:
        sys.exit("❌ DATABASE_URL não definida")
    if args.limit is not None and args.limit <= 0:
        sys.exit("--limit deve ser maior que zero")
    if args.state and args.state.upper() not in set(UF_MAP.values()):
        sys.exit("--state deve ser uma UF brasileira válida")

    print("═" * 55)
    print("  EcoMed — Importação de UBS do DATASUS/CNES (Python)")
    print("═" * 55 + "\n")

    conn = psycopg.connect(**DB_PARAMS, row_factory=dict_row)

    print("1. Configurando parceiro DATASUS...")
    partner_id = get_or_create_partner(conn)
    print(f"   Parceiro: {partner_id}\n")

    with httpx.Client(
        headers={"Accept": "application/json", "User-Agent": "EcoMed/1.0"},
        follow_redirects=True,
    ) as client:
        municipios = fetch_municipios(client)
        print()

        print("3. Baixando e validando em staging (produção ainda não será alterada)...")
        with conn.cursor() as cur:
            cur.execute(
                'CREATE TEMP TABLE "PointImportStage" '
                '(LIKE "Point" INCLUDING DEFAULTS) ON COMMIT PRESERVE ROWS'
            )

        total_ins = total_ign = page = 0

        for batch in iter_cnes(client):
            page += 1
            rows = []

            for r in batch:
                tipo = r.get("codigo_tipo_unidade")
                if tipo not in TIPOS_UBS:
                    continue
                if r.get("codigo_motivo_desabilitacao_estabelecimento"):
                    total_ign += 1
                    continue

                lat = r.get("latitude_estabelecimento_decimo_grau") or 0
                lng = r.get("longitude_estabelecimento_decimo_grau") or 0
                if not lat or not lng or abs(lat) < 0.01 or abs(lng) < 0.01:
                    total_ign += 1
                    continue

                uf     = UF_MAP.get(r.get("codigo_uf") or 0, "BR")
                cidade = municipios.get(r.get("codigo_municipio") or 0, "Não informado")
                if args.state and uf != args.state.upper():
                    continue
                if args.city and cidade.casefold() != args.city.casefold():
                    continue
                nome   = ((r.get("nome_fantasia") or r.get("nome_razao_social") or "UBS").strip())[:255]

                logr   = ", ".join(filter(None, [
                    (r.get("endereco_estabelecimento") or "").strip(),
                    (r.get("numero_estabelecimento") or "").strip(),
                ]))
                end    = (" — ".join(filter(None, [logr, (r.get("bairro_estabelecimento") or "").strip()])))[:255] or "Endereço não informado"
                cep    = "".join(c for c in str(r.get("codigo_cep_estabelecimento") or "") if c.isdigit()).zfill(8)[:8] or "00000000"
                phone  = ((r.get("numero_telefone_estabelecimento") or "").strip() or None)
                if phone:
                    phone = phone[:20]
                email  = ((r.get("endereco_email_estabelecimento") or "").strip() or None)
                if email:
                    email = email[:100]

                rows.append({
                    "id":           cuid_like("pt", total_ins + len(rows)),
                    "partnerId":    partner_id,
                    "name":         nome,
                    "address":      end,
                    "city":         cidade,
                    "state":        uf,
                    "zipCode":      cep,
                    "latitude":     float(lat),
                    "longitude":    float(lng),
                    "phone":        phone,
                    "email":        email,
                    "status":       "APPROVED",
                    "residueTypes": ["medicamentos", "seringas"],
                })

            if args.limit is not None:
                rows = rows[: max(0, args.limit - total_ins)]
            if rows:
                with conn.cursor() as cur:
                    cur.executemany(
                        '''INSERT INTO "PointImportStage"
                           (id, "partnerId", name, address, city, state, "zipCode",
                            latitude, longitude, phone, email, status, "residueTypes",
                            "createdAt", "updatedAt")
                           VALUES
                           (%(id)s, %(partnerId)s, %(name)s, %(address)s, %(city)s, %(state)s,
                            %(zipCode)s, %(latitude)s, %(longitude)s, %(phone)s, %(email)s,
                            %(status)s, %(residueTypes)s, NOW(), NOW())''',
                        rows,
                    )
            total_ins += len(rows)

            if page % 10 == 0 or rows:
                print(f"\r   Página {page:4d} | Inseridas: {total_ins:6d} | Ignoradas: {total_ign:5d}", end="", flush=True)
            if args.limit is not None and total_ins >= args.limit:
                break

    minimum = min(args.min_records, args.limit) if args.limit else args.min_records
    if total_ins < minimum:
        conn.rollback()
        conn.close()
        sys.exit(f"Carga recusada: {total_ins} registros válidos; mínimo exigido: {minimum}")

    with conn.cursor() as cur:
        cur.execute(
            'SELECT COUNT(*) AS total, COUNT(DISTINCT (name, address, city, state)) AS unicos '
            'FROM "PointImportStage"'
        )
        quality = cur.fetchone()
    report = {
        "source": "DATASUS_CNES",
        "valid": total_ins,
        "rejected": total_ign,
        "unique": quality["unicos"],
        "dryRun": args.dry_run,
        "city": args.city,
        "state": args.state,
    }
    print("\n" + json.dumps(report, ensure_ascii=False))

    if args.dry_run:
        conn.rollback()
        conn.close()
        print("Dry-run concluído; produção não foi alterada.")
        return

    # A troca ocorre em uma única transação. Falha no DELETE ou INSERT restaura
    # automaticamente os pontos anteriores. Somente a fonte DATASUS é afetada.
    with conn.cursor() as cur:
        cur.execute('DELETE FROM "Point" WHERE "partnerId" = %s', (partner_id,))
        removidos = cur.rowcount
        cur.execute(
            '''INSERT INTO "Point"
               (id, "partnerId", name, address, city, state, "zipCode", latitude,
                longitude, phone, email, status, "residueTypes", "createdAt", "updatedAt")
               SELECT id, "partnerId", name, address, city, state, "zipCode", latitude,
                      longitude, phone, email, status, "residueTypes", "createdAt", "updatedAt"
               FROM "PointImportStage"'''
        )
    conn.commit()
    conn.close()

    print(f"\n\n{'═'*55}")
    print("✅ Concluído!")
    print(f"   UBS inseridas : {total_ins}")
    print(f"   UBS substituídas: {removidos}")
    print(f"   Ignoradas     : {total_ign}")
    print("═" * 55)


if __name__ == "__main__":
    main()
