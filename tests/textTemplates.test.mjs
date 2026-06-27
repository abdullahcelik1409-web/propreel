import test from "node:test";
import assert from "node:assert/strict";

import { buildOverlayPlan } from "../lib/text-templates/buildOverlayPlan.mjs";
import {
  getAvailableTextTemplates,
  getTextTemplateVideoTemplateId,
  shouldEnableTextTemplates,
  textTemplateRegistry,
} from "../lib/text-templates/registry.mjs";
import { resolvePropertyContent } from "../lib/text-templates/resolvers.mjs";

const property = {
  title: "Luxury Bosphorus Residence",
  propertyType: "apartment",
  location: "Bebek, Istanbul",
  bedrooms: 3,
  bathrooms: 2,
  sqft: 1850,
  price: "1,250,000",
  currency: "USD",
  features: ["Bosphorus View", "Private Terrace"],
};

test("every supported video template exposes exactly three text templates", () => {
  for (const duration of Object.keys(textTemplateRegistry)) {
    for (const templates of Object.values(textTemplateRegistry[duration])) {
      assert.equal(templates.length, 3);
      assert.equal(new Set(templates.map((template) => template.id)).size, 3);
    }
  }
});

test("30 second multi-image selection resolves to its scene direction", () => {
  const videoTemplateId = getTextTemplateVideoTemplateId({
    videoMode: "multi_image",
    duration: 30,
    sceneTemplateId: "feature_sequence",
    sceneCount: 3,
  });
  assert.equal(videoTemplateId, "feature_sequence");
  assert.equal(getAvailableTextTemplates(30, videoTemplateId).length, 3);
});

test("10 second single-scene video keeps text template feature disabled", () => {
  assert.equal(shouldEnableTextTemplates({
    videoMode: "multi_image",
    duration: 10,
    sceneTemplateId: "multi_room_flow",
    sceneCount: 1,
  }), false);
});

test("overlay plan follows real scene durations and does not repeat text", () => {
  const plan = buildOverlayPlan({
    property,
    duration: 30,
    videoTemplateId: "multi_room_flow",
    textTemplateId: "classic-listing",
    aspectRatio: "9:16",
    sceneConfig: [
      { durationSeconds: 9 },
      { durationSeconds: 7 },
      { durationSeconds: 14 },
    ],
  });

  assert.deepEqual(plan.sceneDurations, [9, 7, 14]);
  assert.equal(plan.overlays.at(-1).primaryText, "DM for details");
  const allText = plan.overlays.flatMap((overlay) => [overlay.primaryText, overlay.secondaryText]).filter(Boolean).map((value) => value.toLowerCase());
  assert.equal(new Set(allText).size, allText.length);
  assert.equal(plan.overlays[0].layout.maxWidth, 82);
});

test("60 second plan supports the actual eight-scene premium duration plan", () => {
  const plan = buildOverlayPlan({
    property,
    duration: 60,
    videoTemplateId: "ultra_cinematic_8_scene",
    textTemplateId: "elegant-minimal",
    aspectRatio: "16:9",
    sceneConfig: { durations: [8, 7, 8, 7, 8, 7, 8, 7] },
  });
  assert.equal(plan.sceneCount, 8);
  assert.equal(plan.sceneDurations.reduce((sum, value) => sum + value, 0), 60);
  assert.equal(plan.overlays.at(-1).primaryText, "DM for details");
  assert.equal(plan.overlays[0].layout.maxWidth, 58);
});

test("property resolver applies English fallbacks when optional data is missing", () => {
  const content = resolvePropertyContent({ propertyType: "villa", city: "Antalya", bedrooms: 4, bathrooms: 3 });
  assert.equal(content.title, "Villa in Antalya");
  assert.equal(content.location, "Antalya");
  assert.equal(content.specs_summary, "4 Beds · 3 Baths");
  assert.equal(content.cta, "DM for details");
  assert.equal(content.price, "");
});

test("resolver does not leak common Turkish listing copy into English overlays", () => {
  const content = resolvePropertyContent({
    title: "Satilik luks daire",
    propertyType: "daire",
    city: "Istanbul",
    contact_cta: "Detaylar icin mesaj",
  });
  assert.equal(content.title, "Apartment in Istanbul");
  assert.equal(content.property_type, "Apartment");
  assert.equal(content.cta, "DM for details");
});

test("incompatible template selection fails closed", () => {
  assert.throws(() => buildOverlayPlan({
    property,
    duration: 10,
    videoTemplateId: "multi_room_flow",
    textTemplateId: "classic-listing",
    aspectRatio: "1:1",
    sceneConfig: [{ durationSeconds: 10 }],
  }), /not compatible/);
});
