import { getTextTemplate } from "./registry.mjs";
import { resolvePropertyContent } from "./resolvers.mjs";
import { ANIMATION_PRESETS, TEXT_TEMPLATE_ASPECT_RATIOS } from "./types.mjs";

const FALLBACK_SLOT_ORDER = Object.freeze([
  "title",
  "property_type",
  "location",
  "feature_highlight",
  "specs_summary",
  "price",
  "feature_highlight_2",
  "hook",
  "cta",
]);

const ASPECT_LAYOUTS = Object.freeze({
  "9:16": Object.freeze({ safeAreaX: 7, safeAreaY: 8, maxWidth: 82, primaryScale: 1, secondaryScale: 0.62 }),
  "16:9": Object.freeze({ safeAreaX: 6, safeAreaY: 9, maxWidth: 58, primaryScale: 0.82, secondaryScale: 0.52 }),
  "1:1": Object.freeze({ safeAreaX: 7, safeAreaY: 8, maxWidth: 72, primaryScale: 0.9, secondaryScale: 0.56 }),
});

function round(value) {
  return Number(Number(value).toFixed(3));
}

function getSceneDurations(sceneConfig, duration, expectedSceneCount) {
  const rawScenes = Array.isArray(sceneConfig) ? sceneConfig : sceneConfig?.scenes;
  if (Array.isArray(rawScenes) && rawScenes.length) {
    return rawScenes.map((scene) => Number(scene.durationSeconds || scene.targetDuration || scene.duration || 0));
  }
  if (Array.isArray(sceneConfig?.durations) && sceneConfig.durations.length) {
    return sceneConfig.durations.map(Number);
  }
  const count = Math.max(Number(expectedSceneCount) || 1, 1);
  return Array.from({ length: count }, () => Number(duration) / count);
}

function getPositionLayout(aspectRatio, position) {
  const ratio = ASPECT_LAYOUTS[aspectRatio] || ASPECT_LAYOUTS["16:9"];
  const centered = position === "lower-center";
  const y = position === "upper-left" ? ratio.safeAreaY : position === "center-left" ? 48 : 100 - ratio.safeAreaY;
  return {
    ...ratio,
    xPercent: centered ? 50 : ratio.safeAreaX,
    yPercent: y,
    anchorX: centered ? "center" : "left",
    anchorY: position.startsWith("lower") ? "bottom" : position === "center-left" ? "center" : "top",
  };
}

function takeUniqueContent(candidateSlots, content, usedText) {
  for (const slot of candidateSlots || []) {
    const value = String(content[slot] || "").trim();
    const fingerprint = value.toLocaleLowerCase("en-US");
    if (value && !usedText.has(fingerprint)) {
      usedText.add(fingerprint);
      return value;
    }
  }
  return "";
}

function normalizeSceneCandidates(scenePlan, sceneIndex, lastSceneIndex) {
  if (sceneIndex === lastSceneIndex) {
    return { primary: ["cta", ...(scenePlan.primary || [])], secondary: ["price", ...(scenePlan.secondary || [])] };
  }
  return {
    primary: (scenePlan.primary || []).filter((slot) => slot !== "cta"),
    secondary: (scenePlan.secondary || []).filter((slot) => slot !== "cta"),
  };
}

export function buildOverlayPlan({
  property,
  duration,
  videoTemplateId,
  textTemplateId,
  aspectRatio,
  sceneConfig,
}) {
  const normalizedDuration = Number(duration);
  const normalizedAspectRatio = TEXT_TEMPLATE_ASPECT_RATIOS.includes(aspectRatio) ? aspectRatio : "16:9";
  const template = getTextTemplate(normalizedDuration, videoTemplateId, textTemplateId);
  if (!template) {
    throw new Error("Selected text template is not compatible with this duration and video template.");
  }

  const expectedSceneCount = template.supportedSceneCounts[0];
  const durations = getSceneDurations(sceneConfig, normalizedDuration, expectedSceneCount);
  if (!template.supportedSceneCounts.includes(durations.length)) {
    throw new Error(`Text template ${template.id} does not support ${durations.length} scenes.`);
  }
  if (durations.some((value) => !Number.isFinite(value) || value <= 0)) {
    throw new Error("Scene durations must contain positive numeric values.");
  }
  const plannedDuration = durations.reduce((sum, value) => sum + value, 0);
  if (Math.abs(plannedDuration - normalizedDuration) > 0.05) {
    throw new Error(`Scene durations total ${plannedDuration}s but the selected video duration is ${normalizedDuration}s.`);
  }

  const content = resolvePropertyContent(property);
  const usedText = new Set();
  const overlays = [];
  let cursor = 0;

  durations.forEach((sceneDuration, sceneIndex) => {
    const sceneStart = cursor;
    const sceneEnd = cursor + sceneDuration;
    cursor = sceneEnd;
    const sourcePlan = template.sceneTextPlan[sceneIndex] || template.sceneTextPlan.at(-1);
    if (!sourcePlan) throw new Error(`Text template ${template.id} has no plan for scene ${sceneIndex + 1}.`);
    const candidates = normalizeSceneCandidates(sourcePlan, sceneIndex, durations.length - 1);
    let primaryText = takeUniqueContent(candidates.primary, content, usedText);
    if (!primaryText) primaryText = takeUniqueContent(FALLBACK_SLOT_ORDER.filter((slot) => slot !== "cta"), content, usedText);
    if (!primaryText && sceneIndex === durations.length - 1) primaryText = content.cta;
    if (!primaryText) return;

    const secondaryText = takeUniqueContent(candidates.secondary, content, usedText) || null;
    const animation = ANIMATION_PRESETS[sourcePlan.animation] || ANIMATION_PRESETS.softFade;
    const enterPadding = Math.min(0.65, Math.max(0.22, sceneDuration * 0.1));
    const exitPadding = Math.min(0.5, Math.max(0.2, sceneDuration * 0.08));
    const start = sceneStart + enterPadding;
    const end = Math.max(start + Math.min(1.2, sceneDuration * 0.55), sceneEnd - exitPadding);

    overlays.push({
      sceneIndex,
      start: round(start),
      end: round(Math.min(end, sceneEnd)),
      primaryText,
      secondaryText,
      position: sourcePlan.position,
      align: sourcePlan.position === "lower-center" ? "center" : "left",
      animationIn: animation.animationIn,
      animationOut: animation.animationOut,
      animationDurationIn: round(Math.min(animation.enterSeconds, sceneDuration * 0.18)),
      animationDurationOut: round(Math.min(animation.exitSeconds, sceneDuration * 0.15)),
      styleVariant: template.styleVariant,
      layout: getPositionLayout(normalizedAspectRatio, sourcePlan.position),
    });
  });

  return Object.freeze({
    selectedTextTemplateId: template.id,
    textTemplateName: template.name,
    duration: normalizedDuration,
    videoTemplateId,
    aspectRatio: normalizedAspectRatio,
    sceneCount: durations.length,
    sceneDurations: durations.map(round),
    overlays,
  });
}
