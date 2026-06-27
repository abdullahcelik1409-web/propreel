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
import { VIDEO_MODE_ULTRA_CINEMATIC } from "../lib/premiumVideoCore.mjs";

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

test("60 second Ultra Cinematic uses the real application mode constant", () => {
  for (const sceneCount of [8, 10]) {
    const videoTemplateId = getTextTemplateVideoTemplateId({
      videoMode: VIDEO_MODE_ULTRA_CINEMATIC,
      duration: 60,
      sceneTemplateId: "single_photo_hero",
      sceneCount,
    });
    assert.equal(videoTemplateId, `ultra_cinematic_${sceneCount}_scene`);
    assert.equal(getAvailableTextTemplates(60, videoTemplateId).length, 3);
    assert.equal(shouldEnableTextTemplates({
      videoMode: VIDEO_MODE_ULTRA_CINEMATIC,
      duration: 60,
      sceneTemplateId: "single_photo_hero",
      sceneCount,
    }), true);
  }
  assert.equal(shouldEnableTextTemplates({
    videoMode: "ultra_cinematic",
    duration: 60,
    sceneCount: 8,
  }), false);
});

test("30 and 60 second registries use separate pacing structures", () => {
  const thirty = getAvailableTextTemplates(30, "multi_room_flow")[0];
  const sixty = getAvailableTextTemplates(60, "ultra_cinematic_8_scene")[0];
  assert.equal(thirty.sceneTextPlan.length, 3);
  assert.equal(sixty.sceneTextPlan.length, 8);
  assert.match(thirty.description, /Concise three-scene pacing/);
  assert.match(sixty.description, /Long-form 8-scene pacing/);
  assert.notDeepEqual(thirty.sceneTextPlan, sixty.sceneTextPlan.slice(0, 3));
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
  assert.equal(plan.overlays.at(-1).isCta, true);
  assert.equal(plan.overlays.at(-1).primaryContentSlot, "cta");
  assert.equal(plan.overlays.at(-1).layout.yPercent, 82);
  assert.equal(plan.overlays.at(-1).layout.maxWidth, 76);
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
  assert.equal(plan.overlays.at(-1).layout.maxWidth, 46);
  assert.equal(plan.overlays.at(-1).layout.yPercent, 88);
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

test("selected property type overrides a conflicting type inside the user title", () => {
  const cases = [
    { title: "luxxury apertment", propertyType: "Villa", expected: "Luxury Villa" },
    { title: "Modern Apartment", propertyType: "House", expected: "Modern House" },
    { title: "Waterfront Residence", propertyType: "Condo", expected: "Waterfront Condo" },
    { title: "Family Home", propertyType: "Townhouse", expected: "Family Townhouse" },
    { title: "Central Office", propertyType: "Commercial", expected: "Central Commercial Property" },
  ];
  for (const input of cases) {
    assert.equal(resolvePropertyContent(input).title, input.expected);
  }
});

test("different user Listing variables produce different resolved overlays", () => {
  const villa = resolvePropertyContent({
    title: "Luxury Apartment",
    propertyType: "Villa",
    location: "Bodrum",
    bedrooms: 5,
    bathrooms: 4,
    sqft: 3200,
    price: "2,500,000",
    features: ["Private Pool"],
  });
  const condo = resolvePropertyContent({
    title: "City Residence",
    propertyType: "Condo",
    location: "Istanbul",
    bedrooms: 2,
    bathrooms: 1,
    sqft: 950,
    price: "450,000",
    features: ["City View"],
  });
  assert.deepEqual(
    [villa.title, villa.location, villa.specs_summary, villa.price, villa.feature_highlight],
    ["Luxury Villa", "Bodrum", "5 Beds · 4 Baths · 3200 sq ft", "2,500,000", "Private Pool"],
  );
  assert.deepEqual(
    [condo.title, condo.location, condo.specs_summary, condo.price, condo.feature_highlight],
    ["City Condo", "Istanbul", "2 Beds · 1 Bath · 950 sq ft", "450,000", "City View"],
  );
});

test("final overlay plans are resolved independently from each user Listing", () => {
  const cases = [
    { property: { title: "Luxury Apartment", propertyType: "Villa", location: "Bodrum", price: "2,500,000" }, expectedTitle: "Luxury Villa" },
    { property: { title: "City Residence", propertyType: "Condo", location: "Istanbul", price: "450,000" }, expectedTitle: "City Condo" },
  ];
  for (const item of cases) {
    const plan = buildOverlayPlan({
      property: item.property,
      duration: 30,
      videoTemplateId: "multi_room_flow",
      textTemplateId: "classic-listing",
      aspectRatio: "9:16",
      sceneConfig: [{ durationSeconds: 10 }, { durationSeconds: 10 }, { durationSeconds: 10 }],
    });
    assert.equal(plan.overlays[0].primaryText, item.expectedTitle);
    assert.ok(plan.overlays.some((overlay) => overlay.primaryText === item.property.location || overlay.secondaryText === item.property.location));
    assert.equal(plan.overlays.at(-1).primaryText, "DM for details");
  }
});

test("60 second ten-scene plan keeps its real timing and final CTA", () => {
  const plan = buildOverlayPlan({
    property,
    duration: 60,
    videoTemplateId: "ultra_cinematic_10_scene",
    textTemplateId: "social-reel-cta",
    aspectRatio: "1:1",
    sceneConfig: { durations: Array.from({ length: 10 }, () => 6) },
  });
  assert.equal(plan.sceneCount, 10);
  assert.deepEqual(plan.sceneDurations, [6, 6, 6, 6, 6, 6, 6, 6, 6, 6]);
  assert.equal(plan.overlays.at(-1).sceneIndex, 9);
  assert.equal(plan.overlays.at(-1).primaryText, "DM for details");
});

test("overlay planner rejects scene timing that does not match selected duration", () => {
  assert.throws(() => buildOverlayPlan({
    property,
    duration: 30,
    videoTemplateId: "multi_room_flow",
    textTemplateId: "classic-listing",
    aspectRatio: "16:9",
    sceneConfig: [{ durationSeconds: 10 }, { durationSeconds: 10 }, { durationSeconds: 9 }],
  }), /total 29s/);
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
