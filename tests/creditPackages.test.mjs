import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { CREDIT_PACKAGES, premiumVideoConfig } from "../lib/videoConfig.js";

test("credit package ids, USD prices, and credit amounts remain configured", () => {
  assert.deepEqual(
    CREDIT_PACKAGES.map(({ id, name, credits, priceUsd, currency, billingType }) => ({
      id,
      name,
      credits,
      priceUsd,
      currency,
      billingType,
    })),
    [
      {
        id: "starter_credits",
        name: "Starter Credits",
        credits: 1200,
        priceUsd: 9,
        currency: "USD",
        billingType: "one_time",
      },
      {
        id: "growth_credits",
        name: "Growth Credits",
        credits: 3000,
        priceUsd: 19,
        currency: "USD",
        billingType: "one_time",
      },
      {
        id: "agency_credits",
        name: "Agency Credits",
        credits: 9000,
        priceUsd: 49,
        currency: "USD",
        billingType: "one_time",
      },
      {
        id: "pro_credits_25000",
        name: "Pro Credits",
        credits: 25000,
        priceUsd: 149,
        currency: "USD",
        billingType: "one_time",
      },
      {
        id: "premium_credits_50000",
        name: "Premium Credits",
        credits: 50000,
        priceUsd: 299,
        currency: "USD",
        billingType: "one_time",
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

test("Paddle env keys follow the configured checkout and webhook mapping", async () => {
  const paymentConfig = await readFile(new URL("../lib/paymentConfig.js", import.meta.url), "utf8");

  assert.match(paymentConfig, /pro_credits_25000:\s*"PADDLE_PRICE_ID_PRO_CREDITS_25000"/);
  assert.match(paymentConfig, /premium_credits_50000:\s*"PADDLE_PRICE_ID_PREMIUM_CREDITS_50000"/);
  assert.match(paymentConfig, /pro_credits_25000:\s*"PADDLE_PRODUCT_ID_PRO_CREDITS_25000"/);
  assert.match(paymentConfig, /premium_credits_50000:\s*"PADDLE_PRODUCT_ID_PREMIUM_CREDITS_50000"/);
  assert.match(paymentConfig, /PADDLE_PRICE_ID_STARTER_CREDITS/);
});
