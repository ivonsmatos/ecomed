#!/usr/bin/env python3
"""
Importa os pontos de descarte do arquivo prisma/logmed_pontos.json
para o banco PostgreSQL do EcoMed.

Pré-requisitos:
    - prisma/logmed_pontos.json gerado pelo scrape_logmed.py
    - Variável de ambiente DATABASE_URL configurada

Uso:
    DATABASE_URL="postgresql://..." python scripts/import_logmed.py
    DATABASE_URL="postgresql://..." python scripts/import_logmed.py --dry-run

O script cria:
    - 1 User (role=PARTNER) por rede, com email gerado automaticamente
    - 1 Partner por rede (cnpj = CNPJ do primeiro ponto da rede)
    - 1 Point por linha do JSON (status=APPROVED)

Se o Partner (cnpj) ou User (email) já existir, o script pula e usa o existente.
"""

import json
import os
import re
import sys
import unicodedata
from pathlib import Path

import psycopg2
from psycopg2.extras import execute_values

INPUT = Path(__file__).parent.parent / "prisma" / "logmed_pontos.json"

# Usuário "sistema" para pontos do LogMed (criado em seed-logmed.ts)
SYSTEM_EMAIL = "seed@ecomed.eco.br"

DRY_RUN = "--dry-run" in sys.argv or "-n" in sys.argv


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    text = re.sub(r"[^\w\s-]", "", text.lower())
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-")


def rede_para_email(rede: str) -> str:
    slug = slugify(rede)[:40]
    return f"rede.{slug}@ecomed.eco.br"


def rede_para_cnpj_placeholder(rede: str, idx: int) -> str:
    """CNPJ fictício apenas para redes sem CNPJ extraído."""
    num = str(idx).zfill(12)
    return f"{num[:2]}.{num[2:5]}.{num[5:8]}/{num[8:12]}-00"


