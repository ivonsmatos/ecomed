-- AddColumn: referralCode (código único gerado para cada usuário)
ALTER TABLE "User" ADD COLUMN "referralCode" TEXT;

-- Preencher códigos únicos para usuários existentes (usando gen_random_uuid sem hífens)
UPDATE "User" SET "referralCode" = REPLACE(gen_random_uuid()::text, '-', '') WHERE "referralCode" IS NULL;

-- Tornar NOT NULL e UNIQUE após preencher
ALTER TABLE "User" ALTER COLUMN "referralCode" SET NOT NULL;
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- AddColumn: referredById (quem indicou este usuário)
ALTER TABLE "User" ADD COLUMN "referredById" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
