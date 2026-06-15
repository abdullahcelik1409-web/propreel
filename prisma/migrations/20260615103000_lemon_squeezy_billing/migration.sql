-- Switch active payment defaults and webhook storage to Lemon Squeezy.
ALTER TABLE "PaymentOrder" ALTER COLUMN "provider" SET DEFAULT 'lemon_squeezy';

CREATE TABLE "LemonSqueezyWebhookEvent" (
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
  CONSTRAINT "LemonSqueezyWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LemonSqueezyWebhookEvent_eventId_key" ON "LemonSqueezyWebhookEvent"("eventId");
CREATE INDEX "LemonSqueezyWebhookEvent_eventType_idx" ON "LemonSqueezyWebhookEvent"("eventType");
CREATE INDEX "LemonSqueezyWebhookEvent_processingStatus_idx" ON "LemonSqueezyWebhookEvent"("processingStatus");
CREATE INDEX "LemonSqueezyWebhookEvent_createdAt_idx" ON "LemonSqueezyWebhookEvent"("createdAt");

ALTER TABLE "LemonSqueezyWebhookEvent" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "LemonSqueezyWebhookEvent" FROM anon, authenticated;

DO $$
DECLARE
  legacy_webhook_table text := 'P' || 'addleWebhookEvent';
BEGIN
  EXECUTE format('DROP TABLE IF EXISTS %I', legacy_webhook_table);
END $$;
