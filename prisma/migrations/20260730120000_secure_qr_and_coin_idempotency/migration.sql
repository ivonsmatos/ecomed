ALTER TABLE "Checkin" ADD COLUMN "checkinDay" TIMESTAMP(3);
ALTER TABLE "Checkin" ADD COLUMN "qrNonce" TEXT;
UPDATE "Checkin" SET "checkinDay" = date_trunc('day', "createdAt");
ALTER TABLE "Checkin" ALTER COLUMN "checkinDay" SET NOT NULL;
ALTER TABLE "Checkin" ALTER COLUMN "checkinDay" SET DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "Checkin_userId_pointId_checkinDay_key"
  ON "Checkin"("userId", "pointId", "checkinDay");
CREATE UNIQUE INDEX "Checkin_userId_qrNonce_key"
  ON "Checkin"("userId", "qrNonce");

ALTER TABLE "CoinTransaction" ADD COLUMN "idempotencyKey" TEXT;
CREATE UNIQUE INDEX "CoinTransaction_idempotencyKey_key"
  ON "CoinTransaction"("idempotencyKey");

ALTER TABLE "PasswordResetToken" RENAME COLUMN "token" TO "tokenHash";
ALTER INDEX "PasswordResetToken_token_key" RENAME TO "PasswordResetToken_tokenHash_key";

ALTER TABLE "User" ADD COLUMN "adultConfirmedAt" TIMESTAMP(3);

ALTER TABLE "ChatFeedback"
  ADD COLUMN "anonymizedAt" TIMESTAMP(3),
  ADD COLUMN "expiresAt" TIMESTAMP(3),
  ADD COLUMN "retentionPolicyVersion" TEXT NOT NULL DEFAULT '2026-07';
CREATE UNIQUE INDEX "ChatFeedback_messageId_key" ON "ChatFeedback"("messageId");
CREATE INDEX "ChatFeedback_expiresAt_idx" ON "ChatFeedback"("expiresAt");

ALTER TABLE "AiPromptLog"
  ADD COLUMN "anonymizedAt" TIMESTAMP(3),
  ADD COLUMN "expiresAt" TIMESTAMP(3),
  ADD COLUMN "retentionPolicyVersion" TEXT NOT NULL DEFAULT '2026-07';
CREATE INDEX "AiPromptLog_expiresAt_idx" ON "AiPromptLog"("expiresAt");
