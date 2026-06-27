import { fail, ok } from "@/lib/api";
import { checkJobStatus, getResult, getVideoUrlFromResult } from "@/lib/falVideoService";
import { mergeProviderVideoClipsWithXfadeFallback } from "@/lib/videoMergeService";
import { composePremiumVideoClips } from "@/lib/premiumCompositionService";
import { addBackgroundAudioToFinalVideo } from "@/lib/videoAudioService";
import { addTextOverlaysToFinalVideo } from "@/lib/videoTextOverlayService";
import { addOutputCanvasToFinalVideo } from "@/lib/videoCanvasService";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { refundVideoGenerationCredits } from "@/lib/videoCreditService";
import {
  FAL_MULTI_IMAGE_VIDEO_MODEL_ID,
  FAL_VIDEO_MODEL_ID,
  VIDEO_MODE_ULTRA_CINEMATIC,
  VIDEO_GENERATION_CREDIT_COST,
  VIDEO_MODE_MULTI_IMAGE,
  premiumVideoConfig,
} from "@/lib/videoConfig";

function normalizeFalStatus(status) {
  const value = String(status?.status || status?.state || "").toLowerCase();
  if (["completed", "complete", "succeeded", "success"].includes(value)) return "completed";
  if (["failed", "failure", "error", "cancelled", "canceled"].includes(value)) return "failed";
  if (["in_progress", "processing", "running"].includes(value)) return "processing";
  return "pending";
}

function getSafeErrorMessage(error, fallback = "Fal.ai video generation failed") {
  return error?.message || error?.error || String(error || "") || fallback;
}

async function applyRequiredCanvasToProviderClips({ video, providerRequests, filePrefix }) {
  const outputRequests = [];
  for (let index = 0; index < providerRequests.length; index += 1) {
    const request = providerRequests[index];
    const canvas = await addOutputCanvasToFinalVideo({
      video,
      sourceVideoUrl: request.videoUrl,
      shouldApply: Boolean(request.requiresVerticalCanvas),
      storageFileName: `clips/${filePrefix}-${index + 1}-with-canvas.mp4`,
      reason: request.requiresVerticalCanvas ? "non-portrait reference" : "native portrait reference",
    });
    outputRequests.push({
      ...request,
      providerVideoUrl: request.providerVideoUrl || request.videoUrl,
      videoUrl: canvas.finalVideoUrl,
      outputCanvas: canvas,
    });
  }
  return outputRequests;
}

