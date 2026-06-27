export const TEXT_TEMPLATE_DURATIONS = Object.freeze([30, 60]);
export const TEXT_TEMPLATE_ASPECT_RATIOS = Object.freeze(["9:16", "16:9", "1:1"]);

export const CONTENT_SLOTS = Object.freeze([
  "title",
  "property_type",
  "location",
  "price",
  "specs_summary",
  "feature_highlight",
  "feature_highlight_2",
  "hook",
  "cta",
]);

export const POSITION_PRESETS = Object.freeze([
  "upper-left",
  "center-left",
  "lower-left",
  "lower-center",
]);

export const ANIMATION_PRESETS = Object.freeze({
  fadeUp: Object.freeze({ animationIn: "fadeUp", animationOut: "fadeOut", enterSeconds: 0.55, exitSeconds: 0.45 }),
  blurReveal: Object.freeze({ animationIn: "blurReveal", animationOut: "fadeOut", enterSeconds: 0.7, exitSeconds: 0.5 }),
  softFade: Object.freeze({ animationIn: "softFade", animationOut: "fadeOut", enterSeconds: 0.65, exitSeconds: 0.5 }),
});

/**
 * @typedef {"title"|"property_type"|"location"|"price"|"specs_summary"|"feature_highlight"|"feature_highlight_2"|"hook"|"cta"} ContentSlot
 * @typedef {"9:16"|"16:9"|"1:1"} AspectRatio
 * @typedef {"upper-left"|"center-left"|"lower-left"|"lower-center"} PositionPreset
 * @typedef {{ primary: ContentSlot[], secondary?: ContentSlot[], position: PositionPreset, animation: keyof typeof ANIMATION_PRESETS }} SceneTextPlanItem
 * @typedef {{ id: string, name: string, description: string, supportedAspectRatios: AspectRatio[], supportedSceneCounts: number[], tone: string, styleVariant: string, sceneTextPlan: SceneTextPlanItem[], preview: { accent: string, surface: string, summary: string } }} TextTemplateDefinition
 * @typedef {{ sceneIndex: number, start: number, end: number, primaryText: string, secondaryText: string|null, position: PositionPreset, align: "left"|"center", animationIn: string, animationOut: string, animationDurationIn: number, animationDurationOut: number, styleVariant: string, layout: Record<string, number|string> }} ResolvedTextOverlay
 */

export function assertTextTemplateDefinition(template) {
  if (!template || typeof template !== "object") throw new TypeError("Text template must be an object.");
  if (!template.id || !template.name || !Array.isArray(template.sceneTextPlan)) {
    throw new TypeError("Text template requires id, name, and sceneTextPlan.");
  }
  if (!template.supportedAspectRatios?.every((ratio) => TEXT_TEMPLATE_ASPECT_RATIOS.includes(ratio))) {
    throw new TypeError(`Text template ${template.id} contains an unsupported aspect ratio.`);
  }
  if (!template.sceneTextPlan.every((scene) => POSITION_PRESETS.includes(scene.position) && ANIMATION_PRESETS[scene.animation])) {
    throw new TypeError(`Text template ${template.id} contains an invalid scene plan.`);
  }
  return template;
}
