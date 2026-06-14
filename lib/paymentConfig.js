import { CREDIT_PACKAGES } from "./videoConfig.js";

export const PADDLE_PRICE_ID_ENV_KEYS = {
  starter_credits: "PADDLE_PRICE_ID_STARTER_CREDITS",
  growth_credits: "PADDLE_PRICE_ID_GROWTH_CREDITS",
  agency_credits: "PADDLE_PRICE_ID_AGENCY_CREDITS",
  pro_credits_25000: "PADDLE_PRICE_ID_PRO_CREDITS_25000",
  premium_credits_50000: "PADDLE_PRICE_ID_PREMIUM_CREDITS_50000",
};

export const PADDLE_PRODUCT_ID_ENV_KEYS = {
  starter_credits: "PADDLE_PRODUCT_ID_STARTER_CREDITS",
  growth_credits: "PADDLE_PRODUCT_ID_GROWTH_CREDITS",
  agency_credits: "PADDLE_PRODUCT_ID_AGENCY_CREDITS",
  pro_credits_25000: "PADDLE_PRODUCT_ID_PRO_CREDITS_25000",
  premium_credits_50000: "PADDLE_PRODUCT_ID_PREMIUM_CREDITS_50000",
};

export function getPaddlePriceId(packageId) {
  const envKey = PADDLE_PRICE_ID_ENV_KEYS[packageId];
  if (!envKey) return null;
  return process.env[envKey] || null;
}

export function getPaddleProductId(packageId) {
  const envKey = PADDLE_PRODUCT_ID_ENV_KEYS[packageId];
  if (!envKey) return null;
  return process.env[envKey] || null;
}

export function getCreditPackageById(packageId) {
  return CREDIT_PACKAGES.find((creditPackage) => creditPackage.id === packageId) || null;
}

export function getCreditPackageByPaddlePriceId(priceId) {
  if (!priceId) return null;
  const normalizedPriceId = String(priceId).trim();
  return CREDIT_PACKAGES.find((creditPackage) => getPaddlePriceId(creditPackage.id) === normalizedPriceId) || null;
}

export function getPaddlePackageConfig(packageId) {
  const creditPackage = getCreditPackageById(packageId);
  if (!creditPackage) return null;

  const paddlePriceId = getPaddlePriceId(creditPackage.id);
  const paddleProductId = getPaddleProductId(creditPackage.id);

  return {
    ...creditPackage,
    priceUsd: Number(creditPackage.priceUsd),
    currency: creditPackage.currency || "USD",
    billingType: creditPackage.billingType || "one_time",
    paddlePriceId,
    paddleProductId,
    priceIdConfigured: Boolean(paddlePriceId),
    amountMinor: String(Math.round(Number(creditPackage.priceUsd) * 100)),
  };
}

export function getCreditPackagesWithPaymentConfig() {
  return CREDIT_PACKAGES.map((creditPackage) => getPaddlePackageConfig(creditPackage.id));
}
