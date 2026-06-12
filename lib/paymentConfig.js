import { CREDIT_PACKAGES } from "./videoConfig";

export const SHOPIER_PAYMENT_LINK_ENV_KEYS = {
  starter_credits: "SHOPIER_STARTER_CREDITS_LINK",
  growth_credits: "SHOPIER_GROWTH_CREDITS_LINK",
  agency_credits: "SHOPIER_AGENCY_CREDITS_LINK",
  pro_credits_25000: "SHOPIER_PRO_CREDITS_25000_URL",
  premium_credits_50000: "SHOPIER_PREMIUM_CREDITS_50000_URL",
};

export const SHOPIER_PRODUCT_ID_ENV_KEYS = {
  starter_credits: "SHOPIER_STARTER_PRODUCT_ID",
  growth_credits: "SHOPIER_GROWTH_PRODUCT_ID",
  agency_credits: "SHOPIER_AGENCY_PRODUCT_ID",
  pro_credits_25000: "SHOPIER_PRO_CREDITS_25000_PRODUCT_ID",
  premium_credits_50000: "SHOPIER_PREMIUM_CREDITS_50000_PRODUCT_ID",
};

export function getShopierPaymentLink(packageId) {
  const envKey = SHOPIER_PAYMENT_LINK_ENV_KEYS[packageId];
  if (!envKey) return null;
  return process.env[envKey] || null;
}

export function getShopierProductId(packageId) {
  const envKey = SHOPIER_PRODUCT_ID_ENV_KEYS[packageId];
  if (!envKey) return null;
  return process.env[envKey] || null;
}

export function getShopierPackageByProductId(productId) {
  if (!productId) return null;
  const normalizedProductId = String(productId).trim();
  return CREDIT_PACKAGES.find((creditPackage) => getShopierProductId(creditPackage.id) === normalizedProductId) || null;
}

export function getCreditPackagesWithPaymentLinks() {
  return CREDIT_PACKAGES.map((creditPackage) => ({
    ...creditPackage,
    paymentUrl: getShopierPaymentLink(creditPackage.id),
    shopierProductId: getShopierProductId(creditPackage.id),
  }));
}
