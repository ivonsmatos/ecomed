#!/usr/bin/env python3
"""
Geocodifica prisma/logmed_pontos.json usando o dataset local
de municípios brasileiros (prisma/municipios_br.csv).

Sem chamadas de API — geocodificação instantânea.

Uso:
    python scripts/geocode_logmed.py
"""

import csv
import json
import unicodedata
from pathlib import Path

PONTOS_JSON = Path(__file__).parent.parent / "prisma" / "logmed_pontos.json"
MUNICIPIOS_CSV = Path(__file__).parent.parent / "prisma" / "municipios_br.csv"

# Mapa de código_uf → sigla UF
UF_SIGLAS = {
    "11": "RO",
    "12": "AC",
    "13": "AM",
    "14": "RR",
    "15": "PA",
    "16": "AP",
    "17": "TO",
    "21": "MA",
    "22": "PI",
    "23": "CE",
    "24": "RN",
    "25": "PB",
    "26": "PE",
    "27": "AL",
    "28": "SE",
    "29": "BA",
    "31": "MG",
    "32": "ES",
    "33": "RJ",
    "35": "SP",
    "41": "PR",
    "42": "SC",
    "43": "RS",
    "50": "MS",
    "51": "MT",
    "52": "GO",
    "53": "DF",
}


def normalizar(texto: str) -> str:
    """Remove acentos e converte para maiúsculas."""
    nfkd = unicodedata.normalize("NFD", texto)
    sem_acento = "".join(c for c in nfkd if unicodedata.category(c) != "Mn")
    return sem_acento.upper().strip()


def carregar_municipios() -> dict[tuple[str, str], tuple[float, float]]:
    """Retorna dict: (nome_normalizado, uf) -> (lat, lon)"""
    coords: dict[tuple[str, str], tuple[float, float]] = {}
    with open(MUNICIPIOS_CSV, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            nome_norm = normalizar(row["nome"])
            uf = UF_SIGLAS.get(str(row["codigo_uf"]).zfill(2), "")
            if uf:
                lat = float(row["latitude"])
                lon = float(row["longitude"])
                coords[(nome_norm, uf)] = (lat, lon)
    return coords


def main() -> None:
    if not PONTOS_JSON.exists():
        print(f"ERRO: {PONTOS_JSON} não encontrado.")
        print("Rode primeiro: python scripts/scrape_logmed.py --skip-geo")
        return

    if not MUNICIPIOS_CSV.exists():
        print(f"ERRO: {MUNICIPIOS_CSV} não encontrado.")
        return

    with open(PONTOS_JSON, encoding="utf-8") as f:
        pontos: list[dict] = json.load(f)

    print(f"Municípios carregados de: {MUNICIPIOS_CSV.name}")
    municipios = carregar_municipios()
    print(f"Total de municípios no dataset: {len(municipios)}")

    # Overrides para cidades com variações de nome/grafia
    OVERRIDES: dict[tuple[str, str], tuple[float, float]] = {
        ("DIAS D`AVILA", "BA"): (-12.6077, -38.2977),  # Dias D'Ávila
        ("MOJI MIRIM", "SP"): (-22.4328, -46.9578),  # Mogi Mirim
        ("PARATI", "RJ"): (-23.2197, -44.7149),  # Paraty
        ("SANTA BARBARA D`OESTE", "SP"): (-22.7539, -47.4139),
        ("SANTANA DO LIVRAMENTO", "RS"): (-30.8906, -55.5322),  # Sant'Ana
        ("BERNARDINO DE CAMPOS", "MG"): (-23.0119, -49.4708),  # é SP, não MG
        ("TAUBATE", "MG"): (-23.0266, -45.5556),  # é SP, não MG
    }

    encontrados = 0
    nao_encontrados: set[str] = set()

    for p in pontos:
        cidade_norm = normalizar(p.get("cidade") or "")
        uf = (p.get("uf") or "").upper().strip()

        # Overrides primeiro
        override_key = (cidade_norm, uf)
        if override_key in OVERRIDES:
            p["latitude"], p["longitude"] = OVERRIDES[override_key]
            encontrados += 1
            continue

        chave = (cidade_norm, uf)
        if chave in municipios:
            lat, lon = municipios[chave]
            p["latitude"] = lat
            p["longitude"] = lon
            encontrados += 1
        else:
            # Tenta busca parcial (cidade começa com o texto)
            fallback = None
            for (nome, u), coords in municipios.items():
                if u == uf and (
                    nome.startswith(cidade_norm) or cidade_norm.startswith(nome)
                ):
                    fallback = coords
                    break
            if fallback:
                p["latitude"], p["longitude"] = fallback
                encontrados += 1
            else:
                nao_encontrados.add(f"{p.get('cidade')} ({uf})")

    # Salva JSON atualizado
    with open(PONTOS_JSON, "w", encoding="utf-8") as f:
        json.dump(pontos, f, ensure_ascii=False, indent=2)

    total = len(pontos)
    print(f"\nGeocodificação concluída:")
    print(f"  Encontrados:     {encontrados}/{total} ({100*encontrados//total}%)")
    print(f"  Não encontrados: {len(nao_encontrados)}")

    if nao_encontrados:
        print(f"\nCidades sem coordenadas ({len(nao_encontrados)}):")
        for c in sorted(nao_encontrados)[:20]:
            print(f"  - {c}")
        if len(nao_encontrados) > 20:
            print(f"  ... e mais {len(nao_encontrados) - 20}")

    print(f"\nArquivo atualizado: {PONTOS_JSON}")


if __name__ == "__main__":
    main()
