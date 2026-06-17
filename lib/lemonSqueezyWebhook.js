import { processPaymentWebhook } from "./payments/paymentService.js";
import { verifyLemonSqueezySignature } from "./payments/providers/lemon.js";

export { verifyLemonSqueezySignature };

export async function processLemonSqueezyWebhook({ rawBody, signatureHeader }) {
  const headers = new Headers();
  if (signatureHeader) headers.set("x-signature", signatureHeader);
  return processPaymentWebhook({ provider: "lemon", rawBody, headers });
}
