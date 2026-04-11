# Arquitetura de IA — EcoMed

> Documentação técnica completa do microserviço de inteligência artificial do EcoMed: EcoBot, RAG, LLM, guardrails e fluxo de dados.

---

## Visão Geral

O EcoMed possui um microserviço de IA dedicado (pasta `ia/`) que alimenta o **EcoBot** — o assistente virtual especializado em descarte correto de medicamentos. O EcoBot utiliza uma arquitetura **RAG** (Retrieval-Augmented Generation) que combina busca vetorial em documentos oficiais com um LLM de linguagem natural para gerar respostas precisas e contextualizadas.

```
Usuário → EcoMed App (Next.js)
           ↓ POST /api/chat
        Hono Route (proxy)
           ↓ Bearer Token
        Microserviço IA (FastAPI)
           ↓
        [Guardrails] → resposta imediata se detectado
           ↓ pergunta segura
        [Embedding] → Ollama nomic-embed-text
           ↓ vetor 768 dims
        [VectorStore] → PostgreSQL PGVector
           ↓ k=2 documentos mais relevantes
        [Prompt] → contexto + pergunta
           ↓
        [LLM] → Groq llama-3.1-8b-instant
           ↓ resposta bruta
        [Filtro de Saída]
           ↓ resposta final
        Usuário
```

---

## Stack Tecnológica

| Componente      | Tecnologia                  | Função                                  |
| --------------- | --------------------------- | --------------------------------------- |
| Framework       | FastAPI 0.115+              | API HTTP assíncrona                     |
| Embeddings      | Ollama `nomic-embed-text`   | Vetorização de texto (local, CPU)       |
| LLM             | Groq `llama-3.1-8b-instant` | Geração de resposta (API externa)       |
| VectorStore     | PostgreSQL + PGVector       | Armazenamento e busca vetorial          |
| Orquestração    | LangChain                   | Chain RAG (retriever + prompt + LLM)    |
| Guardrails      | Regex customizado           | Filtragem pré-LLM (sem custo de tokens) |
| Containerização | Docker                      | Deploy no VPS Oracle Cloud              |

---

## Componentes em Detalhe

### 1. FastAPI (`ia/app/main.py`)

Ponto de entrada do microserviço. Inicializa o `RAGService` no **lifespan** (uma única vez na inicialização), evitando reconexões ao banco a cada request.

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicializa uma única instância global do RAGService
    rag = RAGService()
    yield
    # Cleanup ao encerrar

app = FastAPI(title="EcoMed IA", version="1.0.0", lifespan=lifespan)
```

**CORS configurado para:**

- `http://localhost:3000` (desenvolvimento)
- `https://ecomed.eco.br` (produção)

**Endpoints expostos:**

- `GET /health` — status do serviço
- `POST /chat` — pergunta ao EcoBot
- `POST /embed` — gerar embedding de texto (uso interno/debug)

---

### 2. Embeddings — Ollama `nomic-embed-text`

**O que faz:** Converte texto (perguntas e documentos) em vetores numéricos de alta dimensão (768 dimensões) que representam o _significado semântico_ do texto.

**Por que Ollama local:**

- Gratuito, sem limite de chamadas
- Latência baixa (roda em CPU no próprio VPS)
- Privacidade: o conteúdo dos documentos nunca sai do servidor
- `nomic-embed-text` é otimizado para recuperação de informações em português

**Como é usado:**

1. **Na indexação** (`ingest.py`): vetoriza cada chunk de documento para armazenar no PGVector
2. **Na consulta**: vetoriza a pergunta do usuário para encontrar documentos semanticamente similares

```python
embeddings = OllamaEmbeddings(
    model="nomic-embed-text",
    base_url=settings.OLLAMA_BASE_URL,  # http://localhost:11434
)
```

---

### 3. LLM — Groq `llama-3.1-8b-instant`

**O que faz:** Modelo de linguagem que recebe o contexto (documentos recuperados + pergunta) e gera a resposta em linguagem natural.

**Por que Groq:**

