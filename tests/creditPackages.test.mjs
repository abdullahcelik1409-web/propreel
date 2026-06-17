import test from "node:test";
import assert from "node:assert/strict";
import { CREDIT_PACKAGES, premiumVideoConfig } from "../lib/videoConfig.js";
import { LEMON_SQUEEZY_PRODUCT_ID_ENV_KEYS, LEMON_SQUEEZY_VARIANT_ID_ENV_KEYS, getCreditPackagesWithPaymentConfig } from "../lib/paymentConfig.js";
import { getPaymentProviderConfig, paymentProviderConfig } from "../lib/payments/providerConfig.js";

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

test("Lemon Squeezy env keys follow the configured checkout and webhook mapping", () => {
  assert.equal(LEMON_SQUEEZY_VARIANT_ID_ENV_KEYS.pro_credits_25000, "LEMON_SQUEEZY_VARIANT_ID_PRO_CREDITS_25000");
  assert.equal(LEMON_SQUEEZY_VARIANT_ID_ENV_KEYS.premium_credits_50000, "LEMON_SQUEEZY_VARIANT_ID_PREMIUM_CREDITS_50000");
  assert.equal(LEMON_SQUEEZY_PRODUCT_ID_ENV_KEYS.pro_credits_25000, "LEMON_SQUEEZY_PRODUCT_ID_PRO_CREDITS_25000");
  assert.equal(LEMON_SQUEEZY_PRODUCT_ID_ENV_KEYS.premium_credits_50000, "LEMON_SQUEEZY_PRODUCT_ID_PREMIUM_CREDITS_50000");
  assert.equal(LEMON_SQUEEZY_VARIANT_ID_ENV_KEYS.starter_credits, "LEMON_SQUEEZY_VARIANT_ID_STARTER_CREDITS");
});

test("payment package config resolves all packages for the active provider without trusting client prices", () => {
  const packages = getCreditPackagesWithPaymentConfig("paytr");
  assert.equal(packages.length, 5);
  assert.deepEqual(
    packages.map(({ id, priceUsd, currency, credits, active }) => ({ id, priceUsd, currency, credits, active })),
    CREDIT_PACKAGES.map(({ id, priceUsd, currency, credits }) => ({ id, priceUsd, currency, credits, active: true })),
  );
});

test("provider legal model changes payment copy", () => {
  assert.equal(getPaymentProviderConfig("lemon").legalModel, "merchant_of_record");
  assert.equal(getPaymentProviderConfig("polar").legalModel, "merchant_of_record");
  assert.equal(getPaymentProviderConfig("paytr").legalModel, "payment_processor");
  assert.match(paymentProviderConfig.paytr.pricingPaymentNote, /remains responsible for tax, invoicing, and refund handling/);
});
