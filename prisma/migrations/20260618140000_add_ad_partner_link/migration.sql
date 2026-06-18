-- AlterTable: vínculo de campanha com parceiro cadastrado
ALTER TABLE "AdCampaign" ADD COLUMN "partnerId" TEXT;

-- CreateIndex
CREATE INDEX "AdCampaign_partnerId_idx" ON "AdCampaign"("partnerId");

-- AddForeignKey
ALTER TABLE "AdCampaign" ADD CONSTRAINT "AdCampaign_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
