import crypto from "crypto";

const POLAR_API_BASE_URL = "https://api.polar.sh/v1";

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

function hmacHex(secret, value) {
  return crypto.createHmac("sha256", secret).update(value, "utf8").digest("hex");
}

function timingSafeStringEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

async function polarApiRequest(path, { method = "GET", body, env = process.env } = {}) {
  const token = env.POLAR_ACCESS_TOKEN;
  if (!token) throw apiError("Polar access token is not configured.", 500);

  const response = await fetch(new URL(path.replace(/^\//, ""), `${POLAR_API_BASE_URL}/`), {
    method,
    headers: {
      accept: "application/json",
      authorization: `Bearer ${token}`,
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }
  }

  if (!response.ok) throw apiError(`Polar API request failed with ${response.status}.`, response.status, payload);
  return payload;
}

function getMetadata(payload) {
  return payload?.metadata || payload?.data?.metadata || payload?.checkout?.metadata || {};
}

function getEventType(payload) {
  return normalizeString(payload?.type || payload?.event || payload?.event_type);
}

function getEventId(payload) {
  return normalizeString(payload?.id || payload?.event_id || payload?.data?.id);
}

function getData(payload) {
  return payload?.data || payload?.order || payload?.checkout || payload;
}

function getCheckoutUrl(payload) {
  return normalizeString(payload?.url || payload?.checkout_url || payload?.data?.url || payload?.data?.checkout_url);
}

function getCheckoutId(payload) {
  return normalizeString(payload?.id || payload?.data?.id);
}

function normalizePolarAmount(value) {
  if (value === undefined || value === null) return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return normalizeString(value);
  return numeric > 999 ? (numeric / 100).toFixed(2) : numeric.toFixed(2);
}

export const polarAdapter = {
  provider: "polar",

  isConfigured(env = process.env) {
    return Boolean(env.POLAR_ACCESS_TOKEN && env.POLAR_WEBHOOK_SECRET);
  },

  async createCheckout({ packageConfig, user, internalOrderId, successUrl, cancelUrl, metadata = {}, env = process.env }) {
    if (!env.POLAR_ACCESS_TOKEN) throw apiError("Polar access token is not configured.", 503);
    if (!packageConfig.providerProductId && !packageConfig.providerPriceId) {
      throw apiError("Polar product or price ID is not configured for this package.", 503);
    }

    const checkoutResponse = await polarApiRequest("/checkouts", {
      method: "POST",
      env,
      body: {
        products: [packageConfig.providerProductId || packageConfig.providerPriceId],
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: user.email || undefined,
        external_customer_id: user.id,
        metadata: {
          user_id: user.id,
          user_email: user.email,
          package_id: packageConfig.id,
          credits: packageConfig.credits,
          internal_order_id: internalOrderId,
          price_usd: packageConfig.priceUsd,
          currency: packageConfig.currency,
          billing_type: packageConfig.billingType,
          ...metadata,
        },
      },
    });

    const checkoutUrl = getCheckoutUrl(checkoutResponse);
    const providerCheckoutId = getCheckoutId(checkoutResponse);
    if (!checkoutUrl || !providerCheckoutId) {
      throw apiError("Polar did not return a checkout URL.", 502, checkoutResponse);
    }

    return {
      provider: this.provider,
      checkoutUrl,
      internalOrderId,
      providerCheckoutId,
      providerTransactionId: null,
      rawPayload: checkoutResponse,
    };
  },

  verifyWebhook(rawBody, headers, env = process.env) {
    const secret = env.POLAR_WEBHOOK_SECRET;
    if (!secret) throw apiError("Polar webhook secret is not configured.", 500);

    const webhookId = headers.get("webhook-id");
    const timestamp = headers.get("webhook-timestamp");
    const signatureHeader = headers.get("webhook-signature") || "";
    const signedPayload = webhookId && timestamp ? `${webhookId}.${timestamp}.${rawBody}` : rawBody;
    const expected = hmacHex(secret, signedPayload);
    return signatureHeader
      .split(" ")
      .flatMap((part) => part.split(","))
      .map((part) => part.replace(/^v1,?/, "").replace(/^v1=/, "").trim())
      .filter(Boolean)
      .some((signature) => timingSafeStringEqual(signature, expected));
  },

  parseWebhook(rawBody) {
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      throw apiError("Invalid Polar webhook body.", 400);
    }

    const eventType = getEventType(payload);
    const data = getData(payload);
    const metadata = getMetadata(payload);
    const paid = ["order.paid", "order.created", "checkout.updated"].includes(eventType) && ["paid", "succeeded", "completed"].includes(String(data.status || data.payment_status || "").toLowerCase());
    const refunded = String(eventType || "").includes("refund") || ["refunded"].includes(String(data.status || "").toLowerCase());

    return {
      provider: this.provider,
      eventId: getEventId(payload),
      eventType,
      status: paid ? "paid" : refunded ? "refunded" : String(eventType || "").startsWith("subscription.") ? eventType.replace(/\./g, "_") : "ignored",
      userId: normalizeString(metadata.user_id || data.external_customer_id),
      packageId: normalizeString(metadata.package_id),
      providerTransactionId: normalizeString(data.order_id || data.id),
      providerCheckoutId: normalizeString(data.checkout_id || data.checkout?.id),
      providerCustomerId: normalizeString(data.customer_id || data.customer?.id),
      providerSubscriptionId: normalizeString(data.subscription_id || data.subscription?.id),
      providerProductId: normalizeString(data.product_id || data.product?.id || metadata.product_id),
      providerPriceId: normalizeString(data.price_id || data.price?.id || data.product_id || metadata.price_id),
      amount: normalizePolarAmount(data.amount || data.total_amount || metadata.price_usd),
      currency: normalizeString(data.currency || metadata.currency) || "USD",
      buyerEmail: normalizeString(data.customer_email || data.customer?.email || metadata.user_email),
      buyerName: normalizeString(data.customer_name || data.customer?.name),
      internalOrderId: normalizeString(metadata.internal_order_id),
      taxAmount: normalizePolarAmount(data.tax_amount),
      rawPayload: payload,
    };
  },

  refundPayment() {
    throw apiError("Refunds are not automated in Viseo for Polar; review and initiate the refund in Polar, then reconcile credits manually if needed.", 501);
  },
};
