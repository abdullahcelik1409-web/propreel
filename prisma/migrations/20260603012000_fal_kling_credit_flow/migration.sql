-- Add Fal/Kling generation metadata to the existing SaaS video records.
ALTER TABLE "Video" ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'fal';
ALTER TABLE "Video" ADD COLUMN "model" TEXT;
ALTER TABLE "Video" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "Video" ADD COLUMN "prompt" TEXT;
ALTER TABLE "Video" ADD COLUMN "negativePrompt" TEXT;
ALTER TABLE "Video" ADD COLUMN "creditsCharged" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Video" ADD COLUMN "errorMessage" TEXT;
ALTER TABLE "Video" ADD COLUMN "rawProviderResponse" JSONB;

-- Store credit movement references and structured provider metadata.
ALTER TABLE "CreditEvent" ADD COLUMN "referenceId" TEXT;
ALTER TABLE "CreditEvent" ADD COLUMN "metadata" JSONB;

CREATE INDEX "Video_provider_idx" ON "Video"("provider");
CREATE INDEX "CreditEvent_referenceId_idx" ON "CreditEvent"("referenceId");