- Latência extremamente baixa: **< 2 segundos** por resposta (hardware LPU dedicado)
- Comparação: Ollama rodando llama3 em CPU levava **100+ segundos** (inaceitável para UX)
- API gratuita com limites generosos para o volume do EcoMed
- llama-3.1-8b-instant: bom equilíbrio entre qualidade e velocidade

**Configuração:**

```python
llm = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0.1,    # respostas mais determinísticas e factuais
    max_tokens=512,     # resposta compacta e objetiva
    api_key=settings.GROQ_API_KEY,
)
```

---

### 4. VectorStore — PostgreSQL + PGVector

**O que faz:** Banco de dados vetorial que armazena os embeddings dos documentos e executa busca por similaridade cossenoidal.

**Por que PGVector:**

- Aproveita o PostgreSQL já existente no projeto (mesmo banco do Prisma)
- Sem necessidade de infraestrutura adicional (Pinecone, Weaviate, etc.)
- Consultas SQL nativas com filtros
- Extensão madura e bem suportada pelo LangChain

**Coleção:** `ecomed_docs`

**Parâmetros de retrieval:**

- `k=2` — retorna os **2 documentos mais relevantes** para cada pergunta
- Similaridade cossenoidal (padrão do PGVector)

```python
vectorstore = PGVector(
    embeddings=embeddings,
    collection_name="ecomed_docs",
    connection=settings.DATABASE_URL,
)
retriever = vectorstore.as_retriever(search_kwargs={"k": 2})
```

---

### 5. RAG Chain — LangChain

**O que faz:** Orquestra todo o fluxo de retrieval + geração em uma cadeia (chain).

**Fluxo da chain:**

```
pergunta
  ↓ retriever
documentos relevantes (k=2)
  ↓ format_docs
string com o contexto concatenado
  ↓ prompt template
mensagem formatada para o LLM
  ↓ llm (Groq)
resposta bruta
  ↓ StrOutputParser
string Python com a resposta final
```

**Prompt System:**

```
Você é o EcoBot, assistente virtual do EcoMed especializado em descarte
correto de medicamentos no Brasil.

REGRAS:
- Responda APENAS sobre descarte de medicamentos e saúde ambiental
- Baseie suas respostas EXCLUSIVAMENTE no contexto fornecido
- Se a informação não estiver no contexto, diga que não sabe
- Nunca recomende doses, diagnósticos ou tratamentos médicos
- Seja direto e objetivo (máximo 3 parágrafos)
- Use linguagem simples, acessível ao cidadão comum
```

**Execução assíncrona segura:**

```python
# A chain LangChain é síncrona internamente
# Executamos em thread pool para não bloquear o event loop do FastAPI
resposta = await asyncio.get_event_loop().run_in_executor(
    None,
    lambda: chain.invoke({"question": pergunta}),
)
```

---

### 6. Guardrails — 4 Camadas de Segurança

**O que faz:** Sistema de filtragem pré-LLM que intercepta perguntas problemáticas **antes** de qualquer chamada ao Groq, economizando tokens e garantindo respostas adequadas.

**Por que regex (não LLM):**

- Zero latência adicional
- Zero custo de tokens
- Totalmente previsível e auditável
- Sem risco de "guardrail bypass" via jailbreak do LLM

#### Camada 1 — EMERGÊNCIA

Detecta risco imediato à vida: ingestão acidental, superdosagem, envenenamento.

```python
EMERGENCIA = [
    r"ingest(ei|ou|iu|ao|)\s*(o\s+)?medicamento",
    r"superdos(e|agem|ei)",
    r"tomei\s+(muito|demais|dose)",
    r"envenenam(ento|ento|ei)",
]
```

**Resposta:** Redireciona imediatamente para SAMU 192.

#### Camada 2 — CLÍNICA

Detecta pedidos de diagnóstico, dosagem ou tratamento médico.

```python
CLINICA = [
    r"qual(a)?\s+(dose|dosagem|quantidade)\s+(de|do|da)",
    r"posso\s+tomar\s+",
    r"remédio\s+para\s+(minha|meu|a)\s+",
    r"diagnostico|diagnose|tratamento\s+de",
]
```

**Resposta:** "Não posso fornecer orientações médicas. Consulte um profissional de saúde."

