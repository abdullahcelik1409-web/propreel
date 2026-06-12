export {
  PREMIUM_GENERATE_ACTION,
  PREMIUM_PROVIDER_MODE_MOCK,
  PREMIUM_PROVIDER_MODE_REAL,
  VIDEO_MODE_ULTRA_CINEMATIC,
  buildPremiumScenePlan,
  canUseRealPremiumProvider,
  getPremiumDurationPlan,
  isPremiumVideoMode,
  premiumNegativePrompt,
  premiumSceneDirectives,
  premiumUiCopy,
  premiumVideoConfig,
  resolvePremiumProviderMode,
  validatePremiumCredits,
  validatePremiumPhotoCount,
} from "./premiumVideoCore.mjs";

export const FAL_VIDEO_MODEL_ID = "fal-ai/kling-video/v2.5-turbo/standard/image-to-video";
export const FAL_VIDEO_MODEL_NAME = "Kling 2.5 Turbo Standard";
export const FAL_MULTI_IMAGE_VIDEO_MODEL_ID = "fal-ai/kling-video/v2.1/standard/image-to-video";
export const FAL_MULTI_IMAGE_VIDEO_MODEL_NAME = "Kling 2.1 Standard Multi Image";

export const DEFAULT_VIDEO_DURATION_SECONDS = 10;
export const DEFAULT_VIDEO_ASPECT_RATIO = "16:9";
export const DEFAULT_PROMPT_TEMPLATE_ID = "cinematic_luxury";
export const DEFAULT_SCENE_TEMPLATE_ID = "single_photo_hero";
export const DEFAULT_MULTI_IMAGE_SCENE_TEMPLATE_ID = "multi_room_flow";
export const VIDEO_MODE_BASIC = "basic";
export const VIDEO_MODE_MULTI_IMAGE = "multi_image";

export const VIDEO_ASPECT_RATIOS = ["16:9", "1:1"];

export function normalizeAspectRatio(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "square" || normalized === "1:1") return "1:1";
  return "16:9";
}

export const CREDIT_USD_VALUE = 0.01;
export const VIDEO_GENERATION_CREDIT_COST = 120;
export const VIDEO_GENERATION_DURATION_SECONDS = 10;
export const MULTI_IMAGE_MAX_IMAGES = 4;
export const MULTI_IMAGE_VIDEO_CREDIT_COSTS = {
  10: 160,
  30: 480,
};
export const MULTI_IMAGE_PROVIDER_COST_ESTIMATES = {
  10: 0.56,
  30: 1.68,
};
export const MULTI_IMAGE_DURATION_OPTIONS = [10, 30];
export const DEV_DEFAULT_USER_CREDITS = 600;
export const PRODUCTION_DEFAULT_USER_CREDITS = 5;

export function getInitialUserCredits() {
  return process.env.NODE_ENV === "development" ? DEV_DEFAULT_USER_CREDITS : PRODUCTION_DEFAULT_USER_CREDITS;
}

export const CREDIT_PACKAGES = [
  {
    id: "starter_credits",
    name: "Starter Credits",
    credits: 1200,
    priceUsd: 9,
    description: "Good for testing and small real estate video batches",
  },
  {
    id: "growth_credits",
    name: "Growth Credits",
    credits: 3000,
    priceUsd: 19,
    description: "Best for active real estate agents",
  },
  {
    id: "agency_credits",
    name: "Agency Credits",
    credits: 9000,
    priceUsd: 49,
    description: "Best for agencies and high-volume listing videos",
  },
];

export const VIDEO_GENERATION_DEBIT_ACTION = "video_generation_debit";
export const VIDEO_GENERATION_REFUND_ACTION = "video_generation_refund";

export const VIDEO_GENERATION_DEBIT_NOTE =
  "Video generation: Kling 2.5 Turbo Standard, 10s";
export const VIDEO_GENERATION_REFUND_NOTE = "Refund: Fal.ai video generation failed";

export const DEFAULT_REAL_ESTATE_VIDEO_PROMPT =
  "Create a professional real estate marketing video from this property photo. Use smooth cinematic camera movement, slow dolly-in, gentle pan, natural lighting, luxury interior walkthrough style, clean commercial real estate advertisement look, realistic architecture, stable walls and windows, no warped geometry, no fake rooms, no people, no text artifacts.";

export const DEFAULT_REAL_ESTATE_NEGATIVE_PROMPT =
  "distorted architecture, warped walls, broken windows, extra rooms, people, faces, hands, text artifacts, logos, watermarks, blurry, low quality, flickering, unstable motion";

