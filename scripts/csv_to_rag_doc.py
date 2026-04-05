"""
scripts/csv_to_rag_doc.py

Converte o CSV de Medicamentos e Suplementos em documento .txt estruturado
para ser indexado pela RAG do EcoMed (ia/docs/).

O documento é uma BASE DE CONHECIMENTO para:
  - Identificar a forma farmacêutica de um medicamento mencionado pelo usuário
  - Cruzar com as regras de descarte (aceito / não aceito no ponto de coleta)

NÃO deve ser usado para sugestão, prescrição ou recomendação terapêutica.

Uso:
    cd ecomed/
    python scripts/csv_to_rag_doc.py
"""

import csv
from pathlib import Path
from collections import defaultdict

CSV_PATH = Path(__file__).parent.parent / "Medicamentos e Suplementos - Página1.csv"
OUT_PATH = Path(__file__).parent.parent / "ia" / "docs" / "formas-farmaceuticas-medicamentos.txt"

# Normaliza variações de nome de tipo para um rótulo canônico
TIPO_ALIAS = {
    "comprimidos": "Comprimidos",
    "cápsulas": "Cápsulas",
    "capsulas": "Cápsulas",
    "solução": "Soluções e Líquidos",
    "solucao": "Soluções e Líquidos",
    "injeção": "Injetáveis",
    "injecao": "Injetáveis",
    "suspensão": "Suspensões",
    "suspensao": "Suspensões",
    "pomada": "Pomadas e Géis",
    "gel": "Pomadas e Géis",
    "creme": "Pomadas e Géis",
    "spray": "Sprays e Aerossóis",
    "aerossol": "Sprays e Aerossóis",
    "aerossóis": "Sprays e Aerossóis",
    "adesivo": "Adesivos Transdérmicos",
    "patch": "Adesivos Transdérmicos",
    "implante": "Implantes e Dispositivos",
    "dispositivo": "Implantes e Dispositivos",
    "supositório": "Supositórios",
    "supositorio": "Supositórios",
    "pó": "Pós e Granulados",
    "granulado": "Pós e Granulados",
    "gotas": "Gotas",
    "colírio": "Gotas",
    "colirio": "Gotas",
}

def normalizar_tipo(tipo_raw: str) -> str:
    """Retorna o rótulo canônico para um tipo de forma farmacêutica."""
    t = tipo_raw.strip().lower()
    for chave, label in TIPO_ALIAS.items():
        if chave in t:
            return label
    return tipo_raw.strip().title() if tipo_raw.strip() else "Outros"


def main():
    grupos: defaultdict[str, list[tuple[str, str]]] = defaultdict(list)

    with open(CSV_PATH, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            nome = row.get("Nome", "").strip()
            tipo_raw = row.get("Tipo", "")
            classe = row.get("Classe Farmacológica", "").strip()

            if not nome:
                continue

            tipo = normalizar_tipo(tipo_raw)
            grupos[tipo].append((nome, classe))

    linhas: list[str] = []
    linhas.append("REFERÊNCIA DE MEDICAMENTOS, SUPLEMENTOS E FORMAS FARMACÊUTICAS PARA DESCARTE CORRETO")
    linhas.append("")
    linhas.append("PROPÓSITO DESTA BASE DE CONHECIMENTO:")
    linhas.append("Este documento lista medicamentos e suplementos com suas formas farmacêuticas")
    linhas.append("EXCLUSIVAMENTE para auxiliar na identificação do tipo de resíduo a ser descartado.")
    linhas.append("NÃO deve ser utilizado para sugestão, prescrição ou recomendação de uso terapêutico.")
    linhas.append("Para dúvidas de saúde, consulte sempre um médico ou farmacêutico.")
    linhas.append("")
    linhas.append("COMO USAR: Ao identificar que um medicamento é um comprimido, cápsula, solução,")
    linhas.append("injetável, pomada, etc., consulte os documentos de legislação e guias do EcoMed")
    linhas.append("para saber se aquela forma é aceita no ponto de coleta de logística reversa.")
    linhas.append("")

    # Tabela de referência rápida de formas aceitas/não aceitas
    linhas.append("===================================================================")
    linhas.append("RESUMO: FORMAS FARMACÊUTICAS E ACEITAÇÃO NA LOGÍSTICA REVERSA")
    linhas.append("===================================================================")
    linhas.append("")
    linhas.append("GERALMENTE ACEITOS nos dispensadores/contentores de logística reversa (Decreto 10.388/2020):")
    linhas.append("- Comprimidos (simples, revestidos, efervescentes, sublinguais)")
    linhas.append("- Cápsulas (duras e moles, liberação prolongada)")
    linhas.append("- Pós e granulados")
    linhas.append("- Pastilhas")
    linhas.append("- Adesivos transdérmicos")
    linhas.append("- Supositórios")
    linhas.append("- Gotas/colírios (em embalagem fechada/lacrada)")
    linhas.append("- Pomadas, géis e cremes (em embalagem fechada)")
    linhas.append("- Líquidos/soluções em embalagem fechada, lacrada ou tampada")
    linhas.append("")
    linhas.append("FORMA QUE REQUER CUIDADO ESPECIAL ou pode NÃO SER ACEITA:")
    linhas.append("- Injetáveis com agulha (agulha é resíduo perfurocortante — Grupo E, não Grupo B)")
    linhas.append("- Aerossóis/sprays pressurizados (risco de explosão)")
    linhas.append("- Citostáticos e quimioterápicos (Grupo A/B especial — descarte em serviço de saúde)")
    linhas.append("- Radiofármacos (descarte exclusivo em serviço especializado)")
    linhas.append("- Medicamentos controlados especiais: verificar regulamento local")
    linhas.append("")

    for tipo in sorted(grupos.keys()):
        itens = grupos[tipo]
        linhas.append("===================================================================")
        linhas.append(f"FORMA FARMACÊUTICA: {tipo.upper()} ({len(itens)} itens)")
        linhas.append("===================================================================")
        linhas.append("")

        # Agrupa por classe farmacológica, se disponível
        por_classe: defaultdict[str, list[str]] = defaultdict(list)
        for nome, classe in itens:
            chave = classe if classe else "Sem classificação farmacológica"
            por_classe[chave].append(nome)

        for classe in sorted(por_classe.keys()):
            nomes = por_classe[classe]
            if classe != "Sem classificação farmacológica":
                linhas.append(f"  Classe: {classe}")
            for nome in nomes:
                linhas.append(f"  - {nome}")
            linhas.append("")

    conteudo = "\n".join(linhas)
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(conteudo, encoding="utf-8")

    total = sum(len(v) for v in grupos.values())
    print(f"✅ Documento gerado: {OUT_PATH}")
    print(f"   {total} medicamentos em {len(grupos)} formas farmacêuticas")
    print(f"   {len(conteudo):,} caracteres | {len(conteudo.splitlines())} linhas")


if __name__ == "__main__":
    main()
