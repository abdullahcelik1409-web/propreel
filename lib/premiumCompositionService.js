import { mergeProviderVideoClips } from "./videoMergeService";
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

  const finalVideoUrl = await mergeProviderVideoClips(clipUrls, { videoId: jobId });

  return {
    finalVideoUrl,
    duration: premiumVideoConfig.targetDurationSeconds,
    transitionSummary,
    compositionMetadata: {
      provider: premiumVideoConfig.provider,
      strategy: premiumVideoConfig.compositionStrategy,
      note: "Premium composition currently uses the existing ffmpeg merge path with transition metadata prepared for crossfade and dissolve expansion.",
      musicSelection,
      overlayData,
      generatedClips,
    },
  };
}
