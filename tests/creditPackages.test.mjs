import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { CREDIT_PACKAGES, premiumVideoConfig } from "../lib/videoConfig.js";

test("existing credit package ids, prices, and credit amounts remain unchanged", () => {
  assert.deepEqual(
    CREDIT_PACKAGES.slice(0, 3).map(({ id, name, credits, priceUsd }) => ({
      id,
      name,
      credits,
      priceUsd,
    })),
    [
      {
        id: "starter_credits",
        name: "Starter Credits",
        credits: 1200,
        priceUsd: 9,
      },
      {
        id: "growth_credits",
        name: "Growth Credits",
        credits: 3000,
        priceUsd: 19,
      },
      {
        id: "agency_credits",
        name: "Agency Credits",
        credits: 9000,
        priceUsd: 49,
      },
    ],
  );
});

test("new premium credit packages match Ultra Cinematic capacity", () => {
  const pro = CREDIT_PACKAGES.find((pack) => pack.id === "pro_credits_25000");
  const premium = CREDIT_PACKAGES.find((pack) => pack.id === "premium_credits_50000");

  assert.equal(pro?.priceUsd, 149);
  assert.equal(pro?.credits, 25000);
  assert.equal(pro.credits / premiumVideoConfig.creditCost, 10);
  assert.equal(premium?.priceUsd, 299);
  assert.equal(premium?.credits, 50000);
  assert.equal(premium.credits / premiumVideoConfig.creditCost, 20);
});

test("Most Popular badge is assigned to the higher Pro package only", () => {
  assert.equal(CREDIT_PACKAGES.find((pack) => pack.id === "growth_credits")?.badge, undefined);
  assert.equal(CREDIT_PACKAGES.find((pack) => pack.id === "pro_credits_25000")?.badge, "Most Popular");
  assert.equal(CREDIT_PACKAGES.find((pack) => pack.id === "premium_credits_50000")?.badge, undefined);
});

test("new Shopier env keys follow the configured checkout and webhook mapping", async () => {
  const paymentConfig = await readFile(new URL("../lib/paymentConfig.js", import.meta.url), "utf8");

  assert.match(paymentConfig, /pro_credits_25000:\s*"SHOPIER_PRO_CREDITS_25000_URL"/);
  assert.match(paymentConfig, /premium_credits_50000:\s*"SHOPIER_PREMIUM_CREDITS_50000_URL"/);
  assert.match(paymentConfig, /pro_credits_25000:\s*"SHOPIER_PRO_CREDITS_25000_PRODUCT_ID"/);
  assert.match(paymentConfig, /premium_credits_50000:\s*"SHOPIER_PREMIUM_CREDITS_50000_PRODUCT_ID"/);
});
