-- Migration: add_chat_feedback
-- Governança de IA — tabela de feedback das respostas do EcoBot

CREATE TABLE "ChatFeedback" (
    "id"          TEXT NOT NULL,
    "userId"      TEXT,
    "messageId"   TEXT NOT NULL,
    "pergunta"    TEXT NOT NULL,
    "resposta"    TEXT NOT NULL,
    "rating"      TEXT NOT NULL,
    "comment"     TEXT,
    "ragScore"    DOUBLE PRECISION,
    "reviewed"    BOOLEAN NOT NULL DEFAULT false,
    "actionTaken" TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatFeedback_pkey" PRIMARY KEY ("id")
);

-- Índices para queries do dashboard de governança
CREATE INDEX "ChatFeedback_createdAt_idx" ON "ChatFeedback"("createdAt");
CREATE INDEX "ChatFeedback_rating_reviewed_idx" ON "ChatFeedback"("rating", "reviewed");

-- Foreign key opcional (userId pode ser null para usuários não autenticados)
ALTER TABLE "ChatFeedback"
    ADD CONSTRAINT "ChatFeedback_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