export const MULTI_IMAGE_NEGATIVE_PROMPT =
  "blur, distort, low quality, unrealistic architecture, warped rooms, deformed furniture, incorrect layout, fake text, logos, watermarks, people, faces";

export const MULTI_IMAGE_SCENE_PLAN_10 = [
  {
    clip: 1,
    durationSeconds: 10,
    direction:
      "Use the selected images as different reference areas of the same property. Start with a refined hero introduction, move through the strongest interior or exterior features, and finish with a clean premium real estate advertising frame.",
  },
];

export const MULTI_IMAGE_SCENE_PLAN_30 = [
  {
    clip: 1,
    durationSeconds: 10,
    direction:
      "Clip 1: exterior and main living area intro. Establish the property, show curb appeal or hero interior context, and create a smooth premium opening shot.",
  },
  {
    clip: 2,
    durationSeconds: 10,
    direction:
      "Clip 2: kitchen, bedrooms, and interior flow. Emphasize layout, materials, spatial continuity, and the best functional selling points.",
  },
  {
    clip: 3,
    durationSeconds: 10,
    direction:
      "Clip 3: balcony, garden, view, or closing real estate CTA. Finish with a polished premium closing shot suitable for a social media property ad.",
  },
];

export const VIDEO_STYLE_TEMPLATES = [
  {
    id: "cinematic_luxury",
    name: "Cinematic Luxury",
    description:
      "Luxury cinematic real estate promo with slow camera motion, premium lighting, and an elegant ad-film feel.",
    promptModifier:
      "Style direction: cinematic luxury real estate commercial, elegant slow dolly movement, polished premium lighting, high-end interior design mood, refined camera motion, aspirational but realistic.",
  },
  {
    id: "social_reel",
    name: "Social Reel",
    description:
      "Fast, attention-grabbing social video with dynamic camera movement and a clean short-form ad feel.",
    promptModifier:
      "Style direction: modern social media real estate reel, bright inviting look, energetic but smooth camera motion, strong first-second visual hook, polished short-form advertisement feel.",
  },
  {
    id: "architectural_walkthrough",
    name: "Architectural Walkthrough",
    description:
      "Realistic property tour focused on architecture, room flow, spatial depth, and interior layout.",
    promptModifier:
      "Style direction: architectural walkthrough, emphasize spatial depth, clean geometry, materials, windows, walls, room proportions, natural camera glide, realistic architecture with no distortion.",
  },
  {
    id: "warm_lifestyle",
    name: "Warm Lifestyle",
    description:
      "Warm, livable home atmosphere with natural light, comfort, and an inviting lifestyle mood.",
    promptModifier:
      "Style direction: warm lifestyle real estate video, cozy natural light, welcoming atmosphere, comfortable home feeling, gentle cinematic movement, emotional but still professional.",
  },
];

export const VIDEO_PROMPT_TEMPLATES = VIDEO_STYLE_TEMPLATES;

export const BASIC_VIDEO_SCENE_TEMPLATES = [
  {
    id: "single_photo_hero",
    name: "Single Photo Hero",
    description:
      "Creates a clean hero video from one main photo with a slow push-in, balanced framing, and premium ending.",
    instruction:
      "Scene direction: create one smooth continuous hero movement from the selected property photo. Begin with a stable wide view, slowly push toward the strongest architectural focal point, and finish with a clean premium real estate hero framing. Keep the motion smooth and realistic. This direction is intended for a single image-to-video request only.",
  },
  {
    id: "cinematic_push_in",
    name: "Cinematic Push-In",
    description:
      "Uses a slow professional camera push toward the strongest architectural feature in the source photo.",
    instruction:
      "Scene direction: use one controlled cinematic push-in from the original still image. Keep the first frame composition recognizable, move slowly toward the strongest architectural feature, preserve walls, windows, furniture, and realistic depth, then settle on a polished real estate advertising frame.",
  },
  {
    id: "luxury_detail_reveal",
    name: "Luxury Detail Reveal",
    description:
      "Starts with material and interior detail emphasis, then reveals a refined wider composition.",
    instruction:
      "Scene direction: begin with a subtle premium detail emphasis from the source photo, such as marble, wood, lighting, furniture, pool edge, balcony rail, or architectural texture. Then transition into a wider view of the same visible space. Do not invent new rooms; preserve realistic proportions and finish with a luxury property advertising mood.",
  },
  {
    id: "architectural_parallax",
    name: "Architectural Parallax",
    description:
      "Adds a refined parallax-style camera move while protecting architecture and straight lines.",
    instruction:
      "Scene direction: create a refined architectural parallax movement from the single property image. Use gentle lateral motion and subtle depth separation while keeping vertical lines straight, walls stable, windows realistic, and furniture undistorted. Prioritize professional architectural photography quality.",
  },
];