export async function GET(_request, { params }) {
  try {
    const user = await requireUser();
    const { jobId } = await params;
    const video = await prisma.video.findFirst({
      where: { falJobId: jobId, userId: user.id },
    });

    if (!video) return ok({ success: false, error: "Video job not found." }, { status: 404 });
    if (video.status === "completed" || video.status === "refunded" || video.status === "failed") {
      return ok({ success: true, status: video.status, video });
    }

    if (video.videoMode === VIDEO_MODE_ULTRA_CINEMATIC) {
      const providerRequests = Array.isArray(video.providerRequests) ? video.providerRequests : [];
      if (!providerRequests.length) {
        return ok({ success: false, error: "Ultra Cinematic provider requests not found." }, { status: 404 });
      }

      const checkedRequests = [];
      let hasFailed = false;

      for (const request of providerRequests) {
        const requestId = request.requestId;
        let statusResponse = null;
        let currentStatus = "pending";

        if (request.status === "completed" && request.videoUrl) {
          currentStatus = "completed";
        } else {
          try {
            statusResponse = await checkJobStatus(requestId, { model: premiumVideoConfig.modelId });
            currentStatus = normalizeFalStatus(statusResponse);
          } catch (statusError) {
            statusResponse = {
              status: "failed",
              error: getSafeErrorMessage(statusError, "Fal.ai Kling 3 Pro status check failed"),
            };
            currentStatus = "failed";
          }
        }

        let result = request.result || (statusResponse?.error ? { error: statusResponse.error } : null);
        let videoUrl = request.videoUrl || null;

        if (currentStatus === "completed" && !videoUrl) {
          try {
            result = await getResult(requestId, { model: premiumVideoConfig.modelId });
            videoUrl = getVideoUrlFromResult(result);
          } catch (resultError) {
            result = { error: getSafeErrorMessage(resultError, "Fal.ai Kling 3 Pro result fetch failed") };
            currentStatus = "failed";
          }
        }

        if (currentStatus === "failed") hasFailed = true;

        checkedRequests.push({
          ...request,
          status: currentStatus,
          videoUrl,
          result,
          statusResponse,
        });
      }

      if (hasFailed) {
        const refunded = await refundVideoGenerationCredits({
          userId: user.id,
          videoId: video.id,
          creditCost: video.creditsCharged || premiumVideoConfig.creditCost,
          model: video.model || premiumVideoConfig.modelId,
          durationSeconds: video.duration,
          videoMode: video.videoMode,
          errorMessage: "Fal.ai Kling 3 Pro premium video generation failed",
          rawProviderResponse: { providerRequests: checkedRequests },
        });
        return ok({
          success: true,
          status: refunded.status,
          video: refunded,
          refundedCredits: video.creditsCharged || premiumVideoConfig.creditCost,
        });
      }

      const allCompleted = checkedRequests.every((request) => request.status === "completed" && request.videoUrl);
      let updated = video;

      if (allCompleted) {
        try {
          const outputRequests = await applyRequiredCanvasToProviderClips({
            video,
            providerRequests: checkedRequests,
            filePrefix: "premium",
          });
          const composition = await composePremiumVideoClips({
            jobId: video.id,
            generatedClips: outputRequests,
            scenePlan: video.scenePlan,
            overlayData: video.overlays,
          });
          const textOverlayResult = await addTextOverlaysToFinalVideo({
            video,
            silentVideoUrl: composition.finalVideoUrl,
          });
          const audioResult = await addBackgroundAudioToFinalVideo({
            video: { ...video, overlays: textOverlayResult.overlays },
            silentVideoUrl: textOverlayResult.finalVideoUrl,
          });

          updated = await prisma.video.update({
            where: { id: video.id },
            data: {
              status: "completed",
              videoUrl: audioResult.finalVideoUrl,
              providerRequests: outputRequests,
              overlays: audioResult.overlays,
              rawProviderResponse: {
                providerRequests: outputRequests,
                finalVideoUrl: audioResult.finalVideoUrl,
                silentFinalVideoUrl: composition.finalVideoUrl,
                composition,
                canvas: outputRequests.map((request) => request.outputCanvas),
                textOverlayApplied: textOverlayResult.applied,
                textOverlayFailed: textOverlayResult.failed,
                textOverlayError: textOverlayResult.errorMessage || null,
                audioFailed: audioResult.audioFailed,
              },
            },
          });
        } catch (compositionError) {
          updated = await refundVideoGenerationCredits({
            userId: user.id,
            videoId: video.id,
            creditCost: video.creditsCharged || premiumVideoConfig.creditCost,
            model: video.model || premiumVideoConfig.modelId,
            durationSeconds: video.duration,
            videoMode: video.videoMode,
            errorMessage: compositionError?.message || "Ultra Cinematic video composition failed",
            rawProviderResponse: {
              providerRequests: checkedRequests,
              compositionError: compositionError?.message,
            },
          });
        }
      } else {
        updated = await prisma.video.update({
          where: { id: video.id },
          data: {
            status: video.status === "pending" ? "generating_clips" : video.status,
            providerRequests: checkedRequests,
            rawProviderResponse: { providerRequests: checkedRequests },
          },
        });
      }

      return ok({
        success: true,
        status: updated.status,
        video: updated,
        providerRequests: checkedRequests,
        refundedCredits: updated.status === "refunded" ? video.creditsCharged || premiumVideoConfig.creditCost : 0,
      });
    }

    if (video.videoMode === VIDEO_MODE_MULTI_IMAGE) {
      const providerRequests = Array.isArray(video.providerRequests) ? video.providerRequests : [];
      if (!providerRequests.length) {
        return ok({ success: false, error: "Multi Image provider requests not found." }, { status: 404 });
      }

      const checkedRequests = [];
      let hasFailed = false;

      for (const request of providerRequests) {
        const requestId = request.requestId;
        let statusResponse = null;
        let currentStatus = "pending";

        if (request.status === "completed") {
          currentStatus = "completed";
        } else {
          try {
            statusResponse = await checkJobStatus(requestId, { model: FAL_MULTI_IMAGE_VIDEO_MODEL_ID });
            currentStatus = normalizeFalStatus(statusResponse);
          } catch (statusError) {
            statusResponse = {
              status: "failed",
              error: getSafeErrorMessage(statusError, "Fal.ai multi-image status check failed"),
            };
            currentStatus = "failed";
          }
        }

        let result = request.result || (statusResponse?.error ? { error: statusResponse.error } : null);
        let videoUrl = request.videoUrl || null;

        if (currentStatus === "completed" && !videoUrl) {
          try {
            result = await getResult(requestId, { model: FAL_MULTI_IMAGE_VIDEO_MODEL_ID });
            videoUrl = getVideoUrlFromResult(result);
          } catch (resultError) {
            result = { error: getSafeErrorMessage(resultError, "Fal.ai multi-image result fetch failed") };
            currentStatus = "failed";
          }
        }

        if (currentStatus === "failed") hasFailed = true;

        checkedRequests.push({
          ...request,
          status: currentStatus,
          videoUrl,
          result,
          statusResponse,
        });
      }

      if (hasFailed) {
        const refunded = await refundVideoGenerationCredits({
          userId: user.id,
          videoId: video.id,
          creditCost: video.creditsCharged || VIDEO_GENERATION_CREDIT_COST,
          model: video.model || FAL_MULTI_IMAGE_VIDEO_MODEL_ID,
          durationSeconds: video.duration,
          videoMode: video.videoMode,
          errorMessage: "Fal.ai multi-image video generation failed",
          rawProviderResponse: { providerRequests: checkedRequests },
        });
        return ok({
          success: true,
          status: refunded.status,
          video: refunded,
          refundedCredits: video.creditsCharged || VIDEO_GENERATION_CREDIT_COST,
        });
      }

      const allCompleted = checkedRequests.every((request) => request.status === "completed" && request.videoUrl);
      let updated = video;

      if (allCompleted) {
        try {
          const outputRequests = await applyRequiredCanvasToProviderClips({
            video,
            providerRequests: checkedRequests,
            filePrefix: "multi-image",
          });
          const clipUrls = outputRequests.map((request) => request.videoUrl);
          const mergeResult = await mergeProviderVideoClipsWithXfadeFallback(clipUrls, {
            videoId: video.id,
            targetDurationSeconds: video.duration || 30,
            filePrefix: "multi-image",
            outputAspectRatio: video.format,
          });
          const textOverlayResult = await addTextOverlaysToFinalVideo({
            video,
            silentVideoUrl: mergeResult.finalVideoUrl,
          });
          const audioResult = await addBackgroundAudioToFinalVideo({
            video: { ...video, overlays: textOverlayResult.overlays },
            silentVideoUrl: textOverlayResult.finalVideoUrl,
          });

          updated = await prisma.video.update({
            where: { id: video.id },
            data: {
              status: "completed",
              videoUrl: audioResult.finalVideoUrl,
              providerRequests: outputRequests,
              overlays: audioResult.overlays,
              rawProviderResponse: {
                providerRequests: outputRequests,
                finalVideoUrl: audioResult.finalVideoUrl,
                silentFinalVideoUrl: mergeResult.finalVideoUrl,
                merge: mergeResult,
                canvas: outputRequests.map((request) => request.outputCanvas),
                textOverlayApplied: textOverlayResult.applied,
                textOverlayFailed: textOverlayResult.failed,
                textOverlayError: textOverlayResult.errorMessage || null,
                audioFailed: audioResult.audioFailed,
              },
            },
          });
        } catch (mergeError) {
          const latestVideo = await prisma.video.findUnique({ where: { id: video.id } });
          if (latestVideo?.status === "completed" && latestVideo.videoUrl) {
            updated = latestVideo;
          } else {
            updated = await refundVideoGenerationCredits({
              userId: user.id,
              videoId: video.id,
              creditCost: video.creditsCharged || VIDEO_GENERATION_CREDIT_COST,
              model: video.model || FAL_MULTI_IMAGE_VIDEO_MODEL_ID,
              durationSeconds: video.duration,
              videoMode: video.videoMode,
              errorMessage: mergeError?.message || "Multi-image video merge failed",
              rawProviderResponse: { providerRequests: checkedRequests, mergeError: mergeError?.message },
            });
          }
        }
      } else {
        updated = await prisma.video.update({
          where: { id: video.id },
          data: {
            status: video.status === "pending" ? "processing" : video.status,
            providerRequests: checkedRequests,
            rawProviderResponse: { providerRequests: checkedRequests },
          },
        });
      }

      return ok({
        success: true,
        status: updated.status,
        video: updated,
        providerRequests: checkedRequests,
        refundedCredits: updated.status === "refunded" ? video.creditsCharged || VIDEO_GENERATION_CREDIT_COST : 0,
      });
    }

    let falStatus = null;
    try {
      falStatus = await checkJobStatus(jobId);
    } catch (statusError) {
      falStatus = {
        status: "failed",
        error: getSafeErrorMessage(statusError, "Fal.ai status check failed"),
      };
    }
    const normalizedStatus = normalizeFalStatus(falStatus);
    let updated = video;

    if (normalizedStatus === "completed") {
      const result = await getResult(jobId);
      const videoUrl = getVideoUrlFromResult(result);
      const existingRaw = video.rawProviderResponse && typeof video.rawProviderResponse === "object"
        ? video.rawProviderResponse
        : {};
      const referenceStrategy = existingRaw.outputFormatStrategy || existingRaw.referenceImages?.references?.[0] || null;
      const canvasResult = await addOutputCanvasToFinalVideo({
        video,
        sourceVideoUrl: videoUrl,
        shouldApply: referenceStrategy?.requiresVerticalCanvas ?? true,
        reason: referenceStrategy?.requiresVerticalCanvas ? "non-portrait reference" : "native portrait reference",
      });
      const audioResult = await addBackgroundAudioToFinalVideo({
        video,
        silentVideoUrl: canvasResult.finalVideoUrl,
      });
      updated = await prisma.video.update({
        where: { id: video.id },
        data: {
          status: "completed",
          videoUrl: audioResult.finalVideoUrl,
          overlays: audioResult.overlays,
          rawProviderResponse: {
            ...existingRaw,
            ...(result && typeof result === "object" ? result : { result }),
            finalVideoUrl: audioResult.finalVideoUrl,
            silentFinalVideoUrl: videoUrl,
            canvas: canvasResult,
            audioFailed: audioResult.audioFailed,
          },
        },
      });
    } else if (normalizedStatus === "failed") {
      updated = await refundVideoGenerationCredits({
        userId: user.id,
        videoId: video.id,
        creditCost: video.creditsCharged || VIDEO_GENERATION_CREDIT_COST,
        model: video.model || FAL_VIDEO_MODEL_ID,
        durationSeconds: video.duration,
        videoMode: video.videoMode,
        errorMessage: "Fal.ai video generation failed",
        rawProviderResponse: falStatus,
      });
    } else if (video.status === "pending") {
      const existingRaw = video.rawProviderResponse && typeof video.rawProviderResponse === "object"
        ? video.rawProviderResponse
        : {};
      updated = await prisma.video.update({
        where: { id: video.id },
        data: { status: "processing", rawProviderResponse: { ...existingRaw, falStatus } },
      });
    }

    return ok({
      success: true,
      status: updated.status,
      video: updated,
      falStatus,
      refundedCredits: updated.status === "refunded" ? VIDEO_GENERATION_CREDIT_COST : 0,
    });
  } catch (error) {
    return fail(error);
  }
}
