import { assertFalCredentials, fal } from "./fal";
import { assertPublicImageUrl, getVideoUrlFromResult } from "./falVideoService";
import {
  PREMIUM_PROVIDER_MODE_MOCK,
  buildMockBridgeFrameRef,
  buildMockClipRef,
  buildPremiumProviderInput,
  premiumVideoConfig,
  resolvePremiumProviderMode,
} from "./premiumVideoCore.mjs";

export class MockPremiumVideoProvider {
  constructor({ jobId } = {}) {
    this.name = "mock";
    this.modelId = premiumVideoConfig.modelId;
    this.jobId = jobId;
  }

  async generateSceneClip(input) {
    const clipRef = buildMockClipRef({
      jobId: this.jobId,
      sceneIndex: input.scene.sceneIndex,
      scene: input.scene,
    });
    return {
      ...clipRef,
      input: {
        start_image_url: input.startFrameUrl || input.scene.sourcePhotoUrl,
        end_image_url: input.scene.targetPhotoUrl,
        duration: String(input.scene.targetDuration),
        aspect_ratio: input.aspectRatio,
        generate_audio: false,
      },
      raw: {
        mocked: true,
        message: "MockPremiumVideoProvider did not call Fal.ai.",
      },
    };
  }

  async extractLastFrame(clipRef, { sceneIndex, fallbackUrl } = {}) {
    return buildMockBridgeFrameRef({
      jobId: this.jobId,
      sceneIndex,
      sourceUrl: fallbackUrl || clipRef?.videoUrl,
    });
  }
}

export class FalKling3ProProvider {
  constructor({ webhookUrl } = {}) {
    this.name = "fal";
    this.modelId = premiumVideoConfig.modelId;
    this.webhookUrl = webhookUrl;
  }

  async generateSceneClip({ scene, startFrameUrl, aspectRatio }) {
    assertFalCredentials();
    const input = buildPremiumProviderInput({
      scene,
      startFrameUrl: assertPublicImageUrl(startFrameUrl || scene.sourcePhotoUrl),
      aspectRatio,
    });

    const result = await fal.queue.submit(premiumVideoConfig.modelId, {
      input,
      webhookUrl: this.webhookUrl,
    });
    const requestId = result.request_id || result.requestId;

    return {
      provider: premiumVideoConfig.provider,
      requestId,
      model: premiumVideoConfig.modelId,
      modelName: premiumVideoConfig.modelName,
      videoUrl: getVideoUrlFromResult(result),
      input,
      raw: result,
    };
  }
}

export function premiumProviderFactory({ env = process.env, mode, jobId, webhookUrl } = {}) {
  const providerMode = mode || resolvePremiumProviderMode(env);
  if (providerMode === PREMIUM_PROVIDER_MODE_MOCK) {
    return new MockPremiumVideoProvider({ jobId });
  }
  return new FalKling3ProProvider({ webhookUrl });
}

export async function submitPremiumVideoGeneration({
  provider,
  bridgeFrameService,
  scenePlan,
  jobId,
  aspectRatio,
}) {
  if (provider.name !== "mock") {
    const providerRequests = await Promise.all(
      scenePlan.scenes.map((scene) => submitPremiumSceneGeneration({
        provider,
        bridgeFrameService,
        scene,
        jobId,
        aspectRatio: scene.providerAspectRatio || aspectRatio,
      })),
    );

    return {
      model: premiumVideoConfig.modelId,
      modelName: premiumVideoConfig.modelName,
      providerRequests,
      primaryJobId: providerRequests[0]?.requestId || null,
    };
  }

  const providerRequests = [];
  let previousBridgeFrame = null;

  for (const scene of scenePlan.scenes) {
    const request = await submitPremiumSceneGeneration({
      provider,
      bridgeFrameService,
      scene,
      jobId,
      aspectRatio: scene.providerAspectRatio || aspectRatio,
      previousBridgeFrame,
    });
    previousBridgeFrame = request.bridgeFrameRef;
    providerRequests.push(request);
  }

  return {
    model: premiumVideoConfig.modelId,
    modelName: premiumVideoConfig.modelName,
    providerRequests,
    primaryJobId: providerRequests[0]?.requestId || null,
  };
}

export async function submitPremiumSceneGeneration({
  provider,
  bridgeFrameService,
  scene,
  jobId,
  aspectRatio,
  previousBridgeFrame = null,
}) {
  const startFrame = bridgeFrameService.getStartFrameForScene(
    scene.sceneIndex,
    scene.sourcePhotoUrl,
    previousBridgeFrame,
  );
  const generatedClip = await provider.generateSceneClip({
    scene,
    startFrameUrl: startFrame.url,
    aspectRatio,
  });
  const bridgeFrameRef = provider.name === "mock"
    ? await bridgeFrameService.persistBridgeFrameRef(
      jobId,
      scene.sceneIndex,
      await bridgeFrameService.extractLastFrame(generatedClip, {
        jobId,
        sceneIndex: scene.sceneIndex,
        fallbackUrl: scene.targetPhotoUrl || scene.sourcePhotoUrl,
      }),
    )
    : null;

  return {
    sceneIndex: scene.sceneIndex,
    status: provider.name === "mock" ? "completed" : "pending",
    requestId: generatedClip.requestId,
    provider: provider.name,
    model: premiumVideoConfig.modelId,
    imageUrl: scene.sourcePhotoUrl,
    sourceOrientation: scene.sourceOrientation || null,
    targetOrientation: scene.targetOrientation || null,
    requestedAspectRatio: scene.providerAspectRatio || aspectRatio,
    requiresVerticalCanvas: Boolean(scene.requiresVerticalCanvas),
    startFrameStrategy: startFrame.type,
    startFrameUrl: startFrame.url,
    inputBridgeFrameRef: startFrame.ref || null,
    bridgeFrameRef,
    input: generatedClip.input,
    raw: generatedClip.raw,
    videoUrl: generatedClip.videoUrl || null,
  };
}
