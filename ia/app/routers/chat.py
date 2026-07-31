import os
import asyncio
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field

from app.services.rag import RAGService

router = APIRouter()
security = HTTPBearer()

# Instância global injetada pelo main.py via set_rag()
_rag: RAGService | None = None
_max_concurrency = max(1, int(os.getenv("ECOBOT_MAX_CONCURRENCY", "8")))
_timeout_seconds = max(1.0, float(os.getenv("ECOBOT_REQUEST_TIMEOUT_SECONDS", "50")))
_semaphore = asyncio.Semaphore(_max_concurrency)


def set_rag(instance: RAGService) -> None:
    global _rag
    _rag = instance


def get_rag() -> RAGService:
    if _rag is None:
        raise HTTPException(status_code=503, detail="Serviço não inicializado")
    return _rag


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    expected = os.getenv("IA_SERVICE_TOKEN", "")
    if not expected or credentials.credentials != expected:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
    return credentials.credentials


class ChatRequest(BaseModel):
    pergunta: str = Field(..., min_length=3, max_length=1000)
    session_id: str | None = Field(None, max_length=64, description="ID de sessão para memória de conversa")


class ChatResponse(BaseModel):
    resposta: str
    model: str | None = None
    ragScore: float | None = None


@router.post("/chat", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    _token: str = Depends(verify_token),
    rag: RAGService = Depends(get_rag),
):
    """Recebe uma pergunta sobre descarte de medicamentos e retorna resposta do RAG."""
    try:
        async with _semaphore:
            result = await asyncio.wait_for(
                asyncio.to_thread(rag.perguntar, body.pergunta, session_id=body.session_id),
                timeout=_timeout_seconds,
            )
    except asyncio.TimeoutError as exc:
        raise HTTPException(status_code=504, detail="Tempo limite do EcoBot excedido") from exc
    return ChatResponse(
        resposta=result["resposta"],
        model=result.get("model"),
        ragScore=result.get("ragScore"),
    )
