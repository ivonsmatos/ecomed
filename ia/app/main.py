from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.routers import health
from app.routers import chat as chat_router
from app.routers.chat import set_rag
from app.services.rag import RAGService


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("EcoMed IA iniciando...")
    rag = RAGService()
    await rag.initialize()
    set_rag(rag)
    yield
    print("EcoMed IA encerrando...")


app = FastAPI(
    title="EcoMed IA",
    description="Microserviço RAG — chatbot educativo sobre descarte de medicamentos",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://ecomed.eco.br",
        "https://staging.ecomed.eco.br",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(chat_router.router, tags=["chat"])