export const MULTI_IMAGE_VIDEO_SCENE_TEMPLATES = [
  {
    id: "multi_room_flow",
    name: "Multi Room Flow",
    description:
      "Builds a smooth property tour across selected rooms or exterior areas.",
    instruction:
      "Scene direction: treat the selected images as different areas of one real property. Create a coherent room-to-room flow with consistent lighting, color grade, camera language, and property identity. Each clip should feel like the next part of the same tour, not a separate unrelated video.",
  },
  {
    id: "exterior_to_interior_tour",
    name: "Exterior To Interior Tour",
    description:
      "Opens with curb appeal or exterior context, then moves into interior selling points.",
    instruction:
      "Scene direction: organize the video like an exterior-to-interior real estate tour. Use exterior, balcony, garden, pool, or view references as the establishing material when available, then transition into living spaces, kitchen, bedroom, or interior details. Preserve continuity and avoid changing the property identity.",
  },
  {
    id: "feature_sequence",
    name: "Feature Sequence",
    description:
      "Highlights the strongest property features as a polished commercial sequence.",
    instruction:
      "Scene direction: create a feature-driven commercial sequence. Use each selected image to emphasize a distinct selling point such as view, living area, kitchen, bedroom, pool, terrace, materials, or natural light. Keep the edit premium and cohesive, with clean transitions and no fake rooms.",
  },
  {
    id: "luxury_walkthrough_montage",
    name: "Luxury Walkthrough Montage",
    description:
      "Creates a premium walkthrough montage with consistent mood across all selected photos.",
    instruction:
      "Scene direction: create a premium walkthrough montage across the selected property reference images. Use smooth cinematic motion, consistent luxury lighting, elegant pacing, and realistic architecture. The final result should feel like one continuous high-end property advertisement assembled from multiple real listing images.",
  },
];

export const VIDEO_SCENE_TEMPLATES = BASIC_VIDEO_SCENE_TEMPLATES;

export function getPromptTemplate(templateId = DEFAULT_PROMPT_TEMPLATE_ID) {
  return VIDEO_STYLE_TEMPLATES.find((template) => template.id === templateId) || VIDEO_STYLE_TEMPLATES[0];
}

export function getSceneTemplatesForMode(videoMode = VIDEO_MODE_BASIC) {
  return videoMode === VIDEO_MODE_MULTI_IMAGE ? MULTI_IMAGE_VIDEO_SCENE_TEMPLATES : BASIC_VIDEO_SCENE_TEMPLATES;
}

export function getDefaultSceneTemplateId(videoMode = VIDEO_MODE_BASIC) {
  return videoMode === VIDEO_MODE_MULTI_IMAGE ? DEFAULT_MULTI_IMAGE_SCENE_TEMPLATE_ID : DEFAULT_SCENE_TEMPLATE_ID;
}

export function normalizeSceneTemplateIdForMode(templateId, videoMode = VIDEO_MODE_BASIC) {
  const templates = getSceneTemplatesForMode(videoMode);
  const fallback = getDefaultSceneTemplateId(videoMode);
  return templates.some((template) => template.id === templateId) ? templateId : fallback;
}

export function getSceneTemplate(templateId, videoMode = VIDEO_MODE_BASIC) {
  const normalizedTemplateId = normalizeSceneTemplateIdForMode(templateId, videoMode);
  return getSceneTemplatesForMode(videoMode).find((template) => template.id === normalizedTemplateId) || getSceneTemplatesForMode(videoMode)[0];
}

export function getMultiImageCreditCost(durationSeconds) {
  return MULTI_IMAGE_VIDEO_CREDIT_COSTS[durationSeconds] || MULTI_IMAGE_VIDEO_CREDIT_COSTS[10];
}

export function getMultiImageProviderCostEstimate(durationSeconds) {
  return MULTI_IMAGE_PROVIDER_COST_ESTIMATES[durationSeconds] || MULTI_IMAGE_PROVIDER_COST_ESTIMATES[10];
}

export function getMultiImageScenePlan(durationSeconds) {
  return durationSeconds === 30 ? MULTI_IMAGE_SCENE_PLAN_30 : MULTI_IMAGE_SCENE_PLAN_10;
}

export function buildRealEstateVideoPrompt(userPrompt) {
  const trimmed = typeof userPrompt === "string" ? userPrompt.trim() : "";
  if (!trimmed) return DEFAULT_REAL_ESTATE_VIDEO_PROMPT;
  return `${DEFAULT_REAL_ESTATE_VIDEO_PROMPT}\n\nUser instructions:\n${trimmed}`;
}
