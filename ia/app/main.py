from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import health, chat, embed
from app.routers.chat import set_rag
from app.services.rag import RAGService


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("EcoMed IA iniciando...")
    rag = RAGService()
    rag.initialize()
    set_rag(rag)
    yield
    print("EcoMed IA encerrando...")


app = FastAPI(
    title="EcoMed IA",
    description="Microserviço RAG — chatbot educativo sobre descarte de medicamentos",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(chat.router)
app.include_router(embed.router)
