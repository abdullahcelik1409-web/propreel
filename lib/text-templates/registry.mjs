import {
  assertTextTemplateDefinition,
  TEXT_TEMPLATE_ASPECT_RATIOS,
} from "./types.mjs";

export const MULTI_IMAGE_30_TEMPLATE_IDS = Object.freeze([
  "multi_room_flow",
  "exterior_to_interior_tour",
  "feature_sequence",
  "luxury_walkthrough_montage",
]);

export const PREMIUM_60_TEMPLATE_IDS = Object.freeze([
  "ultra_cinematic_8_scene",
  "ultra_cinematic_10_scene",
]);

const classicPlan = [
  { primary: ["title", "property_type"], secondary: ["property_type"], position: "lower-left", animation: "fadeUp" },
  { primary: ["location", "feature_highlight"], secondary: ["feature_highlight"], position: "upper-left", animation: "blurReveal" },
  { primary: ["price", "specs_summary", "feature_highlight_2"], secondary: ["specs_summary", "price"], position: "lower-left", animation: "softFade" },
  { primary: ["feature_highlight", "specs_summary"], secondary: ["feature_highlight_2"], position: "center-left", animation: "fadeUp" },
  { primary: ["feature_highlight_2", "price"], secondary: ["price", "specs_summary"], position: "lower-left", animation: "softFade" },
  { primary: ["specs_summary", "feature_highlight"], secondary: ["location"], position: "upper-left", animation: "blurReveal" },
  { primary: ["price", "feature_highlight_2"], secondary: ["specs_summary"], position: "lower-left", animation: "fadeUp" },
  { primary: ["cta"], secondary: ["property_type"], position: "lower-center", animation: "softFade" },
  { primary: ["feature_highlight", "location"], secondary: ["specs_summary"], position: "center-left", animation: "blurReveal" },
  { primary: ["cta"], secondary: ["price"], position: "lower-center", animation: "fadeUp" },
];

const minimalPlan = [
  { primary: ["property_type", "title"], secondary: [], position: "center-left", animation: "softFade" },
  { primary: ["location"], secondary: [], position: "lower-left", animation: "blurReveal" },
  { primary: ["feature_highlight", "specs_summary"], secondary: [], position: "upper-left", animation: "fadeUp" },
  { primary: ["feature_highlight_2", "price"], secondary: [], position: "center-left", animation: "softFade" },
  { primary: ["price", "specs_summary"], secondary: [], position: "lower-left", animation: "blurReveal" },
  { primary: ["specs_summary", "feature_highlight"], secondary: [], position: "upper-left", animation: "softFade" },
  { primary: ["feature_highlight_2", "price"], secondary: [], position: "center-left", animation: "fadeUp" },
  { primary: ["cta"], secondary: [], position: "lower-center", animation: "softFade" },
  { primary: ["price", "location"], secondary: [], position: "lower-left", animation: "blurReveal" },
  { primary: ["cta"], secondary: [], position: "lower-center", animation: "softFade" },
];

const reelPlan = [
  { primary: ["hook", "title"], secondary: ["property_type"], position: "upper-left", animation: "fadeUp" },
  { primary: ["location"], secondary: ["feature_highlight"], position: "lower-left", animation: "blurReveal" },
  { primary: ["price", "specs_summary"], secondary: ["specs_summary", "price"], position: "lower-left", animation: "fadeUp" },
  { primary: ["feature_highlight", "specs_summary"], secondary: ["feature_highlight_2"], position: "center-left", animation: "softFade" },
  { primary: ["feature_highlight_2", "price"], secondary: ["specs_summary"], position: "upper-left", animation: "blurReveal" },
  { primary: ["specs_summary", "location"], secondary: ["price"], position: "lower-left", animation: "fadeUp" },
  { primary: ["price", "feature_highlight"], secondary: ["feature_highlight_2"], position: "center-left", animation: "softFade" },
  { primary: ["cta"], secondary: ["location"], position: "lower-center", animation: "fadeUp" },
  { primary: ["feature_highlight_2", "specs_summary"], secondary: ["price"], position: "upper-left", animation: "blurReveal" },
  { primary: ["cta"], secondary: ["location"], position: "lower-center", animation: "fadeUp" },
];

function createTemplateSet(sceneCount) {
  return [
    assertTextTemplateDefinition({
      id: "classic-listing",
      name: "Classic Listing",
      description: "A balanced property narrative with facts, value, and a refined closing CTA.",
      supportedAspectRatios: [...TEXT_TEMPLATE_ASPECT_RATIOS],
      supportedSceneCounts: [sceneCount],
      tone: "classic-premium",
      styleVariant: "classic-listing",
      sceneTextPlan: classicPlan.slice(0, sceneCount),
      preview: { accent: "#00fbfb", surface: "rgba(3,18,18,.82)", summary: "Title · location · facts · CTA" },
    }),
    assertTextTemplateDefinition({
      id: "elegant-minimal",
      name: "Elegant Minimal",
      description: "Short, restrained copy with generous space and subtle cinematic reveals.",
      supportedAspectRatios: [...TEXT_TEMPLATE_ASPECT_RATIOS],
      supportedSceneCounts: [sceneCount],
      tone: "elegant-minimal",
      styleVariant: "elegant-minimal",
      sceneTextPlan: minimalPlan.slice(0, sceneCount),
      preview: { accent: "#d9b76e", surface: "rgba(8,12,12,.72)", summary: "Type · place · highlight · CTA" },
    }),
    assertTextTemplateDefinition({
      id: "social-reel-cta",
      name: "Social Reel CTA",
      description: "A stronger opening hook and contact-led finish without loud social graphics.",
      supportedAspectRatios: [...TEXT_TEMPLATE_ASPECT_RATIOS],
      supportedSceneCounts: [sceneCount],
      tone: "social-refined",
      styleVariant: "social-reel-cta",
      sceneTextPlan: reelPlan.slice(0, sceneCount),
      preview: { accent: "#8ee7d8", surface: "rgba(2,16,17,.84)", summary: "Hook · location · value · contact" },
    }),
  ];
}

const registry = { 30: {}, 60: {} };
for (const templateId of MULTI_IMAGE_30_TEMPLATE_IDS) registry[30][templateId] = createTemplateSet(3);
registry[60].ultra_cinematic_8_scene = createTemplateSet(8);
registry[60].ultra_cinematic_10_scene = createTemplateSet(10);

export const textTemplateRegistry = Object.freeze({
  30: Object.freeze(registry[30]),
  60: Object.freeze(registry[60]),
});

export function getAvailableTextTemplates(duration, videoTemplateId) {
  return textTemplateRegistry[Number(duration)]?.[videoTemplateId] || [];
}

export function getTextTemplate(duration, videoTemplateId, textTemplateId) {
  return getAvailableTextTemplates(duration, videoTemplateId).find((template) => template.id === textTemplateId) || null;
}

export function getTextTemplateVideoTemplateId({ videoMode, duration, sceneTemplateId, sceneCount }) {
  if (videoMode === "ultra_cinematic" && Number(duration) === 60 && [8, 10].includes(Number(sceneCount))) {
    return `ultra_cinematic_${sceneCount}_scene`;
  }
  if (videoMode === "multi_image" && Number(duration) === 30 && MULTI_IMAGE_30_TEMPLATE_IDS.includes(sceneTemplateId)) {
    return sceneTemplateId;
  }
  return null;
}

export function shouldEnableTextTemplates(input) {
  const videoTemplateId = getTextTemplateVideoTemplateId(input);
  return Boolean(videoTemplateId && getAvailableTextTemplates(input.duration, videoTemplateId).length === 3);
}
