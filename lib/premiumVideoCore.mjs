export const VIDEO_MODE_ULTRA_CINEMATIC = "ultra_cinematic_kling_3_pro";
export const PREMIUM_PROVIDER_MODE_MOCK = "mock";
export const PREMIUM_PROVIDER_MODE_REAL = "real";
export const PREMIUM_GENERATE_ACTION = "user_generate_click";

export const premiumVideoConfig = {
  id: VIDEO_MODE_ULTRA_CINEMATIC,
  displayName: "Ultra Cinematic",
  provider: "fal",
  modelId: "fal-ai/kling-video/v3/pro/image-to-video",
  modelName: "Kling 3.0 Pro Image to Video",
  creditCost: 2500,
  targetDurationSeconds: 60,
  allowedPhotoCounts: [8, 10],
  audioEnabled: false,
  continuityMode: true,
  compositionStrategy: "bridge_frame_plus_smooth_transition",
  durationPlans: {
    8: [8, 7, 8, 7, 8, 7, 8, 7],
    10: [6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
  },
};

export const premiumUiCopy = {
  title: "Ultra Cinematic",
  badge: "Best Quality",
  subtitle: "A 60-second premium real estate video with smoother multi-scene continuity.",
  creditLabel: "2,500 credits",
  requirements: "Requires exactly 8 or 10 photos",
  bestFor: "Luxury listings, villas, and flagship campaigns",
  photoValidation: "Select exactly 8 or 10 photos for Ultra Cinematic generation.",
  formatDescription: "This premium format creates a 60-second multi-scene listing video.",
  creditRequirement: "Ultra Cinematic requires 2,500 credits.",
  insufficientCredits: "You need 2,500 credits to generate this premium video.",
};

export const premiumNegativePrompt = [
  "distorted architecture",
  "warped walls",
  "bent window frames",
  "unstable camera shake",
  "flickering",
  "low resolution",
  "blurry details",
  "unrealistic furniture changes",
  "fake rooms",
  "duplicated rooms",
  "people",
  "faces",
  "unreadable text",
  "distorted logos",
  "broken perspective",
  "overexposed windows",
  "unnatural motion",
  "jitter",
  "heavy artifacts",
].join(", ");

export const premiumSceneDirectives = [
  {
    id: "premium_exterior_reveal",
    title: "Premium Exterior Reveal",
    bestFor: ["exterior", "facade", "villa", "building", "entrance"],
    cameraMotion: "slow cinematic push-in or elegant reveal",
    pacing: "calm premium opening",
    lighting: "polished natural exterior lighting",
    promptIntent: "establish the property with luxury curb appeal and a refined hero introduction",
    transitionHint: "soft reveal to entrance or interior",
    negativePromptHints: ["fake landscaping", "warped facade", "distorted rooflines"],
  },
  {
    id: "cinematic_facade_approach",
    title: "Cinematic Facade Approach",
    bestFor: ["facade", "front door", "garden", "driveway"],
    cameraMotion: "stabilized forward glide",
    pacing: "measured approach",
    lighting: "balanced premium daylight",
    promptIntent: "move toward the entrance while preserving the exact facade and exterior proportions",
    transitionHint: "motion-matched cut",
    negativePromptHints: ["bent windows", "fake doors", "unstable perspective"],
  },
  {
    id: "elegant_living_room_glide",
    title: "Elegant Living Room Glide",
    bestFor: ["living room", "lounge", "salon", "open plan"],
    cameraMotion: "slow wide-angle glide",
    pacing: "smooth and spacious",
    lighting: "warm refined interior lighting",
    promptIntent: "show the living area as a premium, realistic walkthrough with stable geometry",
    transitionHint: "soft dissolve to kitchen or hallway",
    negativePromptHints: ["warped furniture", "fake rooms", "bent walls"],
  },
  {
    id: "luxury_kitchen_showcase",
    title: "Luxury Kitchen Showcase",
    bestFor: ["kitchen", "countertop", "dining", "island"],
    cameraMotion: "smooth lateral pan with premium detail emphasis",
    pacing: "controlled feature pass",
    lighting: "clean highlight on materials",
    promptIntent: "showcase kitchen materials, counters, cabinetry, and layout without inventing details",
    transitionHint: "gentle crossfade",
    negativePromptHints: ["melting cabinets", "unreadable appliance text", "distorted counters"],
  },
  {
    id: "master_bedroom_prestige",
    title: "Master Bedroom Prestige",
    bestFor: ["bedroom", "suite", "master"],
    cameraMotion: "calm slow push-in",
    pacing: "quiet prestige framing",
    lighting: "soft natural interior light",
    promptIntent: "frame the bedroom with calm luxury and realistic proportions",
    transitionHint: "soft dissolve",
    negativePromptHints: ["warped bed", "fake windows", "duplicated furniture"],
  },
  {
    id: "bathroom_detail_pass",
    title: "Bathroom Detail Pass",
    bestFor: ["bathroom", "marble", "sink", "shower", "vanity"],
    cameraMotion: "controlled detail pass",
    pacing: "short elegant emphasis",
    lighting: "clean reflective highlights",
    promptIntent: "highlight bathroom finishes while keeping mirrors, fixtures, and perspective stable",
    transitionHint: "short elegant cut",
    negativePromptHints: ["warped mirrors", "bent fixtures", "overexposed tiles"],
  },
  {
    id: "terrace_balcony_atmosphere",
    title: "Terrace Balcony Atmosphere",
    bestFor: ["balcony", "terrace", "garden", "view", "pool"],
    cameraMotion: "slow reveal toward view",
    pacing: "atmospheric lifestyle shot",
    lighting: "premium golden or natural daylight",
    promptIntent: "reveal outdoor lifestyle value and views without changing the property layout",
    transitionHint: "cinematic fade or dissolve",
    negativePromptHints: ["fake horizon", "distorted railings", "unrealistic pool shape"],
  },
  {
    id: "amenities_lifestyle_motion",
    title: "Amenities Lifestyle Motion",
    bestFor: ["pool", "gym", "amenities", "lifestyle", "site"],
    cameraMotion: "premium lifestyle motion",
    pacing: "energetic but smooth",
    lighting: "high-end amenity lighting",
    promptIntent: "present shared amenities or lifestyle spaces as a flagship campaign moment",
    transitionHint: "energetic smooth cut",
    negativePromptHints: ["people", "fake signage", "distorted logos"],
  },
  {
    id: "room_to_room_transition",
    title: "Room To Room Transition",
    bestFor: ["hallway", "corridor", "entrance", "transition"],
    cameraMotion: "forward glide",
    pacing: "continuous walkthrough",
    lighting: "consistent interior mood",
    promptIntent: "connect rooms with a coherent walkthrough feeling and stable camera direction",
    transitionHint: "bridge-frame continuation",
    negativePromptHints: ["abrupt layout jump", "fake doorways", "camera jitter"],
  },
  {
    id: "premium_closing_hero",
    title: "Premium Closing Hero",
    bestFor: ["hero", "closing", "detail", "view", "exterior"],
    cameraMotion: "slow hero framing",
    pacing: "resolved premium ending",
    lighting: "polished final campaign lighting",
    promptIntent: "finish with a memorable high-end real estate commercial closing shot",
    transitionHint: "closing fade-out",
    negativePromptHints: ["text artifacts", "distorted logos", "heavy artifacts"],
  },
];

const roomOrder = [
  "exterior",
  "facade",
  "entrance",
  "hallway",
  "living",
  "kitchen",
  "bedroom",
  "bathroom",
  "balcony",
  "terrace",
  "garden",
  "amenities",
  "detail",
  "hero",
];

const cameraMotions = [
  "slow push-in",
  "stabilized glide",
  "gentle pan",
  "smooth dolly movement",
  "elegant reveal",
];

export function isPremiumVideoMode(videoMode) {
  return videoMode === VIDEO_MODE_ULTRA_CINEMATIC;
}

export function getPremiumDurationPlan(photoCount) {
  const normalizedCount = Number(photoCount);
  const durations = premiumVideoConfig.durationPlans[normalizedCount];
  const valid = Array.isArray(durations);
  const totalDuration = valid ? durations.reduce((sum, value) => sum + value, 0) : 0;

  return {
    valid: valid && totalDuration === premiumVideoConfig.targetDurationSeconds,
    sceneCount: valid ? durations.length : 0,
    totalDuration,
    durations: valid ? [...durations] : [],
    allowedPhotoCounts: [...premiumVideoConfig.allowedPhotoCounts],
    targetDurationSeconds: premiumVideoConfig.targetDurationSeconds,
  };
}

export function validatePremiumPhotoCount(photoCount) {
  const durationPlan = getPremiumDurationPlan(photoCount);
  if (!durationPlan.valid) {
    return {
      valid: false,
      error: premiumUiCopy.photoValidation,
      durationPlan,
    };
  }
  return { valid: true, error: null, durationPlan };
}

export function validatePremiumCredits(currentCredits = 0) {
  const credits = Number(currentCredits) || 0;
  if (credits < premiumVideoConfig.creditCost) {
    return {
      valid: false,
      error: premiumUiCopy.insufficientCredits,
      requiredCredits: premiumVideoConfig.creditCost,
      currentCredits: credits,
    };
  }
  return {
    valid: true,
    error: null,
    requiredCredits: premiumVideoConfig.creditCost,
    currentCredits: credits,
  };
}

export function resolvePremiumProviderMode(env = process.env) {
  const runtime = String(env.NODE_ENV || "").toLowerCase();
  const isCi = String(env.CI || "").toLowerCase() === "true";
  if (runtime === "test" || isCi) return PREMIUM_PROVIDER_MODE_MOCK;

  const explicitMode = String(env.PREMIUM_VIDEO_PROVIDER_MODE || env.VIDEO_PROVIDER_MODE || "").trim().toLowerCase();
  if (explicitMode === PREMIUM_PROVIDER_MODE_REAL) return PREMIUM_PROVIDER_MODE_REAL;
  if (explicitMode === PREMIUM_PROVIDER_MODE_MOCK) return PREMIUM_PROVIDER_MODE_MOCK;

  return runtime === "production" ? PREMIUM_PROVIDER_MODE_REAL : PREMIUM_PROVIDER_MODE_MOCK;
}

export function canUseRealPremiumProvider({
  env = process.env,
  providerMode,
  user,
  generationAction,
  videoMode,
  selectedImageUrls,
  currentCredits,
} = {}) {
  const resolvedMode = providerMode || resolvePremiumProviderMode(env);
  const photoValidation = validatePremiumPhotoCount(Array.isArray(selectedImageUrls) ? selectedImageUrls.length : 0);
  const creditValidation = validatePremiumCredits(currentCredits);

  return {
    allowed:
      resolvedMode === PREMIUM_PROVIDER_MODE_REAL &&
      String(env.NODE_ENV || "").toLowerCase() !== "test" &&
      String(env.CI || "").toLowerCase() !== "true" &&
      !!user?.id &&
      generationAction === PREMIUM_GENERATE_ACTION &&
      isPremiumVideoMode(videoMode) &&
      photoValidation.valid &&
      creditValidation.valid,
    providerMode: resolvedMode,
    photoValidation,
    creditValidation,
  };
}

export function orderPremiumPhotos(selectedImageUrls = [], photoMetadata = []) {
  const urls = [...selectedImageUrls];
  const metadataByUrl = new Map(
    (Array.isArray(photoMetadata) ? photoMetadata : [])
      .filter((item) => item?.url)
      .map((item) => [item.url, String(item.roomType || item.label || "").toLowerCase()]),
  );

  const known = urls
    .map((url, index) => ({ url, index, label: metadataByUrl.get(url) || "" }))
    .filter((item) => item.label);

  if (!known.length) return urls;

  return urls
    .map((url, index) => ({
      url,
      index,
      rank: roomOrder.findIndex((key) => (metadataByUrl.get(url) || "").includes(key)),
    }))
    .sort((a, b) => {
      const rankA = a.rank === -1 ? Number.MAX_SAFE_INTEGER : a.rank;
      const rankB = b.rank === -1 ? Number.MAX_SAFE_INTEGER : b.rank;
      return rankA === rankB ? a.index - b.index : rankA - rankB;
    })
    .map((item) => item.url);
}

export function buildPremiumMasterConcept({ listing = {}, style = "" } = {}) {
  const propertyType = listing.propertyType || "premium property";
  const location = listing.location ? ` in ${listing.location}` : "";
  const title = listing.title ? ` for "${listing.title}"` : "";
  const styleDirection = style ? ` User style direction: ${style}.` : "";
  return `Create a luxury real estate commercial${title}${location} for a ${propertyType}. Maintain one coherent visual language: polished cinematic lighting, stable architecture, smooth premium camera pacing, realistic room continuity, and a high-end social campaign feel.${styleDirection}`;
}

function pickDirective(index, sceneCount) {
  if (sceneCount >= 10) return premiumSceneDirectives[Math.min(index, premiumSceneDirectives.length - 1)];
  const eightSceneMap = [0, 2, 3, 4, 5, 6, 7, 9];
  return premiumSceneDirectives[eightSceneMap[index] || 9] || premiumSceneDirectives[9];
}

function buildMetadataLines(listing = {}) {
  return [
    listing.title && `Title: ${listing.title}`,
    listing.location && `Location: ${listing.location}`,
    listing.price && `Price: ${listing.price}`,
    listing.propertyType && `Property type: ${listing.propertyType}`,
    listing.bedrooms && `Bedrooms: ${listing.bedrooms}`,
    listing.bathrooms && `Bathrooms: ${listing.bathrooms}`,
    listing.sqft && `Size: ${listing.sqft} square feet`,
    Array.isArray(listing.features) && listing.features.length ? `Highlighted features: ${listing.features.join(", ")}` : null,
    listing.description && `Description: ${listing.description}`,
  ].filter(Boolean);
}

export function buildKling3ProPrompt({
  listing = {},
  sceneDirective,
  sceneIndex = 0,
  sceneCount = 1,
  masterConcept,
  previousSceneSummary,
  transitionToNext,
  userPrompt = "",
} = {}) {
  const metadataLines = buildMetadataLines(listing);
  const continuity =
    sceneIndex === 0
      ? "Open the walkthrough with the master style and establish the property as a premium listing campaign."
      : "Continue from the previous shot, maintain the same lighting mood, keep the same premium cinematic pacing, avoid abrupt visual changes, preserve a coherent property walkthrough, and smoothly transition into the next area.";

  return [
    masterConcept,
    `Scene ${sceneIndex + 1} of ${sceneCount}: ${sceneDirective?.title || "Premium property scene"}.`,
    continuity,
    `Camera direction: ${sceneDirective?.cameraMotion || cameraMotions[sceneIndex % cameraMotions.length]}. Pacing: ${sceneDirective?.pacing || "smooth premium pacing"}. Lighting: ${sceneDirective?.lighting || "polished realistic lighting"}.`,
    `Scene intent: ${sceneDirective?.promptIntent || "create a realistic luxury real estate walkthrough scene"}.`,
    previousSceneSummary ? `Previous scene summary: ${previousSceneSummary}` : null,
    transitionToNext ? `Transition plan: ${transitionToNext}` : null,
    metadataLines.length ? `Listing metadata:\n${metadataLines.join("\n")}` : null,
    userPrompt ? `Additional user direction:\n${userPrompt}` : null,
    "Preserve the real architectural layout, straight walls, natural proportions, clean windows, realistic materials, and elegant commercial pacing. No people unless explicitly requested. Do not create fake extra spaces or unreadable generated text.",
  ].filter(Boolean).join("\n\n");
}

export function buildPremiumScenePlan({
  listing = {},
  selectedImageUrls = [],
  userPrompt = "",
  photoMetadata = [],
  style = "",
} = {}) {
  const orderedImageUrls = orderPremiumPhotos(selectedImageUrls, photoMetadata);
  const photoValidation = validatePremiumPhotoCount(orderedImageUrls.length);
  if (!photoValidation.valid) {
    const error = new Error(photoValidation.error);
    error.status = 400;
    error.validation = photoValidation;
    throw error;
  }

  const { durations } = photoValidation.durationPlan;
  const masterConcept = buildPremiumMasterConcept({ listing, style });
  let previousSceneSummary = "";

  const scenes = orderedImageUrls.map((sourcePhotoUrl, sceneIndex) => {
    const sceneDirective = pickDirective(sceneIndex, orderedImageUrls.length);
    const targetPhotoUrl = orderedImageUrls[sceneIndex + 1] || sourcePhotoUrl;
    const transitionToNext =
      sceneIndex === orderedImageUrls.length - 1
        ? "closing fade-out"
        : sceneDirective.transitionHint || "soft dissolve";
    const continuityContext =
      sceneIndex === 0
        ? "opening master visual language"
        : "continue from previous shot with matching lighting, camera direction, and premium pacing";
    const prompt = buildKling3ProPrompt({
      listing,
      sceneDirective,
      sceneIndex,
      sceneCount: orderedImageUrls.length,
      masterConcept,
      previousSceneSummary,
      transitionToNext,
      userPrompt,
    });
    const scene = {
      sceneIndex,
      sourcePhotoUrl,
      targetPhotoUrl,
      targetDuration: durations[sceneIndex],
      provider: premiumVideoConfig.provider,
      modelId: premiumVideoConfig.modelId,
      prompt,
      negativePrompt: premiumNegativePrompt,
      sceneDirective,
      previousSceneSummary,
      continuityContext,
      cameraMotion: sceneDirective.cameraMotion,
      lightingMood: sceneDirective.lighting,
      transitionToNext,
      startFrameStrategy: sceneIndex === 0 ? "selected_photo" : "previous_bridge_frame_or_selected_photo_fallback",
      endFrameStrategy: "target_photo_when_supported",
      bridgeFrameRef: null,
      mockClipRef: null,
      generatedClipRef: null,
      metadata: {
        masterConcept,
        audioEnabled: premiumVideoConfig.audioEnabled,
        compositionStrategy: premiumVideoConfig.compositionStrategy,
      },
    };
    previousSceneSummary = `${sceneDirective.title}: ${sceneDirective.promptIntent}`;
    return scene;
  });

  return {
    config: premiumVideoConfig,
    validation: photoValidation,
    totalDuration: photoValidation.durationPlan.totalDuration,
    sceneCount: scenes.length,
    durations,
    masterConcept,
    scenes,
  };
}

export function buildPremiumProviderInput({ scene, startFrameUrl }) {
  return {
    prompt: scene.prompt,
    start_image_url: startFrameUrl || scene.sourcePhotoUrl,
    end_image_url: scene.targetPhotoUrl,
    duration: String(scene.targetDuration),
    generate_audio: false,
    negative_prompt: scene.negativePrompt,
  };
}

export function buildMockClipRef({ jobId, sceneIndex, scene }) {
  return {
    provider: "mock",
    requestId: `mock-premium-${jobId || "local"}-${sceneIndex}`,
    videoUrl: `mock://premium/${jobId || "local"}/clips/scene-${sceneIndex}.mp4`,
    duration: scene.targetDuration,
    metadata: {
      modelId: premiumVideoConfig.modelId,
      mocked: true,
    },
  };
}

export function buildMockBridgeFrameRef({ jobId, sceneIndex, sourceUrl }) {
  return {
    provider: "mock",
    frameUrl: sourceUrl,
    storagePath: `premium/${jobId || "local"}/frames/scene-${sceneIndex}-last-frame.jpg`,
    metadata: {
      mocked: true,
      extractionSkipped: true,
    },
  };
}

export function buildPremiumTransitionSummary(scenePlan) {
  const scenes = Array.isArray(scenePlan?.scenes) ? scenePlan.scenes : [];
  return scenes.map((scene, index) => ({
    fromSceneIndex: index,
    toSceneIndex: index + 1 < scenes.length ? index + 1 : null,
    strategy:
      index + 1 >= scenes.length
        ? "closing fade-out"
        : scene.bridgeFrameRef
          ? "bridge-frame continuation + short crossfade"
          : scene.transitionToNext || "soft dissolve",
    durationSeconds: index + 1 >= scenes.length ? 0.5 : 0.4,
  }));
}
