import os
from langchain_ollama import OllamaLLM, OllamaEmbeddings
from langchain_postgres import PGVector
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from dotenv import load_dotenv

load_dotenv()

SYSTEM_PROMPT = """Você é o assistente educativo do EcoMed, uma plataforma brasileira
dedicada ao descarte correto de medicamentos.

VOCÊ PODE ajudar com:
- Como e onde descartar medicamentos vencidos ou sem uso
- Localização de pontos de coleta no Brasil (farmácias, UBS, ecopontos)
- Impacto ambiental do descarte incorreto de medicamentos
- Legislação brasileira: PNRS (Lei 12.305/2010), Decreto 10.388/2020, RDC 222/2018 ANVISA
- Educação ambiental relacionada a medicamentos

VOCÊ NUNCA DEVE:
- Sugerir doses ou posologia de qualquer medicamento
- Recomendar medicamentos para doenças ou sintomas
- Fornecer diagnósticos médicos
- Responder sobre automedicação
- Discutir interações medicamentosas

Se a pergunta estiver fora do escopo, responda:
"Posso ajudar apenas com informações sobre descarte correto de medicamentos.
Para questões médicas, consulte um farmacêutico ou médico."

SEMPRE adicione ao final de respostas sobre saúde:
"⚠️ Este conteúdo é educativo. Para dúvidas médicas, consulte um profissional de saúde."

Responda em português brasileiro claro e acessível.
Use apenas o contexto fornecido. Se não souber, diga que não tem essa informação.

Contexto:
{context}

Pergunta: {question}
Resposta:"""

PALAVRAS_BLOQUEADAS = [
    "dose",
    "dosagem",
    "posologia",
    "quantos comprimidos",
    "receita médica",
    "prescrição",
    "diagnóstico",
    "tratamento de",
    "sintoma",
    "overdose",
    "superdosagem",
    "intoxicação",
    "comprar medicamento",
]

RESPOSTA_FORA_ESCOPO = (
    "Posso ajudar apenas com informações sobre descarte correto de medicamentos no Brasil. 🌿\n"
    "Para questões médicas, consulte um farmacêutico ou médico."
)


def verificar_escopo(pergunta: str) -> bool:
    return not any(p in pergunta.lower() for p in PALAVRAS_BLOQUEADAS)


class RAGService:
    def __init__(self):
        self.chain = None

    async def initialize(self):
        base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        model = os.getenv("OLLAMA_MODEL", "llama3:8b-instruct-q4_0")
        db_url = os.getenv("DATABASE_URL")

        embeddings = OllamaEmbeddings(model="nomic-embed-text", base_url=base_url)
        llm = OllamaLLM(
            model=model, base_url=base_url, temperature=0.1, num_predict=512
        )

        vectorstore = PGVector(
            embeddings=embeddings,
            collection_name="ecomed_docs",
            connection=db_url,
        )

        prompt = PromptTemplate(
            input_variables=["context", "question"],
            template=SYSTEM_PROMPT,
        )

        self.chain = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            retriever=vectorstore.as_retriever(search_kwargs={"k": 4}),
            chain_type_kwargs={"prompt": prompt},
        )
        print(f"RAG pronto — modelo: {model}")

    async def perguntar(self, pergunta: str) -> str:
        if not verificar_escopo(pergunta):
            return RESPOSTA_FORA_ESCOPO
        if not self.chain:
            return "Serviço iniciando. Tente em alguns instantes."
        resultado = await self.chain.ainvoke({"query": pergunta})
        return resultado.get("result", "Não foi possível gerar resposta.")
