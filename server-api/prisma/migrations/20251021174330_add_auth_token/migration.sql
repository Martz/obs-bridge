-- AlterTable
ALTER TABLE "obs_instances" ADD COLUMN "apiToken" TEXT;
ALTER TABLE "obs_instances" ADD COLUMN "tokenCreatedAt" DATETIME;
ALTER TABLE "obs_instances" ADD COLUMN "tokenLastUsedAt" DATETIME;

-- CreateIndex
CREATE UNIQUE INDEX "obs_instances_apiToken_key" ON "obs_instances"("apiToken");

-- CreateIndex
CREATE INDEX "obs_instances_apiToken_idx" ON "obs_instances"("apiToken");
