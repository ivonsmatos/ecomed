#!/usr/bin/env python3
"""
Faz scraping da página https://logmed.org.br/onde-descartar/pdf
e salva todos os pontos de descarte em prisma/logmed_pontos.json

Uso:
    python scripts/scrape_logmed.py

Saída:
    prisma/logmed_pontos.json
"""

import json
import re
import time
import sys
from pathlib import Path

import requests
from bs4 import BeautifulSoup

URL = "https://logmed.org.br/onde-descartar/pdf"
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
OUTPUT = Path(__file__).parent.parent / "prisma" / "logmed_pontos.json"

HEADERS = {
    "User-Agent": "EcoMed/1.0 (contato@ecomed.eco.br) importacao de pontos de descarte",
    "Accept-Language": "pt-BR,pt;q=0.9",
}


REDES_CONHECIDAS_PALAVRAS = ("FARMA", "DROGA", "REDE", "SINCO", "ABRA", "FEBRA", "ABC")


def normalizar_rede(rede_raw: str) -> str:
    """Normaliza o campo rede: remove duplicações, padroniza maiúsculas,
    e trata nomes de pessoas como farmácias independentes."""
    if not rede_raw:
        return "INDEPENDENTE"
    parts = [r.strip().upper() for r in rede_raw.split(",")]
    parts = list(dict.fromkeys(parts))  # remove duplicatas mantendo ordem
    rede = ", ".join(p for p in parts if p)

    # Indicadores de ausência de rede
    if rede in (
        "NÃO POSSUI",
        "NAO POSSUI",
        "FARMACÊUTICO RESPONSÁVEL",
        "FARMACEUTICO RESPONSAVEL",
        "REDE NÃO INFORMADA",
    ):
        return "INDEPENDENTE"

    # Se contém palavras típicas de rede/associação, assume rede legítima
    if any(w in rede for w in REDES_CONHECIDAS_PALAVRAS):
        return rede

    # Caso contrário, trata como farmácia independente (possivelmente nome de pessoa)
    return "INDEPENDENTE"


def fetch_page() -> str:
    print("Baixando página do LogMed... (pode demorar, ~13MB)")
    resp = requests.get(URL, headers=HEADERS, timeout=120)
    resp.raise_for_status()
    return resp.text


def clean_text(el) -> str:
    if el is None:
        return ""
    return re.sub(r"\s+", " ", el.get_text(separator=" ")).strip()


def parse_pontos(html: str) -> list[dict]:
    soup = BeautifulSoup(html, "html.parser")

    # A tabela principal tem colunas: UF | Cidade | Nome+CNPJ | Endereço | CEP | Rede
    # Cada <tr> que tem 6 <td>s é um ponto
    pontos = []
    rows = soup.find_all("tr")

    for row in rows:
        tds = row.find_all("td", recursive=False)
        if len(tds) < 6:
            continue

        uf = clean_text(tds[0])
        cidade = clean_text(tds[1])

        # 3a coluna: div.font-semibold = nome, div sem font-semibold = CNPJ
        td_nome = tds[2]
        nome_el = td_nome.find("div", class_=re.compile(r"font-semibold"))
        nome = clean_text(nome_el) if nome_el else ""
        # Remove prefixo "REDE - " que às vezes aparece
        if " - " in nome and len(nome.split(" - ")[0]) < 20:
            nome = nome.split(" - ", 1)[1]

        # CNPJ: segundo div da coluna
        all_divs = td_nome.find_all("div", recursive=False)
        cnpj = ""
        for d in all_divs:
            text = clean_text(d)
            if re.match(r"\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}", text):
                cnpj = text
                break

        endereco = clean_text(tds[3])
        cep = clean_text(tds[4]).replace("-", "").replace(".", "").strip()
        rede_raw = clean_text(tds[5])
        rede = normalizar_rede(rede_raw)

        # Ignora linhas sem dados úteis
        if not nome or not uf or len(uf) != 2:
            continue

        pontos.append(
            {
                "uf": uf.upper(),
                "cidade": cidade,
                "nome": nome,
                "cnpj": cnpj.replace(".", "").replace("/", "").replace("-", ""),
                "cnpj_formatado": cnpj,
                "endereco": endereco,
                "cep": cep,
                "rede": rede if rede else "INDEPENDENTE",
                "latitude": 0.0,
                "longitude": 0.0,
            }
        )

    return pontos


def geocodificar_cidades(pontos: list[dict]) -> dict[str, tuple[float, float]]:
    """
    Geocodifica por cidade (centroide) para evitar 7.940 requisições.
    Usa Nominatim com delay de 1s por requisição (política de uso).
    """
    cidades_unicas = list(
        {(p["cidade"], p["uf"]) for p in pontos if p["cidade"] and p["uf"]}
    )
    total = len(cidades_unicas)
    print(f"\nGeocodificando {total} cidades via Nominatim (OSM)...")
    print("Isso pode levar ~15 minutos (1 req/s conforme política de uso).\n")

    coords: dict[str, tuple[float, float]] = {}

    for i, (cidade, uf) in enumerate(cidades_unicas):
        chave = f"{cidade}|{uf}"
        query = f"{cidade}, {uf}, Brasil"
        try:
            resp = requests.get(
                NOMINATIM_URL,
                params={
                    "q": query,
                    "format": "json",
                    "limit": 1,
                    "countrycodes": "br",
                },
                headers=HEADERS,
                timeout=10,
            )
            data = resp.json()
            if data:
                lat = float(data[0]["lat"])
                lon = float(data[0]["lon"])
                coords[chave] = (lat, lon)
                print(f"  [{i+1}/{total}] {query} → {lat:.4f}, {lon:.4f}")
            else:
                print(f"  [{i+1}/{total}] {query} → não encontrado")
                coords[chave] = (0.0, 0.0)
        except Exception as e:
            print(f"  [{i+1}/{total}] {query} → erro: {e}")
            coords[chave] = (0.0, 0.0)

        # Respeita política do Nominatim: máximo 1 req/s
        time.sleep(1.1)

    return coords


def main():
    skip_geo = "--skip-geo" in sys.argv or "-s" in sys.argv

    html = fetch_page()
    pontos = parse_pontos(html)
    print(f"Pontos extraídos: {len(pontos)}")

    if not pontos:
        print("ERRO: Nenhum ponto extraído. Verifique o HTML da página.")
        sys.exit(1)

    # Estatísticas
    redes = {p["rede"] for p in pontos}
    estados = {p["uf"] for p in pontos}
    print(f"Redes únicas: {len(redes)}")
    print(f"Estados: {len(estados)} — {', '.join(sorted(estados))}")

    if not skip_geo:
        coords = geocodificar_cidades(pontos)
        # Aplica coordenadas
        for p in pontos:
            chave = f"{p['cidade']}|{p['uf']}"
            lat, lon = coords.get(chave, (0.0, 0.0))
            p["latitude"] = lat
            p["longitude"] = lon
    else:
        print("\n[--skip-geo] Pulando geocodificação. Coordenadas serão 0.0, 0.0")

    # Salva JSON
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(pontos, f, ensure_ascii=False, indent=2)

    print(f"\nSalvo em: {OUTPUT}")
    print(f"Total de pontos: {len(pontos)}")


if __name__ == "__main__":
    main()
