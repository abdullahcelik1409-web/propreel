-- Add multi-image video generation metadata without changing the existing basic flow.
ALTER TABLE "Video" ADD COLUMN "videoMode" TEXT NOT NULL DEFAULT 'basic';
ALTER TABLE "Video" ADD COLUMN "selectedImageIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Video" ADD COLUMN "selectedImageUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Video" ADD COLUMN "providerCostEstimate" DOUBLE PRECISION;
ALTER TABLE "Video" ADD COLUMN "scenePlan" JSONB;
ALTER TABLE "Video" ADD COLUMN "providerRequests" JSONB;

CREATE INDEX "Video_videoMode_idx" ON "Video"("videoMode");
