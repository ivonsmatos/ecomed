# EcoMed IA — Microserviço de Chat Educativo

Microserviço Python responsável pelo **EcoBot**: assistente educativo sobre descarte correto de medicamentos no Brasil.

---

## Visão Geral

O EcoBot responde a perguntas sobre **descarte de medicamentos e ciências ambientais aplicadas a fármacos**:

**Descarte e logística reversa:**

- Como e onde descartar medicamentos vencidos ou sem uso
- Localização de pontos de coleta (farmácias, UBS, ecopontos)
- Legislação brasileira: PNRS (Lei 12.305/2010), Decreto 10.388/2020, RDC 222/2018 ANVISA

**Ciências ambientais relacionadas a medicamentos:**

- Contaminação de rios e lençóis freáticos por micropoluentes farmacêuticos
- Resistência antimicrobiana ambiental gerada pelo descarte inadequado de antibióticos
- Disruptores endócrinos (hormônios sintéticos) e impacto na fauna aquática
- Limitações das ETEs (Estações de Tratamento de Esgoto) para fármacos
- Bioacumulação, ecotoxicologia e biomagnificação de resíduos farmacêuticos
- Sustentabilidade e economia circular na indústria farmacêutica
- Abordagem "One Health": interconexão entre saúde humana, animal e ambiental

Ele **nunca** indica, recomenda ou orienta o uso de medicamentos.

---

## Stack

| Componente       | Tecnologia                                          | Decisão                                                               |
| ---------------- | --------------------------------------------------- | --------------------------------------------------------------------- |
| **API**          | FastAPI + uvicorn                                   | Assíncrono, tipado, mínimo overhead                                   |
| **LLM**          | Groq — Llama 4 Scout 17B                            | <2s de latência, custo baixíssimo (~$0.11/M tokens), sem GPU própria  |
| **Embeddings**   | FastEmbed — `paraphrase-multilingual-MiniLM-L12-v2` | Roda dentro do container, multilingual (PT/EN), 384 dimensões, ~45 MB |
| **Vector Store** | PGVector via `langchain-postgres`                   | Reaproveita o PostgreSQL já existente, sem infra extra                |
| **Orquestração** | LangChain (langchain-community, langchain-core)     | Chunking, indexação e pipeline RAG                                    |
| **Autenticação** | Bearer token (`IA_SERVICE_TOKEN`)                   | Garante que só o Next.js acesse o endpoint                            |

### Por que Groq em vez de Ollama/local?

O modelo Llama 3 rodando em CPU levava **>100 segundos** por resposta. Com Groq, a latência caiu para **<2 segundos** usando infraestrutura de hardware especializado (LPU). O custo é praticamente zero para o volume atual.

---

## Arquitetura do Pipeline

```
POST /chat  {pergunta, session_id}
        │
        ▼
┌──────────────────────────────────────────────────┐
│  Guardrail de Entrada  (guardrails.py)           │
│                                                  │
│  Camada 1 — EMERGÊNCIA                           │
│    "ingeri", "overdose", "intoxicação"...        │
│    → Resposta imediata: SAMU 192 / CIT / CVV     │
│                                                  │
│  Camada 2 — PROMPT INJECTION                     │
│    "ignore instruções", "you are now", "DAN"...  │
│    → Bloqueio silencioso                         │
│                                                  │
│  Camada 3 — CLÍNICA                              │
│    "dose", "dosagem", "diagnóstico", "sintomas"  │
│    → Redireciona para farmacêutico/médico        │
│                                                  │
│  Camada 4 — AUTOMEDICAÇÃO                        │
│    "qual remédio", "me recomenda", "posso tomar" │
│    → Redireciona para profissional de saúde      │
│                                                  │
│  Camada 5 — DADOS PESSOAIS                       │
│    "CPF", "RG", "meu endereço"...               │
│    → Recusa e instrui uso do mapa (sem dados)    │
└─────────────────────┬────────────────────────────┘
                      │ pergunta permitida
                      ▼
┌──────────────────────────────────────────────────┐
│  RAG — Recuperação de Contexto  (rag.py)         │
│                                                  │
│  1. FastEmbed gera embedding da pergunta         │
│  2. PGVector busca k=4 chunks mais similares     │
│     na coleção "ecomed_docs"                     │
│  3. Monta contexto concatenando os chunks        │
└─────────────────────┬────────────────────────────┘
                      │ contexto recuperado
                      ▼
┌──────────────────────────────────────────────────┐
│  Montagem de Prompt                              │
│                                                  │
│  system: SYSTEM_PROMPT + {contexto}              │
│  history: últimas 8 trocas do session_id         │
│  user: {pergunta}                                │
└─────────────────────┬────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────┐
│  LLM — Groq (Llama 4 Scout 17B)                 │
│  temperature=0.2, max_tokens=512                 │
└─────────────────────┬────────────────────────────┘
                      │ resposta bruta
                      ▼
┌──────────────────────────────────────────────────┐
│  Filtro de Saída  (guardrails.py)                │
│                                                  │
│  1. Conselho médico explícito detectado?         │
│     ("recomendo que tome X", "tome 2 comprimidos")│
│     → Fallback completo                          │
│                                                  │
│  2. Dosagem numérica detectada?                  │
│     ("500mg", "2 comprimidos por dia")           │
│     → Adiciona disclaimer de saúde              │
│                                                  │
│  3. Nome de medicamento + verbo de uso?          │
│     ("tome dipirona", "use rivotril")            │
│     → Fallback completo                          │
└─────────────────────┬────────────────────────────┘
                      │
                      ▼
        {resposta, model, ragScore}
```

