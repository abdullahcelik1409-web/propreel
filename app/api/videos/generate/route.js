import { randomUUID } from "node:crypto";
import { fail, ok } from "@/lib/api";
import {
  generatePropertyVideo,
  assertPublicImageUrl,
  buildPropertyPrompt,
  selectBestMultiImageUrls,
  buildMultiImagePropertyPrompt,
  submitMultiImageVideoGeneration,
} from "@/lib/falVideoService";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { createInitialAudioMetadata, mergeAudioMetadataIntoOverlays, normalizeAudioTrackId } from "@/lib/audioConfig";
import { getAudioTrackById } from "@/lib/audioTrackService";
import { composePremiumVideoClips } from "@/lib/premiumCompositionService";
import { createPremiumBridgeFrameService } from "@/lib/premiumBridgeFrameService";
import { premiumProviderFactory, submitPremiumVideoGeneration } from "@/lib/premiumVideoProvider";
import { prepareReferenceImagesForVideo } from "@/lib/videoReferenceImageService";
import {
  recordVideoGenerationDebit,
  refundVideoGenerationCredits,
  reserveVideoGenerationCredits,
} from "@/lib/videoCreditService";
import {
  DEFAULT_REAL_ESTATE_NEGATIVE_PROMPT,
  DEFAULT_VIDEO_ASPECT_RATIO,
  DEFAULT_PROMPT_TEMPLATE_ID,
  FAL_MULTI_IMAGE_VIDEO_MODEL_ID,
  FAL_VIDEO_MODEL_ID,
  PREMIUM_GENERATE_ACTION,
  VIDEO_MODE_ULTRA_CINEMATIC,
  buildPremiumScenePlan,
  canUseRealPremiumProvider,
  getMultiImageCreditCost,
  getMultiImageProviderCostEstimate,
  getMultiImageScenePlan,
  isPremiumVideoMode,
  MULTI_IMAGE_MAX_IMAGES,
  MULTI_IMAGE_NEGATIVE_PROMPT,
  normalizeAspectRatio,
  normalizeSceneTemplateIdForMode,
  premiumNegativePrompt,
  premiumVideoConfig,
  resolvePremiumProviderMode,
  validatePremiumCredits,
  validatePremiumPhotoCount,
  VIDEO_MODE_BASIC,
  VIDEO_MODE_MULTI_IMAGE,
  VIDEO_GENERATION_CREDIT_COST,
  VIDEO_GENERATION_DURATION_SECONDS,
} from "@/lib/videoConfig";

function applyPreparedReferencesToPremiumScenePlan(scenePlan, referencePreparation) {
  if (!referencePreparation?.processed) return scenePlan;

  const urlMap = new Map(
    referencePreparation.references.map((reference) => [reference.originalUrl, reference.processedUrl]),
  );

  return {
    ...scenePlan,
    scenes: scenePlan.scenes.map((scene) => ({
      ...scene,
      sourcePhotoUrl: urlMap.get(scene.sourcePhotoUrl) || scene.sourcePhotoUrl,
      targetPhotoUrl: urlMap.get(scene.targetPhotoUrl) || scene.targetPhotoUrl,
    })),
  };
}

