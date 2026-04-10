-- CreateEnum
CREATE TYPE "RewardStatus" AS ENUM ('PENDING', 'DELIVERED', 'CANCELLED');

-- AlterTable: migrar coluna status de String para enum RewardStatus
ALTER TABLE "UserReward"
  ALTER COLUMN "status" TYPE "RewardStatus"
    USING "status"::"RewardStatus",
  ALTER COLUMN "status" SET DEFAULT 'PENDING'::"RewardStatus";
