-- Add Paddle Billing fields while preserving historical PaymentOrder rows.
ALTER TABLE "PaymentOrder" ALTER COLUMN "provider" SET DEFAULT 'paddle';

ALTER TABLE "PaymentOrder"
  ADD COLUMN "providerCustomerId" TEXT,
  ADD COLUMN "providerSubscriptionId" TEXT,
  ADD COLUMN "providerProductId" TEXT,
  ADD COLUMN "providerPriceId" TEXT,
  ADD COLUMN "internalOrderId" TEXT,
  ADD COLUMN "taxAmount" TEXT;

CREATE INDEX "PaymentOrder_providerPriceId_idx" ON "PaymentOrder"("providerPriceId");
CREATE INDEX "PaymentOrder_internalOrderId_idx" ON "PaymentOrder"("internalOrderId");

CREATE TABLE "PaddleWebhookEvent" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3),
  "processedAt" TIMESTAMP(3),
  "processingStatus" TEXT NOT NULL DEFAULT 'received',
  "payload" JSONB NOT NULL,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaddleWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaddleWebhookEvent_eventId_key" ON "PaddleWebhookEvent"("eventId");
CREATE INDEX "PaddleWebhookEvent_eventType_idx" ON "PaddleWebhookEvent"("eventType");
CREATE INDEX "PaddleWebhookEvent_processingStatus_idx" ON "PaddleWebhookEvent"("processingStatus");
CREATE INDEX "PaddleWebhookEvent_createdAt_idx" ON "PaddleWebhookEvent"("createdAt");

ALTER TABLE "PaddleWebhookEvent" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "PaddleWebhookEvent" FROM anon, authenticated;
