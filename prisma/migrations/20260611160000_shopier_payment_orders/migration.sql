-- CreateTable
CREATE TABLE "PaymentOrder" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'shopier',
    "providerOrderId" TEXT NOT NULL,
    "providerEventId" TEXT,
    "eventType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'received',
    "userId" TEXT,
    "packageId" TEXT,
    "packageName" TEXT,
    "credits" INTEGER NOT NULL DEFAULT 0,
    "amount" TEXT,
    "currency" TEXT,
    "buyerEmail" TEXT,
    "buyerName" TEXT,
    "creditedAt" TIMESTAMP(3),
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentOrder_providerOrderId_key" ON "PaymentOrder"("providerOrderId");

-- CreateIndex
CREATE INDEX "PaymentOrder_userId_createdAt_idx" ON "PaymentOrder"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentOrder_status_idx" ON "PaymentOrder"("status");

-- CreateIndex
CREATE INDEX "PaymentOrder_packageId_idx" ON "PaymentOrder"("packageId");

-- CreateIndex
CREATE INDEX "PaymentOrder_provider_providerOrderId_idx" ON "PaymentOrder"("provider", "providerOrderId");

-- AddForeignKey
ALTER TABLE "PaymentOrder" ADD CONSTRAINT "PaymentOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Supabase hardening
ALTER TABLE "PaymentOrder" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "PaymentOrder" FROM anon, authenticated;
