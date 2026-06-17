-- Add provider-agnostic webhook storage and make payment order idempotency provider-scoped.

ALTER TABLE "PaymentOrder" ALTER COLUMN "provider" SET DEFAULT 'lemon';

DROP INDEX IF EXISTS "PaymentOrder_provider_providerOrderId_idx";
DROP INDEX IF EXISTS "PaymentOrder_providerOrderId_key";

CREATE UNIQUE INDEX IF NOT EXISTS "PaymentOrder_provider_providerOrderId_key"
  ON "PaymentOrder"("provider", "providerOrderId");

CREATE TABLE IF NOT EXISTS "PaymentWebhookEvent" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "processingStatus" TEXT NOT NULL DEFAULT 'received',
  "rawPayload" JSONB NOT NULL,
  "errorMessage" TEXT,
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaymentWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PaymentWebhookEvent_provider_eventId_key"
  ON "PaymentWebhookEvent"("provider", "eventId");

CREATE INDEX IF NOT EXISTS "PaymentWebhookEvent_provider_processingStatus_idx"
  ON "PaymentWebhookEvent"("provider", "processingStatus");

CREATE INDEX IF NOT EXISTS "PaymentWebhookEvent_createdAt_idx"
  ON "PaymentWebhookEvent"("createdAt");

ALTER TABLE "PaymentWebhookEvent" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "PaymentWebhookEvent" FROM anon, authenticated;
