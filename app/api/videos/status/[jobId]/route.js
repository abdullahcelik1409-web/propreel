import { fail, ok } from "@/lib/api";
import { checkJobStatus, getResult, getVideoUrlFromResult } from "@/lib/falVideoService";
import { mergeProviderVideoClips } from "@/lib/videoMergeService";
import { addBackgroundAudioToFinalVideo } from "@/lib/videoAudioService";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { refundVideoGenerationCredits } from "@/lib/videoCreditService";
import {
  FAL_MULTI_IMAGE_VIDEO_MODEL_ID,
  FAL_VIDEO_MODEL_ID,
  VIDEO_GENERATION_CREDIT_COST,
  VIDEO_MODE_MULTI_IMAGE,
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
          const clipUrls = checkedRequests.map((request) => request.videoUrl);
          const silentFinalVideoUrl = clipUrls.length > 1
            ? await mergeProviderVideoClips(clipUrls, { videoId: video.id })
            : clipUrls[0];
          const audioResult = await addBackgroundAudioToFinalVideo({
            video,
            silentVideoUrl: silentFinalVideoUrl,
          });

          updated = await prisma.video.update({
            where: { id: video.id },
            data: {
              status: "completed",
              videoUrl: audioResult.finalVideoUrl,
              providerRequests: checkedRequests,
              overlays: audioResult.overlays,
              rawProviderResponse: {
                providerRequests: checkedRequests,
                finalVideoUrl: audioResult.finalVideoUrl,
                silentFinalVideoUrl,
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
      const audioResult = await addBackgroundAudioToFinalVideo({
        video,
        silentVideoUrl: videoUrl,
      });
      updated = await prisma.video.update({
        where: { id: video.id },
        data: {
          status: "completed",
          videoUrl: audioResult.finalVideoUrl,
          overlays: audioResult.overlays,
          rawProviderResponse: {
            ...(result && typeof result === "object" ? result : { result }),
            finalVideoUrl: audioResult.finalVideoUrl,
            silentFinalVideoUrl: videoUrl,
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
      updated = await prisma.video.update({
        where: { id: video.id },
        data: { status: "processing", rawProviderResponse: falStatus },
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
