-- Migration: add_ai_prompt_log
-- Observabilidade de IA — log estruturado de cada chamada ao EcoBot

CREATE TABLE "AiPromptLog" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT,
    "messageId" TEXT NOT NULL,
    "prompt"    TEXT NOT NULL,
    "response"  TEXT,
    "model"     TEXT,
    "latencyMs" INTEGER,
    "ragScore"  DOUBLE PRECISION,
    "status"    TEXT NOT NULL,
    "errorCode" TEXT,
    "ip"        TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiPromptLog_pkey" PRIMARY KEY ("id")
);

-- Unicidade por messageId (mesmo identificador devolvido ao cliente)
CREATE UNIQUE INDEX "AiPromptLog_messageId_key" ON "AiPromptLog"("messageId");

-- Índices de consulta para o dashboard de governança/observabilidade
CREATE INDEX "AiPromptLog_createdAt_idx" ON "AiPromptLog"("createdAt");
CREATE INDEX "AiPromptLog_userId_idx" ON "AiPromptLog"("userId");
CREATE INDEX "AiPromptLog_status_createdAt_idx" ON "AiPromptLog"("status", "createdAt");

-- FK opcional (preserva log mesmo se o usuário for removido)
ALTER TABLE "AiPromptLog"
    ADD CONSTRAINT "AiPromptLog_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
