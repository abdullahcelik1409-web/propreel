import crypto from "crypto";
import { getPackageConfig } from "../packageConfig.js";

const LEMON_SQUEEZY_API_BASE_URL = "https://api.lemonsqueezy.com/v1";
const CREDIT_EVENTS = new Set(["order_created"]);
const REFUND_EVENTS = new Set(["order_refunded"]);

function normalizeString(value) {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized || null;
}

function timingSafeStringEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyLemonSqueezySignature(rawBody, signatureHeader, secret) {
  const signature = normalizeString(signatureHeader);
  if (!rawBody || !secret || !signature) return false;

  const expected = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  return timingSafeStringEqual(expected, signature);
}

function apiError(message, status, payload) {
  const error = new Error(message);
  error.status = status;
  error.payload = payload;
  return error;
}

async function lemonSqueezyApiRequest(path, { method = "GET", body, searchParams, env = process.env } = {}) {
  const token = env.LEMON_SQUEEZY_API_KEY;
  if (!token) {
    throw apiError("Lemon Squeezy API key is not configured.", 500);
  }

  const url = new URL(path.replace(/^\//, ""), `${LEMON_SQUEEZY_API_BASE_URL}/`);
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const response = await fetch(url, {
    method,
    headers: {
      accept: "application/vnd.api+json",
      authorization: `Bearer ${token}`,
      ...(body ? { "content-type": "application/vnd.api+json" } : {}),
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

  if (!response.ok) {
    throw apiError(`Lemon Squeezy API request failed with ${response.status}.`, response.status, payload);
  }

  return payload;
}

function getAttributes(payload) {
  return payload?.data?.attributes || {};
}

function getCustomData(payload) {
  return payload?.meta?.custom_data || getAttributes(payload)?.custom_data || {};
}

function getEventName(payload) {
  return normalizeString(payload?.meta?.event_name || payload?.event_name);
}

function getOrderId(payload) {
  return normalizeString(payload?.data?.id || getAttributes(payload)?.identifier || getAttributes(payload)?.order_number);
}

function getVariantId(payload) {
  const attributes = getAttributes(payload);
  const firstItem = attributes.first_order_item || {};
  const customData = getCustomData(payload);
  return normalizeString(
    firstItem.variant_id ||
      attributes.variant_id ||
      attributes.variant?.id ||
      attributes.product_variant_id ||
      customData.variant_id,
  );
}

function getProductId(payload) {
  const attributes = getAttributes(payload);
  const firstItem = attributes.first_order_item || {};
  return normalizeString(firstItem.product_id || attributes.product_id || attributes.product?.id);
}

function extractAmount(payload) {
  const attributes = getAttributes(payload);
  const total = attributes.total_usd ?? attributes.total ?? attributes.subtotal_usd ?? attributes.subtotal;
  if (total === undefined || total === null) return null;
  const numeric = Number(total);
  return Number.isFinite(numeric) ? (numeric / 100).toFixed(2) : normalizeString(total);
}

function extractTaxAmount(payload) {
  const attributes = getAttributes(payload);
  const tax = attributes.tax_usd ?? attributes.tax;
  if (tax === undefined || tax === null) return null;
  const numeric = Number(tax);
  return Number.isFinite(numeric) ? (numeric / 100).toFixed(2) : normalizeString(tax);
}

function buildEventId(payload, eventName) {
  const orderId = getOrderId(payload);
  return normalizeString(payload?.meta?.webhook_id || payload?.id || (eventName && orderId ? `${eventName}:${orderId}` : null));
}

export const lemonAdapter = {
  provider: "lemon",

  isConfigured(env = process.env) {
    return Boolean(env.LEMON_SQUEEZY_API_KEY && env.LEMON_SQUEEZY_STORE_ID);
  },

  async createCheckout({ packageConfig, user, internalOrderId, successUrl, cancelUrl, metadata = {}, env = process.env }) {
    if (!this.isConfigured(env)) {
      throw apiError("Lemon Squeezy API key or store ID is not configured.", 503);
    }
    if (!packageConfig.providerPriceId) {
      throw apiError("Lemon Squeezy variant ID is not configured for this package.", 503);
    }

    const checkoutResponse = await lemonSqueezyApiRequest("/checkouts", {
      method: "POST",
      env,
      body: {
        data: {
          type: "checkouts",
          attributes: {
            product_options: {
              enabled_variants: [Number(packageConfig.providerPriceId)].filter(Number.isFinite),
              name: packageConfig.name,
              description: `${packageConfig.credits.toLocaleString("en-US")} Viseo credits for AI real estate video generation.`,
              ...(successUrl ? { redirect_url: successUrl } : {}),
              receipt_button_text: "Open Viseo",
              receipt_link_url: successUrl || cancelUrl || undefined,
            },
            checkout_options: {
              dark: true,
              logo: true,
              media: false,
              desc: true,
              discount: true,
              button_color: "#00fbfb",
            },
            checkout_data: {
              email: user.email || "",
              name: user.name || "",
              custom: {
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
          },
          relationships: {
            store: {
              data: {
                type: "stores",
                id: String(env.LEMON_SQUEEZY_STORE_ID),
              },
            },
            variant: {
              data: {
                type: "variants",
                id: String(packageConfig.providerPriceId),
              },
            },
          },
        },
      },
    });

    const checkout = checkoutResponse?.data;
    const checkoutUrl = checkout?.attributes?.url;
    if (!checkout?.id || !checkoutUrl) {
      throw apiError("Lemon Squeezy did not return a checkout URL.", 502, checkoutResponse);
    }

    return {
      provider: this.provider,
      checkoutUrl,
      internalOrderId,
      providerCheckoutId: checkout.id,
      providerTransactionId: null,
      rawPayload: checkout,
    };
  },

  verifyWebhook(rawBody, headers, env = process.env) {
    const secret = env.LEMON_SQUEEZY_WEBHOOK_SECRET;
    if (!secret) throw apiError("Lemon Squeezy webhook secret is not configured.", 500);
    return verifyLemonSqueezySignature(rawBody, headers.get("x-signature"), secret);
  },

  parseWebhook(rawBody) {
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      throw apiError("Invalid Lemon Squeezy webhook body.", 400);
    }

    const attributes = getAttributes(payload);
    const customData = getCustomData(payload);
    const eventType = getEventName(payload);
    const eventId = buildEventId(payload, eventType);
    const providerTransactionId = getOrderId(payload);
    const providerPriceId = getVariantId(payload);
    const packageConfig = getPackageConfig(normalizeString(customData.package_id), "lemon");
    const status = CREDIT_EVENTS.has(eventType)
      ? "paid"
      : REFUND_EVENTS.has(eventType)
        ? "refunded"
        : eventType?.startsWith("subscription_")
          ? eventType
          : "ignored";

    return {
      provider: this.provider,
      eventId,
      eventType,
      status,
      userId: normalizeString(customData.user_id),
      packageId: packageConfig?.id || normalizeString(customData.package_id),
      providerTransactionId,
      providerCheckoutId: normalizeString(attributes.checkout_id),
      providerCustomerId: normalizeString(attributes.customer_id || attributes.customer?.id),
      providerSubscriptionId: normalizeString(attributes.subscription_id),
      providerProductId: getProductId(payload),
      providerPriceId,
      amount: extractAmount(payload) || normalizeString(customData.price_usd),
      currency: normalizeString(attributes.currency || customData.currency) || "USD",
      buyerEmail: normalizeString(attributes.user_email || attributes.customer_email || customData.user_email),
      buyerName: normalizeString(attributes.user_name || attributes.customer_name || customData.user_name),
      internalOrderId: normalizeString(customData.internal_order_id),
      taxAmount: extractTaxAmount(payload),
      rawPayload: payload,
    };
  },

  refundPayment() {
    throw apiError("Refunds are not automated in Viseo for Lemon Squeezy; review and initiate the refund in Lemon Squeezy, then reconcile credits manually if needed.", 501);
  },
};
