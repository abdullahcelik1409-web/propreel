import { prisma } from "./prisma";
import {
  FAL_VIDEO_MODEL_ID,
  VIDEO_MODE_BASIC,
  VIDEO_GENERATION_CREDIT_COST,
  VIDEO_GENERATION_DEBIT_ACTION,
  VIDEO_GENERATION_DEBIT_NOTE,
  VIDEO_GENERATION_DURATION_SECONDS,
  VIDEO_GENERATION_REFUND_ACTION,
  VIDEO_GENERATION_REFUND_NOTE,
} from "./videoConfig";

export function createInsufficientCreditsError(currentCredits = 0) {
  const error = new Error("Insufficient credits");
  error.status = 402;
  error.payload = {
    success: false,
    error: "Insufficient credits",
    requiredCredits: VIDEO_GENERATION_CREDIT_COST,
    currentCredits,
  };
  return error;
}

export async function reserveVideoGenerationCredits(tx, userId, creditCost = VIDEO_GENERATION_CREDIT_COST) {
  const updated = await tx.user.updateMany({
    where: {
      id: userId,
      credits: { gte: creditCost },
    },
    data: {
      credits: { decrement: creditCost },
    },
  });

  if (updated.count === 0) {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });
    const error = createInsufficientCreditsError(user?.credits || 0);
    error.payload.requiredCredits = creditCost;
    throw error;
  }
}

export async function recordVideoGenerationDebit(tx, {
  userId,
  videoId,
  creditCost = VIDEO_GENERATION_CREDIT_COST,
  note = VIDEO_GENERATION_DEBIT_NOTE,
  model = FAL_VIDEO_MODEL_ID,
  durationSeconds = VIDEO_GENERATION_DURATION_SECONDS,
  videoMode = VIDEO_MODE_BASIC,
}) {
  return tx.creditEvent.create({
    data: {
      userId,
      amount: -creditCost,
      action: VIDEO_GENERATION_DEBIT_ACTION,
      note,
      referenceId: videoId,
      metadata: {
        provider: "fal",
        model,
        durationSeconds,
        videoMode,
      },
    },
  });
}

export async function refundVideoGenerationCredits({
  userId,
  videoId,
  creditCost = VIDEO_GENERATION_CREDIT_COST,
  model = FAL_VIDEO_MODEL_ID,
  durationSeconds = VIDEO_GENERATION_DURATION_SECONDS,
  videoMode = VIDEO_MODE_BASIC,
  errorMessage,
  rawProviderResponse,
}) {
  return prisma.$transaction(async (tx) => {
    const existingRefund = await tx.creditEvent.findFirst({
      where: {
        userId,
        referenceId: videoId,
        action: VIDEO_GENERATION_REFUND_ACTION,
      },
    });

    if (existingRefund) {
      return tx.video.findUnique({ where: { id: videoId } });
    }

    await tx.user.update({
      where: { id: userId },
      data: { credits: { increment: creditCost } },
    });

    await tx.creditEvent.create({
      data: {
        userId,
        amount: creditCost,
        action: VIDEO_GENERATION_REFUND_ACTION,
        note: VIDEO_GENERATION_REFUND_NOTE,
        referenceId: videoId,
        metadata: {
          provider: "fal",
          model,
          durationSeconds,
          videoMode,
        },
      },
    });

    return tx.video.update({
      where: { id: videoId },
      data: {
        status: "refunded",
        creditsCharged: 0,
        errorMessage: errorMessage || "Fal.ai video generation failed",
        rawProviderResponse,
      },
    });
  });
}
