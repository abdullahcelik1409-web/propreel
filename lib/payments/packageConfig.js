import { CREDIT_PACKAGES } from "../videoConfig.js";
import { getActivePaymentProvider, resolvePaymentProvider } from "./providerConfig.js";

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

export const POLAR_PRODUCT_ID_ENV_KEYS = {
  starter_credits: "POLAR_PRODUCT_ID_STARTER_CREDITS",
  growth_credits: "POLAR_PRODUCT_ID_GROWTH_CREDITS",
  agency_credits: "POLAR_PRODUCT_ID_AGENCY_CREDITS",
  pro_credits_25000: "POLAR_PRODUCT_ID_PRO_CREDITS_25000",
  premium_credits_50000: "POLAR_PRODUCT_ID_PREMIUM_CREDITS_50000",
};

export const POLAR_PRODUCT_ID_PACKAGE_ENV_KEYS = {
  starter_credits: "POLAR_PRODUCT_ID_PACKAGE_1",
  growth_credits: "POLAR_PRODUCT_ID_PACKAGE_2",
  agency_credits: "POLAR_PRODUCT_ID_PACKAGE_3",
  pro_credits_25000: "POLAR_PRODUCT_ID_PACKAGE_4",
  premium_credits_50000: "POLAR_PRODUCT_ID_PACKAGE_5",
};

export const POLAR_PRICE_ID_ENV_KEYS = {
  starter_credits: "POLAR_PRICE_ID_STARTER_CREDITS",
  growth_credits: "POLAR_PRICE_ID_GROWTH_CREDITS",
  agency_credits: "POLAR_PRICE_ID_AGENCY_CREDITS",
  pro_credits_25000: "POLAR_PRICE_ID_PRO_CREDITS_25000",
  premium_credits_50000: "POLAR_PRICE_ID_PREMIUM_CREDITS_50000",
};

export const POLAR_PRICE_ID_PACKAGE_ENV_KEYS = {
  starter_credits: "POLAR_PRICE_ID_PACKAGE_1",
  growth_credits: "POLAR_PRICE_ID_PACKAGE_2",
  agency_credits: "POLAR_PRICE_ID_PACKAGE_3",
  pro_credits_25000: "POLAR_PRICE_ID_PACKAGE_4",
  premium_credits_50000: "POLAR_PRICE_ID_PACKAGE_5",
};

function envValue(envKey, env = process.env) {
  return envKey ? env[envKey] || null : null;
}

function firstEnvValue(envKeys, env = process.env) {
  return envKeys.map((envKey) => envValue(envKey, env)).find(Boolean) || null;
}

export function getCreditPackageById(packageId) {
  return CREDIT_PACKAGES.find((creditPackage) => creditPackage.id === packageId) || null;
}

export function getProviderProductId(packageId, provider = getActivePaymentProvider(), env = process.env) {
  const resolvedProvider = resolvePaymentProvider(provider, env);
  if (resolvedProvider === "lemon") return envValue(LEMON_SQUEEZY_PRODUCT_ID_ENV_KEYS[packageId], env);
  if (resolvedProvider === "polar") {
    return firstEnvValue([POLAR_PRODUCT_ID_ENV_KEYS[packageId], POLAR_PRODUCT_ID_PACKAGE_ENV_KEYS[packageId]], env);
  }
  return null;
}

export function getProviderPriceId(packageId, provider = getActivePaymentProvider(), env = process.env) {
  const resolvedProvider = resolvePaymentProvider(provider, env);
  if (resolvedProvider === "lemon") return envValue(LEMON_SQUEEZY_VARIANT_ID_ENV_KEYS[packageId], env);
  if (resolvedProvider === "polar") {
    return firstEnvValue([POLAR_PRICE_ID_ENV_KEYS[packageId], POLAR_PRICE_ID_PACKAGE_ENV_KEYS[packageId]], env);
  }
  return null;
}

export function getPackageConfig(packageId, provider = getActivePaymentProvider(), env = process.env) {
  const creditPackage = getCreditPackageById(packageId);
  if (!creditPackage) return null;

  const resolvedProvider = resolvePaymentProvider(provider, env);
  const providerProductId = getProviderProductId(creditPackage.id, resolvedProvider, env);
  const providerPriceId = getProviderPriceId(creditPackage.id, resolvedProvider, env);
  const priceUsd = Number(creditPackage.priceUsd);

  return {
    ...creditPackage,
    packageId: creditPackage.id,
    existingName: creditPackage.name,
    priceUsd,
    currency: creditPackage.currency || "USD",
    billingType: creditPackage.billingType || "one_time",
    limits: creditPackage.limits || null,
    active: creditPackage.active !== false,
    providerProductIds: {
      lemon: getProviderProductId(creditPackage.id, "lemon", env),
      polar: getProviderProductId(creditPackage.id, "polar", env),
      paytr: null,
    },
    providerPriceIds: {
      lemon: getProviderPriceId(creditPackage.id, "lemon", env),
      polar: getProviderPriceId(creditPackage.id, "polar", env),
      paytr: null,
    },
    providerProductId,
    providerPriceId,
    lemonSqueezyVariantId: getProviderPriceId(creditPackage.id, "lemon", env),
    lemonSqueezyProductId: getProviderProductId(creditPackage.id, "lemon", env),
    variantIdConfigured: resolvedProvider === "paytr" ? true : resolvedProvider === "polar" ? Boolean(providerProductId) : Boolean(providerPriceId),
    amountMinor: String(Math.round(priceUsd * 100)),
  };
}

export function getCreditPackagesWithPaymentConfig(provider = getActivePaymentProvider(), env = process.env) {
  return CREDIT_PACKAGES.map((creditPackage) => getPackageConfig(creditPackage.id, provider, env));
}

export function getCreditPackageByProviderPriceId(provider, priceId, env = process.env) {
  if (!priceId) return null;
  const resolvedProvider = resolvePaymentProvider(provider, env);
  const normalizedPriceId = String(priceId).trim();
  return CREDIT_PACKAGES.find((creditPackage) => getProviderPriceId(creditPackage.id, resolvedProvider, env) === normalizedPriceId) || null;
}

export function getCreditPackageByProviderProductId(provider, productId, env = process.env) {
  if (!productId) return null;
  const resolvedProvider = resolvePaymentProvider(provider, env);
  const normalizedProductId = String(productId).trim();
  return CREDIT_PACKAGES.find((creditPackage) => getProviderProductId(creditPackage.id, resolvedProvider, env) === normalizedProductId) || null;
}

export const getLemonSqueezyVariantId = (packageId) => getProviderPriceId(packageId, "lemon");
export const getLemonSqueezyProductId = (packageId) => getProviderProductId(packageId, "lemon");
export const getCreditPackageByLemonSqueezyVariantId = (variantId) => getCreditPackageByProviderPriceId("lemon", variantId);
export const getLemonSqueezyPackageConfig = (packageId) => getPackageConfig(packageId, "lemon");
