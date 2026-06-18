import crypto from "crypto";

const POLAR_PRODUCTION_API_BASE_URL = "https://api.polar.sh/v1";
const POLAR_SANDBOX_API_BASE_URL = "https://sandbox-api.polar.sh/v1";

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

function getPolarApiBaseUrl(env = process.env) {
  return String(env.POLAR_ENVIRONMENT || "production").trim().toLowerCase() === "sandbox" ? POLAR_SANDBOX_API_BASE_URL : POLAR_PRODUCTION_API_BASE_URL;
}

function timingSafeStringEqual(left, right, encoding = "utf8") {
  const leftBuffer = Buffer.from(left, encoding);
  const rightBuffer = Buffer.from(right, encoding);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function decodeWebhookSecret(secret) {
  const normalized = normalizeString(secret);
  if (!normalized) return null;
  const base64Secret = normalized.startsWith("whsec_") ? normalized.slice("whsec_".length) : normalized;
  const base64 = base64Secret.replace(/-/g, "+").replace(/_/g, "/");
  if (!/^[A-Za-z0-9+/=]+$/.test(base64)) return null;
  const decoded = Buffer.from(base64, "base64");
  return decoded.length > 0 ? decoded : null;
}

function getWebhookSignatures(signatureHeader) {
  return String(signatureHeader || "")
    .split(/\s+/)
    .flatMap((part) => part.split(";"))
    .map((part) => part.trim())
    .filter(Boolean)
    .flatMap((part) => {
      if (part.startsWith("v1,")) return [part.slice(3).trim()];
      if (part.startsWith("v1=")) return [part.slice(3).trim()];
      return [];
    })
    .filter(Boolean);
}

export function verifyPolarWebhookSignature(rawBody, headers, secret) {
  const webhookId = headers.get("webhook-id");
  const timestamp = headers.get("webhook-timestamp");
  const signatureHeader = headers.get("webhook-signature") || "";
  const secretBytes = decodeWebhookSecret(secret);

  if (!webhookId || !timestamp || !secretBytes) return false;

  const signedPayload = `${webhookId}.${timestamp}.${rawBody}`;
  const expected = crypto.createHmac("sha256", secretBytes).update(signedPayload, "utf8").digest("base64");
  return getWebhookSignatures(signatureHeader).some((signature) => timingSafeStringEqual(signature, expected, "base64"));
}

async function polarApiRequest(path, { method = "GET", body, env = process.env } = {}) {
  const token = env.POLAR_ACCESS_TOKEN;
  if (!token) throw apiError("Polar access token is not configured.", 500);

  const response = await fetch(new URL(path.replace(/^\//, ""), `${getPolarApiBaseUrl(env)}/`), {
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
  return payload?.data?.metadata || payload?.metadata || payload?.checkout?.metadata || {};
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

function normalizeMajorAmount(value) {
  if (value === undefined || value === null) return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return normalizeString(value);
  return numeric.toFixed(2);
}

function normalizeMinorAmount(value) {
  if (value === undefined || value === null) return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return normalizeString(value);
  return (numeric / 100).toFixed(2);
}

export const polarAdapter = {
  provider: "polar",

  isConfigured(env = process.env) {
    return Boolean(env.POLAR_ACCESS_TOKEN && env.POLAR_WEBHOOK_SECRET);
  },

  async createCheckout({ packageConfig, user, internalOrderId, successUrl, cancelUrl, metadata = {}, env = process.env }) {
    if (!env.POLAR_ACCESS_TOKEN) throw apiError("Polar access token is not configured.", 503);
    if (!packageConfig.providerProductId) {
      throw apiError("Polar product ID is not configured for this package.", 503);
    }

    const checkoutResponse = await polarApiRequest("/checkouts", {
      method: "POST",
      env,
      body: {
        products: [packageConfig.providerProductId],
        success_url: successUrl,
        return_url: cancelUrl,
        customer_email: user.email || undefined,
        customer_name: user.name || undefined,
        external_customer_id: user.id,
        currency: String(packageConfig.currency || "USD").toLowerCase(),
        allow_discount_codes: true,
        metadata: {
          user_id: user.id,
          user_email: user.email,
          package_id: packageConfig.id,
          credits: packageConfig.credits,
          internal_order_id: internalOrderId,
          price_usd: packageConfig.priceUsd,
          currency: packageConfig.currency,
          environment: env.POLAR_ENVIRONMENT || "production",
          billing_type: packageConfig.billingType,
          ...metadata,
        },
        customer_metadata: {
          user_id: user.id,
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
    return verifyPolarWebhookSignature(rawBody, headers, secret);
  },

  parseWebhook(rawBody, headers = new Headers()) {
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      throw apiError("Invalid Polar webhook body.", 400);
    }

    const eventType = getEventType(payload);
    const data = getData(payload);
    const metadata = getMetadata(payload);
    const paid = eventType === "order.paid" && data.paid === true;
    const refunded = eventType === "order.refunded" || String(eventType || "").includes("refund") || ["refunded"].includes(String(data.status || "").toLowerCase());
    const firstItem = Array.isArray(data.items) ? data.items[0] : null;

    return {
      provider: this.provider,
      eventId: normalizeString(headers.get("webhook-id")) || getEventId(payload) || (eventType && data.id ? `${eventType}:${data.id}` : null),
      eventType,
      status: paid ? "paid" : refunded ? "refunded" : String(eventType || "").startsWith("subscription.") ? eventType.replace(/\./g, "_") : "ignored",
      userId: normalizeString(metadata.user_id || data.customer?.external_id || data.external_customer_id),
      packageId: normalizeString(metadata.package_id),
      providerTransactionId: normalizeString(data.id || data.order_id),
      providerCheckoutId: normalizeString(data.checkout_id || data.checkout?.id),
      providerCustomerId: normalizeString(data.customer_id || data.customer?.id),
      providerSubscriptionId: normalizeString(data.subscription_id || data.subscription?.id),
      providerProductId: normalizeString(data.product_id || data.product?.id || metadata.product_id),
      providerPriceId: normalizeString(firstItem?.product_price_id || data.product_price_id || data.price_id || data.price?.id || metadata.price_id),
      amount: normalizeMinorAmount(data.total_amount ?? data.amount) || normalizeMajorAmount(metadata.price_usd),
      currency: normalizeString(data.currency || metadata.currency) || "USD",
      buyerEmail: normalizeString(data.customer_email || data.customer?.email || metadata.user_email),
      buyerName: normalizeString(data.customer_name || data.customer?.name),
      internalOrderId: normalizeString(metadata.internal_order_id),
      taxAmount: normalizeMinorAmount(data.tax_amount),
      rawPayload: payload,
    };
  },

  async getCustomerPortalUrl({ user, returnUrl, env = process.env }) {
    if (!env.POLAR_ACCESS_TOKEN) throw apiError("Polar access token is not configured.", 503);
    const response = await polarApiRequest("/customer-sessions", {
      method: "POST",
      env,
      body: {
        external_customer_id: user.id,
        return_url: returnUrl,
      },
    });

    const portalUrl = normalizeString(response?.customer_portal_url || response?.url);
    if (!portalUrl) throw apiError("Polar did not return a customer portal URL.", 502, response);
    return { provider: this.provider, customerPortalUrl: portalUrl, rawPayload: response };
  },

  refundPayment() {
    throw apiError("Refunds are not automated in Viseo for Polar; review and initiate the refund in Polar, then reconcile credits manually if needed.", 501);
  },
};
