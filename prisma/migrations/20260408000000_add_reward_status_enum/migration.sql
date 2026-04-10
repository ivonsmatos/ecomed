-- CreateEnum (idempotente: limpa estado parcial se existir)
DROP TYPE IF EXISTS "RewardStatus";
CREATE TYPE "RewardStatus" AS ENUM ('PENDING', 'DELIVERED', 'CANCELLED');

-- AlterTable: migrar coluna status de String para enum RewardStatus
-- 1. Remover default atual antes de alterar o tipo
ALTER TABLE "UserReward" ALTER COLUMN "status" DROP DEFAULT;

-- 2. Alterar tipo usando USING para converter valores existentes
ALTER TABLE "UserReward"
  ALTER COLUMN "status" TYPE "RewardStatus"
    USING "status"::"RewardStatus";

-- 3. Restaurar default com o tipo correto
ALTER TABLE "UserReward" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"RewardStatus";
