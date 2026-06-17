import { lemonAdapter } from "./payments/providers/lemon.js";

export function isLemonSqueezyApiConfigured(env = process.env) {
  return Boolean(env.LEMON_SQUEEZY_API_KEY && env.LEMON_SQUEEZY_STORE_ID);
}

export async function lemonSqueezyApiRequest() {
  throw new Error("Direct Lemon Squeezy API calls moved to the Lemon payment adapter.");
}

export async function createLemonSqueezyCheckout({ packageConfig, user, internalOrderId, appUrl }) {
  const baseUrl = String(appUrl || "").replace(/\/$/, "");
  return lemonAdapter.createCheckout({
    packageConfig: {
      ...packageConfig,
      providerPriceId: packageConfig.providerPriceId || packageConfig.lemonSqueezyVariantId,
      providerProductId: packageConfig.providerProductId || packageConfig.lemonSqueezyProductId,
    },
    user,
    internalOrderId,
    successUrl: baseUrl ? `${baseUrl}/payments/success` : null,
    cancelUrl: baseUrl ? `${baseUrl}/payments/cancel` : null,
  });
}
