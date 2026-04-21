"""
ia/app/ingest.py

Script CLI para indexar os documentos da base de conhecimento no PGVector.

Lê todos os arquivos .txt em ia/docs/, faz o chunking e indexa
os embeddings no Supabase (PGVector) via langchain_postgres.

Uso:
    cd ia/
    python -m app.ingest

    # Forçar re-indexação (apaga e recria a coleção):
    python -m app.ingest --reset

Quando adicionar novas perguntas ao treinamento:
    1. Edite ia/docs/treinamento_ecobot.txt (ou crie um novo .txt)
    2. Execute: python -m app.ingest --reset
"""

import os
import sys
import argparse
from pathlib import Path

from dotenv import load_dotenv
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from langchain_postgres import PGVector
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

# Carrega .env do diretório ia/
load_dotenv(Path(__file__).parent.parent / ".env")

DOCS_DIR = Path(__file__).parent.parent / "docs"
COLLECTION_NAME = "ecomed_docs"
EMBED_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
CHUNK_SIZE = 800
CHUNK_OVERLAP = 100


def carregar_documentos() -> list[Document]:
    """Lê todos os arquivos .txt em ia/docs/ e retorna lista de Documents."""
    if not DOCS_DIR.exists():
        print(f"[ERRO] Diretório de documentos não encontrado: {DOCS_DIR}")
        sys.exit(1)

    arquivos = sorted(DOCS_DIR.glob("*.txt"))
    if not arquivos:
        print(f"[ERRO] Nenhum arquivo .txt encontrado em {DOCS_DIR}")
        sys.exit(1)

    docs = []
    for path in arquivos:
        conteudo = path.read_text(encoding="utf-8")
        # Detecta o tipo de documento pelo nome do arquivo
        tipo = "legislacao" if "decreto" in path.name or "anvisa" in path.name else "treinamento"
        docs.append(Document(
            page_content=conteudo,
            metadata={"source": path.name, "tipo": tipo},
        ))
        print(f"  ✓ Carregado: {path.name} ({len(conteudo)} chars)")

    return docs


def chunkar_documentos(docs: list[Document]) -> list[Document]:
    """Divide os documentos em chunks menores para indexação."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    return splitter.split_documents(docs)


def indexar(chunks: list[Document], reset: bool = False) -> int:
    """Indexa os chunks no PGVector (Supabase). Retorna o número de chunks indexados."""
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("[ERRO] DATABASE_URL não definida no .env")
        sys.exit(1)

    # langchain-postgres exige driver psycopg3 na URL
    db_url = db_url.strip('"').strip("'")
    db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)
    db_url = db_url.replace("postgres://", "postgresql+psycopg://", 1)

    embeddings = FastEmbedEmbeddings(model_name=EMBED_MODEL)

    if reset:
        print(f"  → Apagando coleção '{COLLECTION_NAME}' para re-indexação...")
        store = PGVector(
            collection_name=COLLECTION_NAME,
            connection=db_url,
            embeddings=embeddings,
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


def main() -> None:
    parser = argparse.ArgumentParser(description="Indexa a base de conhecimento EcoMed no PGVector.")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Apaga a coleção existente antes de re-indexar (necessário ao atualizar documentos).",
    )
    args = parser.parse_args()

    print("=" * 60)
    print("EcoMed — Indexação da Base de Conhecimento")
    print()

    print(f"[1/3] Carregando documentos de {DOCS_DIR}")
    docs = carregar_documentos()
    print(f"  → {len(docs)} arquivo(s) carregado(s)")

    print(f"\n[2/3] Gerando chunks (size={CHUNK_SIZE}, overlap={CHUNK_OVERLAP})")
    chunks = chunkar_documentos(docs)
    print(f"  → {len(chunks)} chunks gerados")

    print("\n[3/3] Indexando no PGVector (Supabase)...")
    total = indexar(chunks, reset=args.reset)

    print()
    print("=" * 60)
    print(f"✅ Indexação concluída: {total} chunks indexados")
    print(f"   Coleção: {COLLECTION_NAME}")
    print(f"   Modelo de embeddings: {EMBED_MODEL}")


if __name__ == "__main__":
    main()
