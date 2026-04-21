FROM python:3.12-slim

WORKDIR /app

# Dependências de sistema para psycopg3 (binary wheel)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 curl \
    && rm -rf /var/lib/apt/lists/*

# Instala pacotes Python (camada de cache separada do código)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pré-baixa o modelo FastEmbed para evitar cold-start no primeiro request
# (modelo ~45 MB, multilingual, sem GPU necessária)
RUN python -c "\
from fastembed import TextEmbedding; \
print('Baixando modelo FastEmbed...'); \
list(TextEmbedding('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2').embed(['test'])); \
print('Modelo FastEmbed pronto.')"

# Copia o código da aplicação
COPY app/ ./app/
COPY docs/ ./docs/

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
