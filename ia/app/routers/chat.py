import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from app.services.rag import RAGService

router = APIRouter()
security = HTTPBearer()

# RAGService instance shared via app.state (set in main.py lifespan)
_rag: RAGService | None = None


def set_rag(rag: RAGService):
    global _rag
    _rag = rag


def get_rag() -> RAGService:
    if _rag is None:
        raise HTTPException(status_code=503, detail="Serviço não inicializado")
    return _rag


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    expected = os.getenv("IA_SERVICE_TOKEN", "")
    if not expected or credentials.credentials != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
        )
    return credentials.credentials


class ChatRequest(BaseModel):
    pergunta: str = Field(..., min_length=3, max_length=1000)


class ChatResponse(BaseModel):
    resposta: str


@router.post("/chat", response_model=ChatResponse, tags=["chat"])
async def chat(
    body: ChatRequest,
    _token: str = Depends(verify_token),
    rag: RAGService = Depends(get_rag),
):
    """Recebe uma pergunta sobre descarte de medicamentos e retorna resposta do RAG."""
    resposta = await rag.perguntar(body.pergunta)
    return ChatResponse(resposta=resposta)
