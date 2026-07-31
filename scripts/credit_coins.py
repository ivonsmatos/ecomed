"""Crédito administrativo auditável de EcoCoins.

Exemplo:
  python scripts/credit_coins.py --email usuario@exemplo.com --amount 100 \
    --reason "Ajuste administrativo" --idempotency-key ADMIN-2026-0001 --dry-run
"""

import argparse
import os
import sys
import uuid

import psycopg
from psycopg.rows import dict_row


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--email", required=True)
    parser.add_argument("--amount", required=True, type=int)
    parser.add_argument("--reason", required=True)
    parser.add_argument("--idempotency-key")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--yes", action="store_true", help="confirma execução não interativa")
    return parser.parse_args()


def new_id() -> str:
    return "c" + uuid.uuid4().hex[:24]


def level_for(total_earned: int) -> str:
    if total_earned <= 100:
        return "SEMENTE"
    if total_earned <= 500:
        return "BROTO"
    if total_earned <= 2_000:
        return "ARVORE"
    if total_earned <= 5_000:
        return "GUARDIAO"
    return "LENDA_ECO"


def main() -> int:
    args = parse_args()
    max_amount = int(os.getenv("ECOMED_ADMIN_COIN_MAX", "1000"))
    if args.amount <= 0:
        sys.exit("--amount deve ser maior que zero")
    if args.amount > max_amount:
        sys.exit(f"--amount excede o limite administrativo configurado ({max_amount})")
    if len(args.reason.strip()) < 5:
        sys.exit("--reason deve explicar o ajuste")

    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        sys.exit("DATABASE_URL não configurada")

    mode = "SIMULAÇÃO" if args.dry_run else "EXECUÇÃO"
    print(f"{mode}: crédito de {args.amount} EcoCoins para {args.email}")
    print(f"Motivo: {args.reason.strip()}")
    print(f"Chave: {args.idempotency_key or '(não informada — execução não idempotente)'}")
    if not args.dry_run and not args.yes:
        if input("Digite CREDITAR para confirmar: ").strip() != "CREDITAR":
            sys.exit("Operação cancelada")

    with psycopg.connect(database_url, row_factory=dict_row) as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                cur.execute(
                    'SELECT id, email FROM "User" WHERE lower(email) = lower(%s) AND active = true',
                    (args.email,),
                )
                user = cur.fetchone()
                if not user:
                    sys.exit("Usuário ativo não encontrado")

                if args.idempotency_key:
                    cur.execute(
                        'SELECT id FROM "CoinTransaction" WHERE "idempotencyKey" = %s',
                        (args.idempotency_key,),
                    )
                    if cur.fetchone():
                        sys.exit("Chave de idempotência já utilizada; saldo não alterado")

                cur.execute(
                    'SELECT id, balance, "totalEarned" FROM "Wallet" '
                    'WHERE "userId" = %s FOR UPDATE',
                    (user["id"],),
                )
                wallet = cur.fetchone()
                if not wallet:
                    wallet = {"id": new_id(), "balance": 0, "totalEarned": 0}
                    cur.execute(
                        'INSERT INTO "Wallet" '
                        '(id, "userId", balance, "totalEarned", level, "createdAt", "updatedAt") '
                        "VALUES (%s, %s, 0, 0, 'SEMENTE', NOW(), NOW())",
                        (wallet["id"], user["id"]),
                    )

                new_balance = wallet["balance"] + args.amount
                new_total = wallet["totalEarned"] + args.amount
                cur.execute(
                    'UPDATE "Wallet" SET balance = %s, "totalEarned" = %s, '
                    'level = %s, "updatedAt" = NOW() WHERE id = %s',
                    (new_balance, new_total, level_for(new_total), wallet["id"]),
                )
                cur.execute(
                    'INSERT INTO "CoinTransaction" '
                    '(id, "walletId", amount, event, reference, note, "idempotencyKey", "createdAt") '
                    "VALUES (%s, %s, %s, 'ADMIN_GRANT', %s, %s, %s, NOW())",
                    (
                        new_id(),
                        wallet["id"],
                        args.amount,
                        args.idempotency_key,
                        args.reason.strip(),
                        args.idempotency_key,
                    ),
                )
                print(f"Saldo: {wallet['balance']} -> {new_balance}")
                print(f"Total acumulado: {wallet['totalEarned']} -> {new_total}")
                if args.dry_run:
                    conn.rollback()
                    print("Dry-run concluído; nenhuma alteração persistida.")
                    return 0
        print("Crédito concluído e auditado.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
