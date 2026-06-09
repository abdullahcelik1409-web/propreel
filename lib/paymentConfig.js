import { CREDIT_PACKAGES } from "./videoConfig";

export const IYZICO_PAYMENT_LINK_ENV_KEYS = {
  starter_credits: "IYZICO_STARTER_CREDITS_LINK",
  growth_credits: "IYZICO_GROWTH_CREDITS_LINK",
  agency_credits: "IYZICO_AGENCY_CREDITS_LINK",
};

export function getIyzicoPaymentLink(packageId) {
  const envKey = IYZICO_PAYMENT_LINK_ENV_KEYS[packageId];
  if (!envKey) return null;
  return process.env[envKey] || null;
}

export function getCreditPackagesWithPaymentLinks() {
  return CREDIT_PACKAGES.map((creditPackage) => ({
    ...creditPackage,
    paymentUrl: getIyzicoPaymentLink(creditPackage.id),
  }));
}
