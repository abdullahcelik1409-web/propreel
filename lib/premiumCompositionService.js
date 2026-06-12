import { mergeProviderVideoClipsWithXfadeFallback } from "./videoMergeService";
import { buildPremiumTransitionSummary, premiumVideoConfig } from "./premiumVideoCore.mjs";

export async function composePremiumVideoClips({
  jobId,
  generatedClips = [],
  scenePlan,
  transitionPlan,
  musicSelection = null,
  overlayData = null,
  mock = false,
} = {}) {
  const clipUrls = generatedClips.map((clip) => clip.videoUrl).filter(Boolean);
  const transitionSummary = transitionPlan || buildPremiumTransitionSummary(scenePlan);

  if (mock) {
    return {
      finalVideoUrl: `mock://premium/${jobId || "local"}/final/ultra-cinematic.mp4`,
      duration: premiumVideoConfig.targetDurationSeconds,
      transitionSummary,
      compositionMetadata: {
        provider: "mock",
        strategy: premiumVideoConfig.compositionStrategy,
        musicSelection,
        overlayData,
        generatedClips,
      },
    };
  }

  const mergeResult = await mergeProviderVideoClipsWithXfadeFallback(clipUrls, {
    videoId: jobId,
    targetDurationSeconds: premiumVideoConfig.targetDurationSeconds,
    filePrefix: "premium",
  });

  return {
    finalVideoUrl: mergeResult.finalVideoUrl,
    duration: premiumVideoConfig.targetDurationSeconds,
    transitionSummary,
    compositionMetadata: {
      provider: premiumVideoConfig.provider,
      strategy: premiumVideoConfig.compositionStrategy,
      xfadeApplied: mergeResult.xfadeApplied,
      fallbackMergeUsed: mergeResult.fallbackMergeUsed,
      xfadeError: mergeResult.xfadeError,
      musicSelection,
      overlayData,
      generatedClips,
    },
  };
}
