import { CREDIT_PACKAGES } from "./videoConfig";

export const SHOPIER_PAYMENT_LINK_ENV_KEYS = {
  starter_credits: "SHOPIER_STARTER_CREDITS_LINK",
  growth_credits: "SHOPIER_GROWTH_CREDITS_LINK",
  agency_credits: "SHOPIER_AGENCY_CREDITS_LINK",
};

export function getShopierPaymentLink(packageId) {
  const envKey = SHOPIER_PAYMENT_LINK_ENV_KEYS[packageId];
  if (!envKey) return null;
  return process.env[envKey] || null;
}

export function getCreditPackagesWithPaymentLinks() {
  return CREDIT_PACKAGES.map((creditPackage) => ({
    ...creditPackage,
    paymentUrl: getShopierPaymentLink(creditPackage.id),
  }));
}
