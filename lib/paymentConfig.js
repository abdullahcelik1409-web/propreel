import { CREDIT_PACKAGES } from "./videoConfig.js";

export const LEMON_SQUEEZY_VARIANT_ID_ENV_KEYS = {
  starter_credits: "LEMON_SQUEEZY_VARIANT_ID_STARTER_CREDITS",
  growth_credits: "LEMON_SQUEEZY_VARIANT_ID_GROWTH_CREDITS",
  agency_credits: "LEMON_SQUEEZY_VARIANT_ID_AGENCY_CREDITS",
  pro_credits_25000: "LEMON_SQUEEZY_VARIANT_ID_PRO_CREDITS_25000",
  premium_credits_50000: "LEMON_SQUEEZY_VARIANT_ID_PREMIUM_CREDITS_50000",
};

export const LEMON_SQUEEZY_PRODUCT_ID_ENV_KEYS = {
  starter_credits: "LEMON_SQUEEZY_PRODUCT_ID_STARTER_CREDITS",
  growth_credits: "LEMON_SQUEEZY_PRODUCT_ID_GROWTH_CREDITS",
  agency_credits: "LEMON_SQUEEZY_PRODUCT_ID_AGENCY_CREDITS",
  pro_credits_25000: "LEMON_SQUEEZY_PRODUCT_ID_PRO_CREDITS_25000",
  premium_credits_50000: "LEMON_SQUEEZY_PRODUCT_ID_PREMIUM_CREDITS_50000",
};

export function getLemonSqueezyVariantId(packageId) {
  const envKey = LEMON_SQUEEZY_VARIANT_ID_ENV_KEYS[packageId];
  if (!envKey) return null;
  return process.env[envKey] || null;
}

export function getLemonSqueezyProductId(packageId) {
  const envKey = LEMON_SQUEEZY_PRODUCT_ID_ENV_KEYS[packageId];
  if (!envKey) return null;
  return process.env[envKey] || null;
}

export function getCreditPackageById(packageId) {
  return CREDIT_PACKAGES.find((creditPackage) => creditPackage.id === packageId) || null;
}

export function getCreditPackageByLemonSqueezyVariantId(variantId) {
  if (!variantId) return null;
  const normalizedVariantId = String(variantId).trim();
  return CREDIT_PACKAGES.find((creditPackage) => getLemonSqueezyVariantId(creditPackage.id) === normalizedVariantId) || null;
}

export function getLemonSqueezyPackageConfig(packageId) {
  const creditPackage = getCreditPackageById(packageId);
  if (!creditPackage) return null;

  const lemonSqueezyVariantId = getLemonSqueezyVariantId(creditPackage.id);
  const lemonSqueezyProductId = getLemonSqueezyProductId(creditPackage.id);

  return {
    ...creditPackage,
    priceUsd: Number(creditPackage.priceUsd),
    currency: creditPackage.currency || "USD",
    billingType: creditPackage.billingType || "one_time",
    lemonSqueezyVariantId,
    lemonSqueezyProductId,
    variantIdConfigured: Boolean(lemonSqueezyVariantId),
    amountMinor: String(Math.round(Number(creditPackage.priceUsd) * 100)),
  };
}

export function getCreditPackagesWithPaymentConfig() {
  return CREDIT_PACKAGES.map((creditPackage) => getLemonSqueezyPackageConfig(creditPackage.id));
}
