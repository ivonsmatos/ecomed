"""
ia/app/routers/embed.py

Endpoint autenticado para indexação avulsa de documentos no PGVector.
Permite que o admin adicione conteúdo à base de conhecimento sem rodar
o script ingest.py — útil para ingestão incremental via API.

POST /embed
Authorization: Bearer <IA_SERVICE_TOKEN>
Body: { "documents": [{ "content": "...", "metadata": { "source": "..." } }] }
Resposta: { "ok": true, "chunks_indexados": N }
"""

import os
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from langchain_postgres import PGVector
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

router = APIRouter()
security = HTTPBearer()

COLLECTION_NAME = "ecomed_docs"
EMBED_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
CHUNK_SIZE = 800
CHUNK_OVERLAP = 100


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    expected = os.getenv("IA_SERVICE_TOKEN", "")
    if not expected or credentials.credentials != expected:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
    return credentials.credentials


class DocumentInput(BaseModel):
    content: str = Field(..., description="Conteúdo textual do documento")
    metadata: dict[str, Any] = Field(default_factory=dict, description="Metadados opcionais (source, tipo, etc.)")


class EmbedRequest(BaseModel):
    documents: list[DocumentInput]


class EmbedResponse(BaseModel):
    ok: bool
    chunks_indexados: int


@router.post("/embed", response_model=EmbedResponse)
async def embed(
    body: EmbedRequest,
    _token: str = Depends(verify_token),
):
    """
    Indexa uma lista de documentos no PGVector (adição incremental).
    Os documentos são divididos em chunks e os embeddings são gerados
    pelo modelo multilingual via fastembed.
    """
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="DATABASE_URL não configurada")

    docs = [Document(page_content=d.content, metadata=d.metadata) for d in body.documents]

    splitter = RecursiveCharacterTextSplitter(chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP)
    chunks = splitter.split_documents(docs)

    if not chunks:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Nenhum chunk gerado. Verifique o conteúdo dos documentos.",
        )

    embeddings = FastEmbedEmbeddings(model_name=EMBED_MODEL)
    PGVector.from_documents(
        documents=chunks,
        embedding=embeddings,
        collection_name=COLLECTION_NAME,
        connection=db_url,
    )

    return EmbedResponse(ok=True, chunks_indexados=len(chunks))