#### Camada 3 — AUTOMEDICAÇÃO

Detecta solicitações de recomendação de medicamentos, bulas ou interações.

```python
AUTOMEDICACAO = [
    r"(recomendar?|indicar?)\s+(um\s+)?(remédio|medicamento)",
    r"qual\s+(remédio|medicamento)\s+(é\s+bom|devo)",
    r"bula\s+d(o|a|e)\s+",
    r"interação\s+(medicamentosa|entre)",
]
```

**Resposta:** Esclarece que o EcoBot não substitui orientação farmacêutica ou médica.

#### Camada 4 — DADOS PESSOAIS / PROMPT INJECTION / FORA DE ESCOPO

Bloco combinado para:

- Pedidos de CPF, RG, endereço, dados bancários
- Tentativas de injeção de prompt (`ignore previous instructions`, `roleplay as`, etc.)
- Tópicos fora do escopo (receitas, política, entretenimento, etc.)

**Filtro de Saída:** Após a resposta do LLM, um filtro verifica se a resposta contém algum padrão proibido (ex: o LLM tentou ignorar as restrições do system prompt).

---

### 7. Indexação de Documentos (`ia/app/ingest.py`)

**O que faz:** CLI que lê os documentos-base e os indexa no PGVector para uso pelo retriever.

**Documentos indexados** (`ia/docs/`):
| Arquivo | Conteúdo |
|---------|---------|
| `decreto-10388-2020.txt` | Decreto presidencial sobre logística reversa de medicamentos |
| `faq-ecomed.txt` | Perguntas frequentes do próprio EcoMed |
| `formas-farmaceuticas-medicamentos.txt` | Tipos de formas farmacêuticas e como descartar |
| `guia-cidadao-descarte.txt` | Guia prático para o cidadão sobre descarte |
| `impacto-ambiental.txt` | Impactos do descarte incorreto no meio ambiente |
| `legislacao-anvisa-rss.txt` | Resolução da ANVISA sobre Resíduos de Serviços de Saúde |
| `lei-12305-2010-pnrs.txt` | PNRS — Política Nacional de Resíduos Sólidos |
| `tipos-residuos-farmaceuticos.txt` | Classificação dos resíduos farmacêuticos |

**Parâmetros de chunking:**

```python
CHUNK_SIZE = 400      # caracteres por chunk
CHUNK_OVERLAP = 50    # sobreposição entre chunks (preserva contexto de fronteira)
COLLECTION_NAME = "ecomed_docs"
```

**Como executar:**

```bash
# Indexar (ou reindexar) todos os documentos
docker exec ecomed-ia python -m app.ingest

# Reiniciar coleção do zero (apaga tudo e reindexar)
docker exec ecomed-ia python -m app.ingest --reset
```

---

### 8. Endpoint de Chat (`ia/app/routers/chat.py`)

**URL:** `POST /chat`  
**Auth:** Bearer token (`IA_SERVICE_TOKEN`) — apenas o Next.js pode chamar

```python
class ChatRequest(BaseModel):
    pergunta: str = Field(min_length=3, max_length=1000)

class ChatResponse(BaseModel):
    resposta: str
```

O endpoint **não** é exposto publicamente. O flujo é:

```
Usuário → POST /api/chat (Next.js)
               ↓ Bearer IA_SERVICE_TOKEN
           POST /chat (FastAPI interno)
```

---

## Fluxo Completo de uma Pergunta

