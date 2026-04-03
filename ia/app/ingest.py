"""
ia/app/ingest.py

Script CLI para indexar os documentos da base de conhecimento no PGVector.
Lê todos os arquivos .txt no diretório ia/docs/, faz o chunking e indexa
os embeddings no Supabase (PGVector) via langchain_postgres.

Uso:
    cd ia/
    python -m app.ingest

    # Forçar re-indexação (apaga e recria a coleção):
    python -m app.ingest --reset
"""

import os
import sys
import argparse
from pathlib import Path

from dotenv import load_dotenv
from langchain_ollama import OllamaEmbeddings
from langchain_postgres import PGVector
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

load_dotenv()

DOCS_DIR = Path(__file__).parent.parent / "docs"
COLLECTION_NAME = "ecomed_docs"
CHUNK_SIZE = 400
CHUNK_OVERLAP = 50


def carregar_documentos() -> list[Document]:
    """Lê todos os arquivos .txt em ia/docs/ e retorna lista de Documents."""
    docs: list[Document] = []

    if not DOCS_DIR.exists():
        print(f"[ERRO] Diretório de documentos não encontrado: {DOCS_DIR}")
        sys.exit(1)

    txt_files = sorted(DOCS_DIR.glob("*.txt"))
    if not txt_files:
        print(f"[ERRO] Nenhum arquivo .txt encontrado em {DOCS_DIR}")
        sys.exit(1)

    for arquivo in txt_files:
        conteudo = arquivo.read_text(encoding="utf-8")
        doc = Document(
            page_content=conteudo,
            metadata={
                "source": arquivo.name,
                "tipo": (
                    "legislacao"
                    if "lei" in arquivo.name
                    or "decreto" in arquivo.name
                    or "anvisa" in arquivo.name
                    else "guia"
                ),
            },
        )
        docs.append(doc)
        print(f"  ✓ Carregado: {arquivo.name} ({len(conteudo):,} chars)")

    return docs


def chunkar_documentos(docs: list[Document]) -> list[Document]:
    """Divide os documentos em chunks menores para indexação."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n===", "\n---", "\n\n", "\n", " ", ""],
    )
    chunks = splitter.split_documents(docs)
    return chunks


def indexar(chunks: list[Document], reset: bool = False) -> int:
    """Indexa os chunks no PGVector (Supabase). Retorna o número de chunks indexados."""
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("[ERRO] DATABASE_URL não definida no .env")
        sys.exit(1)

    ollama_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

    embeddings = OllamaEmbeddings(model="nomic-embed-text", base_url=ollama_url)

    if reset:
        print(f"  → Apagando coleção '{COLLECTION_NAME}' para re-indexação...")
        store = PGVector(
            embeddings=embeddings,
            collection_name=COLLECTION_NAME,
            connection=db_url,
        )
        store.delete_collection()
        print("  ✓ Coleção apagada")

    print(f"  → Indexando {len(chunks)} chunks na coleção '{COLLECTION_NAME}'...")
    PGVector.from_documents(
        documents=chunks,
        embedding=embeddings,
        collection_name=COLLECTION_NAME,
        connection=db_url,
    )
    return len(chunks)


def main():
    parser = argparse.ArgumentParser(
        description="Indexa a base de conhecimento EcoMed no PGVector."
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Apaga a coleção existente antes de re-indexar (necessário ao atualizar documentos).",
    )
    args = parser.parse_args()

    print("=" * 60)
    print("EcoMed — Indexação da Base de Conhecimento")
    print("=" * 60)

    print(f"\n[1/3] Carregando documentos de {DOCS_DIR}...")
    docs = carregar_documentos()
    print(f"  → {len(docs)} arquivo(s) carregado(s)")

    print(f"\n[2/3] Gerando chunks (size={CHUNK_SIZE}, overlap={CHUNK_OVERLAP})...")
    chunks = chunkar_documentos(docs)
    print(f"  → {len(chunks)} chunks gerados")

    print("\n[3/3] Indexando no PGVector (Supabase)...")
    total = indexar(chunks, reset=args.reset)

    print("\n" + "=" * 60)
    print(f"✅ Indexação concluída: {total} chunks indexados")
    print(f"   Coleção: {COLLECTION_NAME}")
    print(f"   Modelo de embeddings: nomic-embed-text")
    print("=" * 60)


if __name__ == "__main__":
    main()