**Nota de design:** nomes de medicamentos são **permitidos** no contexto de descarte (é o escopo do bot). O filtro de saída só bloqueia quando há combinação de nome + verbo de recomendação/uso.

---

## Estrutura de Arquivos

```
ia/
├── app/
│   ├── main.py               # App FastAPI, lifespan (inicializa RAGService)
│   ├── ingest.py             # CLI para indexar ia/docs/ no PGVector
│   ├── routers/
│   │   ├── chat.py           # POST /chat — endpoint principal
│   │   ├── embed.py          # POST /embed — debug de embeddings
│   │   └── health.py         # GET /health — health check Docker
│   └── services/
│       ├── rag.py            # RAGService: embeddings + PGVector + Groq + sessão
│       └── guardrails.py     # Filtros de entrada e saída (regex + lógica)
├── docs/                     # Base de conhecimento em texto plano
│   └── treinamento_ecobot.txt  # Q&A sobre descarte, legislação, FAQ
├── Dockerfile                # python:3.12-slim, FastEmbed pré-baixado
├── requirements.txt          # Dependências Python
└── .env.example              # Variáveis necessárias (sem valores)
```

---

## Variáveis de Ambiente

Copie `.env.example` para `.env` e preencha:

```env
# LLM
GROQ_API_KEY=gsk_...
GROQ_MODEL=meta-llama/llama-4-scout-17b-16e-instruct

# Vector store (mesmo banco do Next.js)
DATABASE_URL=postgresql://user:senha@host:5432/ecomed

# Autenticação do endpoint /chat (deve ser igual ao IA_SERVICE_TOKEN do Next.js)
IA_SERVICE_TOKEN=<string secreta longa e aleatória>
```

---

## Base de Conhecimento

Os documentos em `ia/docs/*.txt` são indexados no PGVector com embeddings gerados pelo FastEmbed.

**Para adicionar ou atualizar conteúdo:**

1. Edite ou crie um arquivo `.txt` em `ia/docs/`
2. Pare o servidor, reindexe e reinicie:

```bash
# Pare o container da API
docker stop ecomed-ia && docker rm ecomed-ia

# Execute o ingest num container one-shot (sem conflito de memória)
docker run --rm --network ia_default \
  --env-file /opt/ecomed/ia/.env \
  ia-api:latest python -m app.ingest --reset

# Suba o servidor novamente
docker run -d --name ecomed-ia --restart unless-stopped \
  --network ia_default \
  -p 127.0.0.1:8002:8000 \
  --env-file /opt/ecomed/ia/.env \
  ia-api:latest
```

**Por que rodar o ingest com o servidor parado?**
O FastEmbed carrega o modelo ONNX em memória. Se o servidor e o ingest rodarem ao mesmo tempo, ambos tentam carregar o modelo, competindo por CPU/memória e o ingest é morto pelo SO (SIGKILL).

**Formato dos documentos:**
Cada linha no `.txt` pode ser uma pergunta/resposta, um parágrafo explicativo ou um trecho de legislação. O chunker divide em pedaços de ~800 chars com 100 de overlap, preservando contexto.

---

## Docker

### Build

```bash
docker build -t ia-api:latest .
```

O Dockerfile:

1. Parte de `python:3.12-slim`
2. Instala dependências de sistema (`libpq5` para psycopg3)
3. Instala pacotes Python via `requirements.txt`
4. **Pré-baixa o modelo FastEmbed** na camada do build (evita cold-start)
5. Copia `app/` e `docs/`
6. Define healthcheck (`GET /health`)
7. Sobe uvicorn na porta 8000

A camada de download do modelo (~45 MB) é **cacheada por Docker** enquanto `requirements.txt` não mudar, tornando rebuilds subsequentes rápidos.

### Rede

O container usa a rede Docker `ia_default`, compartilhada com `ecomed-web` e `ecomed-pgvector`. O Next.js acessa o EcoBot via `http://ecomed-ia:8000/chat` internamente. Externamente, a porta 8002 fica vinculada apenas ao `127.0.0.1` (não exposta diretamente à internet).

---

## Memória de Sessão

O `session_id` é enviado pelo Next.js como `userId ?? ip`. O RAGService mantém um dicionário em memória:

```
_sessions = {
  "user-abc123": [
    {"role": "user", "content": "Como descartar dipirona?"},
    {"role": "assistant", "content": "..."},
    ...
  ]
}
```

As últimas **8 trocas (16 mensagens)** são mantidas por sessão. O histórico é incluído no prompt para dar continuidade à conversa. **Não há persistência em disco** — o histórico é perdido ao reiniciar o container.

---

## Autenticação

O endpoint `POST /chat` exige header `Authorization: Bearer <IA_SERVICE_TOKEN>`. O token é configurado via variável de ambiente e deve ser o mesmo nos dois serviços (Next.js e Python). Sem o token correto, a resposta é `401 Unauthorized`.

---

## Monitoramento

```bash
# Logs em tempo real
docker logs ecomed-ia -f

# Cada resposta registra:
# [chat] latency=1843ms | rag_score=0.451 | model=meta-llama/... | sessao=user-xxx
```

O Next.js persiste cada chamada na tabela `AiPromptLog` do PostgreSQL, incluindo latência, pergunta, resposta, model, ragScore e status (`ok`, `timeout`, `error`, `rate_limited`).