def main():
    if not INPUT.exists():
        print(
            f"ERRO: {INPUT} não encontrado. Rode primeiro: python scripts/scrape_logmed.py"
        )
        sys.exit(1)

    with open(INPUT, encoding="utf-8") as f:
        pontos: list[dict] = json.load(f)

    print(f"Pontos carregados: {len(pontos)}")

    db_url = os.environ.get("DATABASE_URL") or os.environ.get("DIRECT_URL")
    if not db_url:
        print("ERRO: Defina a variável DATABASE_URL ou DIRECT_URL")
        sys.exit(1)

    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    if DRY_RUN:
        print("[DRY RUN] Nenhuma alteração será salva no banco.\n")

    # ── 1. Busca o ID do usuário "sistema" LogMed ────────────────────────────
    cur.execute('SELECT id FROM "User" WHERE email = %s', (SYSTEM_EMAIL,))
    row = cur.fetchone()
    if not row:
        print(f"ERRO: Usuário sistema '{SYSTEM_EMAIL}' não encontrado.")
        print("Rode primeiro: pnpm dlx tsx prisma/seed-logmed.ts")
        sys.exit(1)
    sistema_user_id = row[0]
    print(f"Usuário sistema: {SYSTEM_EMAIL} → {sistema_user_id}")

    # ── 2. Agrupa pontos por rede ─────────────────────────────────────────────
    redes: dict[str, list[dict]] = {}
    for p in pontos:
        rede = p.get("rede") or "Rede não informada"
        redes.setdefault(rede, []).append(p)

    print(f"Redes únicas: {len(redes)}")

    # ── 3. Cria/recupera Partners por rede ───────────────────────────────────
    rede_para_partner: dict[str, str] = {}  # rede_nome → partner_id

    for idx, (rede_nome, pts) in enumerate(redes.items(), start=1):
        email = rede_para_email(rede_nome)

        # Encontra o primeiro CNPJ válido da rede
        cnpj = None
        for p in pts:
            c = (p.get("cnpj") or "").strip()
            if c and len(c) == 14 and c.isdigit():
                cnpj = c
                break

        if not cnpj:
            # Gera CNPJ placeholder único
            cnpj = f"99{str(idx).zfill(12)}"[:14]

        # Verifica se Partner com esse CNPJ já existe
        cur.execute('SELECT id FROM "Partner" WHERE cnpj = %s', (cnpj,))
        existing = cur.fetchone()
        if existing:
            rede_para_partner[rede_nome] = existing[0]
            print(f"  [ok] Partner existente: {rede_nome} (cnpj={cnpj})")
            continue

        # Cria User para essa rede
        cur.execute('SELECT id FROM "User" WHERE email = %s', (email,))
        user_row = cur.fetchone()
        if user_row:
            user_id = user_row[0]
        else:
            if not DRY_RUN:
                cur.execute(
                    """
                    INSERT INTO "User" (id, name, email, role, active, "referralCode", "createdAt", "updatedAt")
                    VALUES (gen_random_uuid()::text, %s, %s, 'PARTNER', true, gen_random_uuid()::text, NOW(), NOW())
                    RETURNING id
                    """,
                    (rede_nome[:100], email),
                )
                user_id = cur.fetchone()[0]
            else:
                user_id = f"dry-{idx}"

        # Cria Partner
        if not DRY_RUN:
            cur.execute(
                """
                INSERT INTO "Partner" (id, "userId", cnpj, "companyName", "tradeName", "createdAt")
                VALUES (gen_random_uuid()::text, %s, %s, %s, %s, NOW())
                RETURNING id
                """,
                (user_id, cnpj, rede_nome[:200], rede_nome[:200]),
            )
            partner_id = cur.fetchone()[0]
        else:
            partner_id = f"dry-partner-{idx}"

        rede_para_partner[rede_nome] = partner_id
        print(f"  [+] Partner criado: {rede_nome} ({len(pts)} pontos)")

    if not DRY_RUN:
        conn.commit()
    print(f"\nPartners processados: {len(rede_para_partner)}")

    # ── 4. Deleta pontos parciais existentes destes partners ─────────────────
    if not DRY_RUN:
        partner_ids = list(rede_para_partner.values())
        cur.execute(
            'DELETE FROM "Point" WHERE "partnerId" = ANY(%s)',
            (partner_ids,),
        )
        deleted = cur.rowcount
        conn.commit()
        if deleted:
            print(f"Removidos {deleted} pontos parciais anteriores.")

    # ── 5. Insere os Points em lote (bulk insert) ─────────────────────────────
    print("\nInserindo pontos em lote...")
    rows_to_insert = []

    for p in pontos:
        rede = p.get("rede") or "INDEPENDENTE"
        partner_id = rede_para_partner.get(rede)
        if not partner_id:
            continue

        nome = (p.get("nome") or "").strip()[:200] or "Ponto de Descarte"
        address = (p.get("endereco") or "").strip()[:300] or "Endereço não informado"
        city = (p.get("cidade") or "").strip()[:100] or "Cidade não informada"
        state = (p.get("uf") or "").strip()[:2].upper() or "XX"
        zip_code = (p.get("cep") or "").replace("-", "").strip()[:8] or "00000000"
        lat = float(p.get("latitude") or 0)
        lng = float(p.get("longitude") or 0)

        rows_to_insert.append(
            (partner_id, nome, address, city, state, zip_code, lat, lng)
        )

    inserted = len(rows_to_insert)
    skipped = len(pontos) - inserted

    if not DRY_RUN and rows_to_insert:
        from psycopg2.extensions import AsIs

        # Usa IDs determinísticos para evitar duplicatas em re-execuções
        data = [
            (
                f"logmed-{i:06d}",  # id determinístico
                row[0],  # partnerId
                row[1],  # name
                row[2],  # address
                row[3],  # city
                row[4],  # state
                row[5],  # zipCode
                row[6],  # latitude
                row[7],  # longitude
            )
            for i, row in enumerate(rows_to_insert)
        ]
        execute_values(
            cur,
            """
            INSERT INTO "Point" (
                id, "partnerId", name, address, city, state, "zipCode",
                latitude, longitude, status, "residueTypes", "createdAt", "updatedAt"
            )
            VALUES %s
            ON CONFLICT (id) DO NOTHING
            """,
            data,
            template="(%s, %s, %s, %s, %s, %s, %s, %s, %s, 'APPROVED', ARRAY['medicamento'], NOW(), NOW())",
            page_size=500,
        )
        conn.commit()
        print(f"  {inserted} pontos inseridos (bulk).")

    cur.close()
    conn.close()

    print(f"\n{'[DRY RUN] ' if DRY_RUN else ''}Concluído!")
    print(f"  Pontos inseridos: {inserted}")
    print(f"  Pontos pulados:   {skipped}")


if __name__ == "__main__":
    main()