```
1. Usuário digita: "Como descartar insulina vencida?"

2. Next.js (Hono - chat.ts):
   - Rate limit por IP (checkRateLimit)
   - Valida: pergunta entre 3 e 1000 chars
   - Encaminha para FastAPI com Bearer token
   - Timeout de 55 segundos

3. FastAPI (routers/chat.py):
   - Verifica Bearer token
   - Chama rag.perguntar("Como descartar insulina vencida?")

4. Guardrails (services/guardrails.py):
   - Verifica EMERGÊNCIA: não detectado
   - Verifica CLÍNICA: não detectado
   - Verifica AUTOMEDICAÇÃO: não detectado
   - Verifica FORA_ESCOPO: não detectado
   → Pergunta aprovada, passa para o RAG

5. Embeddings (Ollama nomic-embed-text):
   - Transforma "Como descartar insulina vencida?" em vetor de 768 dimensões
   - Tempo: ~50ms (CPU, local)

6. VectorStore PGVector:
   - Busca os 2 chunks mais semanticamente próximos da pergunta
   - Retorna trechos sobre descarte de insumos domiciliares e resíduos farmacêuticos
   - Tempo: ~20ms (query SQL no Postgres)

7. LLM Groq (llama-3.1-8b-instant):
   - Recebe: [system prompt] + [2 chunks de contexto] + [pergunta]
   - Gera resposta sobre descarte correto de insulina
   - Tempo: ~1.5s (API Groq)

8. Filtro de saída:
   - Verifica se a resposta contém padrões proibidos
   → Resposta aprovada

9. Next.js:
   - Repassa resposta ao usuário
   - Gera messageId (UUID) para feedback posterior
   - Credita 1 EcoCoin ao usuário (missão ECOBOT_QUESTION)

10. Usuário recebe:
    "Insulina e outros produtos biológicos devem ser descartados em
    unidades de saúde ou farmácias participantes do programa de
    logística reversa. Nunca jogue no lixo doméstico ou vaso sanitário.
    [...]"

    + botões 👍/👎 para feedback
```

---

## Variáveis de Ambiente do Microserviço IA

```env
# LLM
GROQ_API_KEY=gsk_...              # API key do Groq

# Embeddings
OLLAMA_BASE_URL=http://localhost:11434

# Banco de dados (PGVector)
DATABASE_URL=postgresql://user:pass@host:5432/db

# Segurança
IA_SERVICE_TOKEN=...              # Bearer token para autenticação do App

# CORS
CORS_ORIGINS=http://localhost:3000,https://ecomed.eco.br
```

---

## Métricas e Performance

| Operação               | Tempo Típico |
| ---------------------- | ------------ |
| Guardrails (regex)     | < 1ms        |
| Embedding (Ollama CPU) | 40–80ms      |
| Busca PGVector (k=2)   | 5–30ms       |
| Geração LLM (Groq)     | 1–2s         |
| **Total E2E**          | **~2s**      |

> **Referência anterior:** Ollama rodando Llama3 em CPU no VPS levava 100–180s por resposta. A migração para Groq reduziu a latência em **98%**.

---

## Deploy do Microserviço

O microserviço é containerizado separadamente do app Next.js:

```bash
# Build
docker build -t ecomed-ia:latest ./ia

# Run
docker run -d \
  --name ecomed-ia \
  --env-file /opt/ecomed/.env.ia \
  -p 8000:8000 \
  ecomed-ia:latest

# Verificar saúde
curl http://localhost:8000/health
# {"status":"ok","service":"ecomed-ia","version":"1.0.0"}
```

---

## Diagrama de Arquitetura Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                         EcoMed VPS                               │
│                                                                   │
│  ┌──────────────────┐        ┌──────────────────────────────┐   │
│  │   ecomed-web     │        │        ecomed-ia              │   │
│  │   (Next.js)      │        │        (FastAPI)              │   │
│  │   porta 3010     │        │        porta 8000             │   │
│  │                  │        │                              │   │
│  │  Hono /api/chat ─┼──────→ │ POST /chat                   │   │
│  │                  │ Bearer │  ├─ Guardrails (regex)        │   │
│  │                  │ Token  │  ├─ Ollama Embeddings ──────→ │   │
│  └──────────────────┘        │  ├─ PGVector Retrieval ─────→ │   │
│                              │  ├─ Groq LLM API ────────────┼───→ Groq Cloud
│  ┌──────────────────┐        │  └─ Output Filter             │   │
│  │   PostgreSQL     │ ←──────┼──────────────────────────────┘   │
│  │   (Prisma +      │        │                                   │
│  │    PGVector)     │        │  ┌──────────────────────────┐    │
│  └──────────────────┘        │  │  Ollama (nomic-embed-text)│    │
│                              │  │  localhost:11434           │    │
│                              │  └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```