export async function POST(request) {
  let reservedVideo = null;

  try {
    const user = await requireUser();
    const body = await request.json();
    const listingId = body.listingId;
    const videoMode = body.videoMode === VIDEO_MODE_ULTRA_CINEMATIC
      ? VIDEO_MODE_ULTRA_CINEMATIC
      : body.videoMode === VIDEO_MODE_MULTI_IMAGE
        ? VIDEO_MODE_MULTI_IMAGE
        : VIDEO_MODE_BASIC;
    const format = normalizeAspectRatio(body.format || DEFAULT_VIDEO_ASPECT_RATIO);
    const overlays = body.overlays || {};
    const templateId = body.templateId || body.style || DEFAULT_PROMPT_TEMPLATE_ID;
    const sceneTemplateId = normalizeSceneTemplateIdForMode(body.sceneTemplateId, videoMode);
    const userPrompt = body.prompt || "";
    const requestedDuration = Number.parseInt(body.duration || VIDEO_GENERATION_DURATION_SECONDS, 10);
    const rawAudioTrackId = body.audio_track_id ?? body.audioTrackId;
    const audioTrackId = normalizeAudioTrackId(rawAudioTrackId);
    const audioMetadata = createInitialAudioMetadata(audioTrackId);

    if (rawAudioTrackId && rawAudioTrackId !== "none" && !audioTrackId) {
      return ok({ success: false, error: "Selected audio track is not supported." }, { status: 400 });
    }

    if (audioTrackId) {
      const selectedAudioTrack = await getAudioTrackById(audioTrackId);
      if (!selectedAudioTrack) {
        return ok({ success: false, error: "Selected audio track is not available." }, { status: 400 });
      }
    }

    const listing = await prisma.listing.findFirst({
      where: { id: listingId, userId: user.id },
    });

    if (!listing) return ok({ success: false, error: "Listing not found." }, { status: 404 });
    if (!listing.photos.length) {
      return ok({ success: false, error: "At least one listing photo is required." }, { status: 400 });
    }

    const imageUrl = assertPublicImageUrl(listing.photos[0]);

    if (isPremiumVideoMode(videoMode)) {
      const requestedImageUrls = Array.isArray(body.selectedImageUrls) ? body.selectedImageUrls : [];
      const selectedImageUrls = [...new Set(requestedImageUrls)]
        .filter((url) => listing.photos.includes(url))
        .map(assertPublicImageUrl);
      const photoValidation = validatePremiumPhotoCount(selectedImageUrls.length);
      if (!photoValidation.valid) {
        return ok({ success: false, error: photoValidation.error }, { status: 400 });
      }

      const creditSnapshot = await prisma.user.findUnique({
        where: { id: user.id },
        select: { credits: true },
      });
      const creditValidation = validatePremiumCredits(creditSnapshot?.credits || 0);
      if (!creditValidation.valid) {
        return ok(
          {
            success: false,
            error: creditValidation.error,
            requiredCredits: creditValidation.requiredCredits,
            currentCredits: creditValidation.currentCredits,
          },
          { status: 402 },
        );
      }

      const providerMode = resolvePremiumProviderMode(process.env);
      const realGuard = canUseRealPremiumProvider({
        env: process.env,
        providerMode,
        user,
        generationAction: body.generationAction,
        videoMode,
        selectedImageUrls,
        currentCredits: creditSnapshot?.credits || 0,
      });
      const useRealProvider = realGuard.allowed;

      if (providerMode === "real" && !useRealProvider) {
        return ok(
          {
            success: false,
            error: "Ultra Cinematic real generation did not pass the production safety checks.",
            safety: {
              providerMode,
              photoValidation: realGuard.photoValidation,
              creditValidation: realGuard.creditValidation,
              requiresGenerationAction: PREMIUM_GENERATE_ACTION,
            },
          },
          { status: 400 },
        );
      }

      const scenePlan = buildPremiumScenePlan({
        listing,
        selectedImageUrls,
        userPrompt,
        style: templateId,
      });
      const premiumOverlays = mergeAudioMetadataIntoOverlays({
        ...overlays,
        promptTemplateId: templateId,
        sceneTemplateId,
        premiumProviderMode: providerMode,
        continuityMode: premiumVideoConfig.continuityMode,
        klingNativeAudio: "off",
      }, audioMetadata);

      reservedVideo = await prisma.$transaction(async (tx) => {
        if (useRealProvider) {
          await reserveVideoGenerationCredits(tx, user.id, premiumVideoConfig.creditCost);
        }

        const video = await tx.video.create({
          data: {
            userId: user.id,
            listingId: listing.id,
            videoMode,
            provider: useRealProvider ? "fal" : "mock",
            model: premiumVideoConfig.modelId,
            status: useRealProvider ? "planning" : "completed",
            format,
            duration: premiumVideoConfig.targetDurationSeconds,
            style: templateId,
            imageUrl: selectedImageUrls[0],
            selectedImageUrls,
            prompt: scenePlan.masterConcept,
            negativePrompt: premiumNegativePrompt,
            creditsCharged: useRealProvider ? premiumVideoConfig.creditCost : 0,
            providerCostEstimate: null,
            overlays: premiumOverlays,
            scenePlan,
            providerRequests: [],
            thumbnailUrl: selectedImageUrls[0],
            rawProviderResponse: {
              providerMode,
              safety: {
                realProviderAllowed: useRealProvider,
                generationAction: body.generationAction || null,
              },
            },
          },
        });

        if (useRealProvider) {
          await recordVideoGenerationDebit(tx, {
            userId: user.id,
            videoId: video.id,
            creditCost: premiumVideoConfig.creditCost,
            note: "Ultra Cinematic generation: Kling 3.0 Pro, 60s",
            model: premiumVideoConfig.modelId,
            durationSeconds: premiumVideoConfig.targetDurationSeconds,
            videoMode,
          });
        }

        return video;
      });

      const provider = premiumProviderFactory({
        mode: useRealProvider ? "real" : "mock",
        jobId: reservedVideo.id,
      });
      const bridgeFrameService = createPremiumBridgeFrameService({
        mode: useRealProvider ? "real" : "mock",
      });
      const referencePreparation = useRealProvider
        ? await prepareReferenceImagesForVideo({
          imageUrls: selectedImageUrls,
          format,
          userId: user.id,
          jobId: reservedVideo.id,
        })
        : null;
      const providerScenePlan = applyPreparedReferencesToPremiumScenePlan(scenePlan, referencePreparation);
      const generation = await submitPremiumVideoGeneration({
        provider,
        bridgeFrameService,
        scenePlan: providerScenePlan,
        jobId: reservedVideo.id,
        aspectRatio: format,
      });
      generation.primaryJobId = generation.primaryJobId || generation.providerRequests[0]?.requestId || null;

      if (!useRealProvider) {
        const finalComposition = await composePremiumVideoClips({
          jobId: reservedVideo.id,
          generatedClips: generation.providerRequests,
          scenePlan: providerScenePlan,
          mock: true,
        });

        const video = await prisma.video.update({
          where: { id: reservedVideo.id },
          data: {
            videoUrl: finalComposition.finalVideoUrl,
            providerRequests: generation.providerRequests,
            rawProviderResponse: {
              providerMode,
              providerRequests: generation.providerRequests,
              referenceImages: referencePreparation,
              finalComposition,
              mock: true,
              message: "Mock premium flow completed without Fal.ai calls or credit debit.",
            },
          },
        });

        return ok({
          success: true,
          provider: "mock",
          videoMode,
          model: premiumVideoConfig.modelId,
          durationSeconds: premiumVideoConfig.targetDurationSeconds,
          creditsCharged: 0,
          selectedImageUrls,
          videoUrl: video.videoUrl,
          generationId: video.id,
          videoId: video.id,
          jobId: generation.primaryJobId,
          providerMode,
        });
      }

      const video = await prisma.video.update({
        where: { id: reservedVideo.id },
        data: {
          status: "pending",
          falJobId: generation.primaryJobId,
          providerRequests: generation.providerRequests,
          rawProviderResponse: {
            providerMode,
            providerRequests: generation.providerRequests,
            referenceImages: referencePreparation,
            safety: {
              realProviderAllowed: true,
              generationAction: body.generationAction,
            },
          },
        },
      });

      return ok({
        success: true,
        provider: "fal",
        videoMode,
        model: premiumVideoConfig.modelId,
        durationSeconds: premiumVideoConfig.targetDurationSeconds,
        creditsCharged: premiumVideoConfig.creditCost,
        selectedImageUrls,
        videoUrl: null,
        generationId: video.id,
        videoId: video.id,
        jobId: generation.primaryJobId,
        providerMode,
      });
    }

    if (videoMode === VIDEO_MODE_MULTI_IMAGE) {
      const duration = requestedDuration === 30 ? 30 : 10;
      const creditCost = getMultiImageCreditCost(duration);
      const requestedImageUrls = Array.isArray(body.selectedImageUrls) ? body.selectedImageUrls.slice(0, MULTI_IMAGE_MAX_IMAGES) : [];
      if (requestedImageUrls.length < 1) {
        return ok({ success: false, error: `Select at least 1 and up to ${MULTI_IMAGE_MAX_IMAGES} photos for Multi Image Video.` }, { status: 400 });
      }
      const selectedImageUrls = selectBestMultiImageUrls(listing.photos, requestedImageUrls);
      const scenePlan = getMultiImageScenePlan(duration);
      const prompt = buildMultiImagePropertyPrompt({
        listing,
        templateId,
        sceneTemplateId,
        prompt: userPrompt,
        durationSeconds: duration,
        selectedImageCount: selectedImageUrls.length,
      });

      const creditSnapshot = await prisma.user.findUnique({
        where: { id: user.id },
        select: { credits: true },
      });

      if ((creditSnapshot?.credits || 0) < creditCost) {
        return ok(
          {
            success: false,
            error: "Insufficient credits",
            requiredCredits: creditCost,
            currentCredits: creditSnapshot?.credits || 0,
          },
          { status: 402 },
        );
      }

      const referencePreparation = await prepareReferenceImagesForVideo({
        imageUrls: selectedImageUrls,
        format,
        userId: user.id,
        jobId: `multi-${randomUUID()}`,
      });
      const generation = await submitMultiImageVideoGeneration({
        listing,
        imageUrls: referencePreparation.imageUrls,
        templateId,
        sceneTemplateId,
        prompt: userPrompt,
        durationSeconds: duration,
        aspectRatio: format,
      });

      const video = await prisma.$transaction(async (tx) => {
        await reserveVideoGenerationCredits(tx, user.id, creditCost);

        const video = await tx.video.create({
          data: {
            userId: user.id,
            listingId: listing.id,
            videoMode,
            provider: "fal",
            model: FAL_MULTI_IMAGE_VIDEO_MODEL_ID,
            status: "pending",
            format,
            duration,
            style: templateId,
            imageUrl: selectedImageUrls[0],
            selectedImageUrls,
            prompt,
            negativePrompt: MULTI_IMAGE_NEGATIVE_PROMPT,
            creditsCharged: creditCost,
            providerCostEstimate: getMultiImageProviderCostEstimate(duration),
            overlays: mergeAudioMetadataIntoOverlays({
              ...overlays,
              promptTemplateId: templateId,
              sceneTemplateId,
            }, audioMetadata),
            scenePlan,
            providerRequests: generation.providerRequests,
            thumbnailUrl: selectedImageUrls[0],
            falJobId: generation.primaryJobId,
            rawProviderResponse: {
              providerRequests: generation.providerRequests,
              referenceImages: referencePreparation,
            },
          },
        });

        await recordVideoGenerationDebit(tx, {
          userId: user.id,
          videoId: video.id,
          creditCost,
          note: `Multi Image Video generation: Kling 2.1 Standard, ${duration}s`,
          model: FAL_MULTI_IMAGE_VIDEO_MODEL_ID,
          durationSeconds: duration,
          videoMode,
        });
        return video;
      });

      return ok({
        success: true,
        provider: "fal",
        videoMode,
        model: FAL_MULTI_IMAGE_VIDEO_MODEL_ID,
        durationSeconds: duration,
        creditsCharged: creditCost,
        selectedImageUrls,
        videoUrl: null,
        generationId: video.id,
        videoId: video.id,
        jobId: generation.primaryJobId,
      });
    }

    const prompt = buildPropertyPrompt({ listing, templateId, sceneTemplateId, prompt: userPrompt });

    reservedVideo = await prisma.$transaction(async (tx) => {
      await reserveVideoGenerationCredits(tx, user.id);

      const video = await tx.video.create({
        data: {
          userId: user.id,
          listingId: listing.id,
          videoMode,
          provider: "fal",
          model: FAL_VIDEO_MODEL_ID,
          status: "pending",
          format,
          duration: VIDEO_GENERATION_DURATION_SECONDS,
          style: templateId,
          imageUrl,
          prompt,
          negativePrompt: DEFAULT_REAL_ESTATE_NEGATIVE_PROMPT,
          creditsCharged: VIDEO_GENERATION_CREDIT_COST,
          overlays: mergeAudioMetadataIntoOverlays({
            ...overlays,
            promptTemplateId: templateId,
            sceneTemplateId,
          }, audioMetadata),
          thumbnailUrl: imageUrl,
        },
      });

      await recordVideoGenerationDebit(tx, { userId: user.id, videoId: video.id });
      return video;
    });

    const referencePreparation = await prepareReferenceImagesForVideo({
      imageUrls: [imageUrl],
      format,
      userId: user.id,
      jobId: reservedVideo.id,
    });
    const providerImageUrl = referencePreparation.imageUrls[0] || imageUrl;
    const generation = await generatePropertyVideo([providerImageUrl], {
      aspectRatio: format,
      listing,
      prompt,
      templateId,
      sceneTemplateId,
    });

    const video = await prisma.video.update({
      where: { id: reservedVideo.id },
      data: {
        falJobId: generation.jobId,
        rawProviderResponse: {
          ...(generation.raw && typeof generation.raw === "object" ? generation.raw : { raw: generation.raw }),
          referenceImages: referencePreparation,
        },
      },
    });

    return ok({
      success: true,
      provider: "fal",
      videoMode,
      model: FAL_VIDEO_MODEL_ID,
      durationSeconds: VIDEO_GENERATION_DURATION_SECONDS,
      creditsCharged: VIDEO_GENERATION_CREDIT_COST,
      videoUrl: null,
      generationId: video.id,
      videoId: video.id,
      jobId: generation.jobId,
    });
  } catch (error) {
    if (reservedVideo && (reservedVideo.creditsCharged || 0) > 0) {
      await refundVideoGenerationCredits({
        userId: reservedVideo.userId,
        videoId: reservedVideo.id,
        creditCost: reservedVideo.creditsCharged,
        model: reservedVideo.model || FAL_VIDEO_MODEL_ID,
        durationSeconds: reservedVideo.duration || VIDEO_GENERATION_DURATION_SECONDS,
        videoMode: reservedVideo.videoMode || VIDEO_MODE_BASIC,
        errorMessage: error?.message,
        rawProviderResponse: { error: error?.message || "Fal submit failed" },
      }).catch(() => null);

      return ok(
        {
          success: false,
          error: error?.code === "VERTICAL_REFERENCE_PREPROCESSING_FAILED"
            ? error.message
            : "Video generation failed. Credits were refunded.",
          refundedCredits: reservedVideo.creditsCharged,
        },
        { status: 500 },
      );
    }

    return fail(error);
  }
}
