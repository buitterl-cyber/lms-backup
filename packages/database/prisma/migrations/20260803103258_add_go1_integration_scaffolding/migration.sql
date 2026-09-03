-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "lastSyncedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ProviderLearnerLink" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "providerKey" TEXT NOT NULL,
    "externalLearnerId" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderLearnerLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderWebhookEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "connectionId" TEXT,
    "providerKey" TEXT NOT NULL,
    "externalEventId" TEXT,
    "eventType" TEXT,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'received',
    "error" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "ProviderWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProviderLearnerLink_tenantId_idx" ON "ProviderLearnerLink"("tenantId");

-- CreateIndex
CREATE INDEX "ProviderLearnerLink_connectionId_externalLearnerId_idx" ON "ProviderLearnerLink"("connectionId", "externalLearnerId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderLearnerLink_userId_connectionId_key" ON "ProviderLearnerLink"("userId", "connectionId");

-- CreateIndex
CREATE INDEX "ProviderWebhookEvent_tenantId_idx" ON "ProviderWebhookEvent"("tenantId");

-- CreateIndex
CREATE INDEX "ProviderWebhookEvent_connectionId_externalEventId_idx" ON "ProviderWebhookEvent"("connectionId", "externalEventId");

-- AddForeignKey
ALTER TABLE "ProviderLearnerLink" ADD CONSTRAINT "ProviderLearnerLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderLearnerLink" ADD CONSTRAINT "ProviderLearnerLink_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "ProviderConnection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderWebhookEvent" ADD CONSTRAINT "ProviderWebhookEvent_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "ProviderConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
