import crypto from "crypto";

const PAYTR_TOKEN_URL = "https://www.paytr.com/odeme/api/get-token";

function normalizeString(value) {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized || null;
}

function apiError(message, status, payload) {
  const error = new Error(message);
  error.status = status;
  error.payload = payload;
  return error;
}

function hmacBase64(secret, value) {
  return crypto.createHmac("sha256", secret).update(value, "utf8").digest("base64");
}

function timingSafeStringEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function formEncode(input) {
  const form = new URLSearchParams();
  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined && value !== null) form.set(key, String(value));
  });
  return form;
}

function getHeaderIp(headers) {
  const forwarded = headers?.get?.("x-forwarded-for");
  return normalizeString(forwarded?.split(",")?.[0]) || normalizeString(headers?.get?.("x-real-ip")) || "127.0.0.1";
}

export const paytrAdapter = {
  provider: "paytr",

  isConfigured(env = process.env) {
    return Boolean(env.PAYTR_MERCHANT_ID && env.PAYTR_MERCHANT_KEY && env.PAYTR_MERCHANT_SALT);
  },

  async createCheckout({ packageConfig, user, internalOrderId, successUrl, cancelUrl, headers, metadata = {}, env = process.env }) {
    if (!this.isConfigured(env)) throw apiError("PayTR merchant credentials are not configured.", 503);

    const merchantOid = internalOrderId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 64);
    const email = user.email || "customer@getviseo.com";
    const amountMinor = Math.round(Number(packageConfig.priceUsd) * 100);
    const basket = Buffer.from(JSON.stringify([[packageConfig.name, packageConfig.priceUsd.toFixed(2), 1]])).toString("base64");
    const userIp = normalizeString(metadata.user_ip) || getHeaderIp(headers);
    const noInstallment = env.PAYTR_NO_INSTALLMENT || "0";
    const maxInstallment = env.PAYTR_MAX_INSTALLMENT || "0";
    const currency = packageConfig.currency || "USD";
    const testMode = env.PAYTR_TEST_MODE || "0";
    const hashStr = `${env.PAYTR_MERCHANT_ID}${userIp}${merchantOid}${email}${amountMinor}${basket}${noInstallment}${maxInstallment}${currency}${testMode}`;
    const paytrToken = hmacBase64(env.PAYTR_MERCHANT_KEY, `${hashStr}${env.PAYTR_MERCHANT_SALT}`);

    const response = await fetch(PAYTR_TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: formEncode({
        merchant_id: env.PAYTR_MERCHANT_ID,
        user_ip: userIp,
        merchant_oid: merchantOid,
        email,
        payment_amount: amountMinor,
        paytr_token: paytrToken,
        user_basket: basket,
        debug_on: env.PAYTR_DEBUG_ON || "0",
        no_installment: noInstallment,
        max_installment: maxInstallment,
        user_name: user.name || email,
        user_address: env.PAYTR_USER_ADDRESS_FALLBACK || "Digital delivery",
        user_phone: env.PAYTR_USER_PHONE_FALLBACK || "0000000000",
        merchant_ok_url: successUrl,
        merchant_fail_url: cancelUrl,
        timeout_limit: env.PAYTR_TIMEOUT_LIMIT || "30",
        currency,
        test_mode: testMode,
        lang: env.PAYTR_LANG || "en",
      }),
      cache: "no-store",
    });

    const payload = await response.json().catch(async () => ({ raw: await response.text().catch(() => "") }));
    if (!response.ok || payload.status !== "success" || !payload.token) {
      throw apiError("PayTR checkout token could not be created.", response.status || 502, payload);
    }

    return {
      provider: this.provider,
      checkoutUrl: `https://www.paytr.com/odeme/guvenli/${payload.token}`,
      internalOrderId,
      providerCheckoutId: payload.token,
      providerTransactionId: merchantOid,
      rawPayload: payload,
    };
  },

  verifyWebhook(rawBody, headers, env = process.env) {
    if (!this.isConfigured(env)) throw apiError("PayTR merchant credentials are not configured.", 500);
    const contentType = headers.get("content-type") || "";
    const params = contentType.includes("application/json") ? JSON.parse(rawBody) : Object.fromEntries(new URLSearchParams(rawBody));
    const hashStr = `${params.merchant_oid || ""}${env.PAYTR_MERCHANT_SALT}${params.status || ""}${params.total_amount || ""}`;
    const expected = hmacBase64(env.PAYTR_MERCHANT_KEY, hashStr);
    return Boolean(params.hash) && timingSafeStringEqual(String(params.hash), expected);
  },

  parseWebhook(rawBody, headers) {
    const contentType = headers.get("content-type") || "";
    const payload = contentType.includes("application/json") ? JSON.parse(rawBody) : Object.fromEntries(new URLSearchParams(rawBody));
    const merchantOid = normalizeString(payload.merchant_oid);
    const metadata = payload.metadata && typeof payload.metadata === "object" ? payload.metadata : {};

    return {
      provider: this.provider,
      eventId: merchantOid ? `paytr:${merchantOid}:${payload.status || "callback"}` : normalizeString(payload.event_id),
      eventType: "payment_callback",
      status: payload.status === "success" ? "paid" : "failed",
      userId: normalizeString(payload.user_id || metadata.user_id),
      packageId: normalizeString(payload.package_id || metadata.package_id),
      providerTransactionId: merchantOid,
      providerCheckoutId: normalizeString(payload.token),
      providerCustomerId: normalizeString(payload.customer_id),
      providerSubscriptionId: null,
      providerProductId: null,
      providerPriceId: null,
      amount: payload.total_amount ? (Number(payload.total_amount) / 100).toFixed(2) : null,
      currency: normalizeString(payload.currency) || "USD",
      buyerEmail: normalizeString(payload.email),
      buyerName: normalizeString(payload.user_name),
      internalOrderId: merchantOid,
      taxAmount: null,
      rawPayload: payload,
    };
  },

  refundPayment() {
    throw apiError("Refunds are not automated in Viseo for PayTR; review the request in admin/support and process the PayTR refund manually.", 501);
  },
};
