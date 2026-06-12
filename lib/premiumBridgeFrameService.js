import { premiumVideoConfig, buildMockBridgeFrameRef } from "./premiumVideoCore.mjs";

export class PremiumBridgeFrameService {
  constructor({ mode = "mock" } = {}) {
    this.mode = mode;
  }

  async extractLastFrame(clipRef, { jobId, sceneIndex, fallbackUrl } = {}) {
    if (this.mode !== "real") {
      return buildMockBridgeFrameRef({ jobId, sceneIndex, sourceUrl: fallbackUrl || clipRef?.videoUrl });
    }

    return {
      provider: premiumVideoConfig.provider,
      frameUrl: fallbackUrl || clipRef?.videoUrl || null,
      storagePath: `premium/${jobId}/frames/scene-${sceneIndex}-last-frame.jpg`,
      metadata: {
        extractionDeferred: true,
        note: "Real last-frame extraction requires ffmpeg access during the completed clip processing step.",
      },
    };
  }

  async createBridgeFrame(previousClipRef, sceneIndex, context = {}) {
    return this.extractLastFrame(previousClipRef, {
      ...context,
      sceneIndex,
      fallbackUrl: context.fallbackUrl || previousClipRef?.videoUrl,
    });
  }

  getStartFrameForScene(sceneIndex, selectedPhoto, previousBridgeFrame) {
    if (sceneIndex > 0 && previousBridgeFrame?.frameUrl) {
      return {
        type: "bridge_frame",
        url: previousBridgeFrame.frameUrl,
        ref: previousBridgeFrame,
      };
    }

    return {
      type: "selected_photo",
      url: selectedPhoto,
      ref: { photoUrl: selectedPhoto },
    };
  }

  async persistBridgeFrameRef(jobId, sceneIndex, frameRef) {
    return {
      ...frameRef,
      jobId,
      sceneIndex,
      storagePath: frameRef?.storagePath || `premium/${jobId}/frames/scene-${sceneIndex}-last-frame.jpg`,
    };
  }
}

export function createPremiumBridgeFrameService(options = {}) {
  return new PremiumBridgeFrameService(options);
}
