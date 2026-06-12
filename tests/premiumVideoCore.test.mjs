import test from "node:test";
import assert from "node:assert/strict";

import {
  PREMIUM_GENERATE_ACTION,
  VIDEO_MODE_ULTRA_CINEMATIC,
  buildPremiumScenePlan,
  canUseRealPremiumProvider,
  getPremiumDurationPlan,
  premiumVideoConfig,
  resolvePremiumProviderMode,
  validatePremiumCredits,
  validatePremiumPhotoCount,
} from "../lib/premiumVideoCore.mjs";

function photos(count) {
  return Array.from({ length: count }, (_, index) => `https://cdn.example.com/listing-${index + 1}.jpg`);
}

test("premium duration planner returns 60 seconds for 8 photos", () => {
  const plan = getPremiumDurationPlan(8);

  assert.equal(plan.valid, true);
  assert.deepEqual(plan.durations, [8, 7, 8, 7, 8, 7, 8, 7]);
  assert.equal(plan.totalDuration, 60);
});

test("premium duration planner returns 60 seconds for 10 photos", () => {
  const plan = getPremiumDurationPlan(10);

  assert.equal(plan.valid, true);
  assert.deepEqual(plan.durations, [6, 6, 6, 6, 6, 6, 6, 6, 6, 6]);
  assert.equal(plan.totalDuration, 60);
});

test("premium photo validation rejects unsupported counts", () => {
  assert.equal(validatePremiumPhotoCount(7).valid, false);
  assert.equal(validatePremiumPhotoCount(9).valid, false);
  assert.equal(validatePremiumPhotoCount(11).valid, false);
});

test("premium credit validation requires 2500 credits", () => {
  assert.equal(validatePremiumCredits(2499).valid, false);
  assert.equal(validatePremiumCredits(2500).valid, true);
  assert.equal(validatePremiumCredits(3000).requiredCredits, premiumVideoConfig.creditCost);
});

test("test runtime always resolves to mock provider mode", () => {
  const mode = resolvePremiumProviderMode({
    NODE_ENV: "test",
    PREMIUM_VIDEO_PROVIDER_MODE: "real",
    CI: "false",
  });

  assert.equal(mode, "mock");
});

test("CI runtime always resolves to mock provider mode", () => {
  const mode = resolvePremiumProviderMode({
    NODE_ENV: "production",
    PREMIUM_VIDEO_PROVIDER_MODE: "real",
    CI: "true",
  });

  assert.equal(mode, "mock");
});

test("real provider guard requires authenticated user, real UI action, valid count, and credits", () => {
  const allowed = canUseRealPremiumProvider({
    env: { NODE_ENV: "production", CI: "false" },
    providerMode: "real",
    user: { id: "user_1" },
    generationAction: PREMIUM_GENERATE_ACTION,
    videoMode: VIDEO_MODE_ULTRA_CINEMATIC,
    selectedImageUrls: photos(8),
    currentCredits: 2500,
  });
  const missingAction = canUseRealPremiumProvider({
    env: { NODE_ENV: "production", CI: "false" },
    providerMode: "real",
    user: { id: "user_1" },
    generationAction: "smoke_test",
    videoMode: VIDEO_MODE_ULTRA_CINEMATIC,
    selectedImageUrls: photos(8),
    currentCredits: 2500,
  });

  assert.equal(allowed.allowed, true);
  assert.equal(missingAction.allowed, false);
});

test("premium scene plan includes continuity context after the first scene", () => {
  const plan = buildPremiumScenePlan({
    listing: {
      title: "Luxury Villa",
      location: "Istanbul",
      propertyType: "Villa",
    },
    selectedImageUrls: photos(8),
  });

  assert.equal(plan.sceneCount, 8);
  assert.match(plan.scenes[1].prompt, /Continue from the previous shot/);
  assert.ok(plan.scenes[1].transitionToNext);
});
