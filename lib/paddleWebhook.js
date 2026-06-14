import crypto from "crypto";
import { prisma } from "./prisma.js";
import { getCreditPackageById, getCreditPackageByPaddlePriceId, getPaddlePackageConfig } from "./paymentConfig.js";

const CREDIT_EVENTS = new Set(["transaction.completed"]);
const PENDING_EVENTS = new Set(["transaction.paid"]);
const FAILED_EVENTS = new Set(["transaction.canceled", "transaction.past_due", "transaction.payment_failed"]);
const REFUND_REVIEW_EVENTS = new Set(["adjustment.created", "adjustment.updated"]);
const DEFAULT_SIGNATURE_TOLERANCE_SECONDS = 300;

function normalizeString(value) {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized || null;
}

function normalizeEmail(value) {
  const normalized = normalizeString(value);
  return normalized ? normalized.toLowerCase() : null;
}

function timingSafeStringEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function parsePaddleSignatureHeader(signatureHeader) {
  const header = normalizeString(signatureHeader);
  if (!header) return { timestamp: null, signatures: [] };

  const values = {};
  for (const part of header.split(";")) {
    const [rawKey, ...rawValue] = part.split("=");
    const key = normalizeString(rawKey);
    const value = normalizeString(rawValue.join("="));
    if (key && value) values[key.toLowerCase()] = value;
  }

  return {
    timestamp: values.ts || values.t || null,
    signatures: [values.h1, values.v1, values.signature, values.sig].filter(Boolean),
  };
}

export function verifyPaddleSignature(rawBody, signatureHeader, secret, { toleranceSeconds = DEFAULT_SIGNATURE_TOLERANCE_SECONDS } = {}) {
  const { timestamp, signatures } = parsePaddleSignatureHeader(signatureHeader);
  if (!rawBody || !secret || !timestamp || !signatures.length) return false;

  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) return false;

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - timestampSeconds) > toleranceSeconds) return false;

  const signedPayload = `${timestamp}:${rawBody}`;
  const expected = crypto.createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");
  return signatures.some((signature) => timingSafeStringEqual(expected, signature));
}

function webhookError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function parsePaddlePayload(rawBody) {
  try {
    return JSON.parse(rawBody);
  } catch {
    throw webhookError("Invalid Paddle webhook body.", 400);
  }
}

function extractLineItem(data) {
  const items = Array.isArray(data?.items) ? data.items : [];
  return items[0] || null;
}

function extractPriceId(data) {
  const item = extractLineItem(data);
  return normalizeString(item?.price?.id || item?.price_id || data?.price_id);
}

function extractProductId(data) {
  const item = extractLineItem(data);
  return normalizeString(item?.price?.product_id || item?.product_id || data?.product_id);
}

function extractBuyerEmail(data) {
  return normalizeEmail(data?.customer?.email || data?.customer_email || data?.custom_data?.user_email);
}

function extractBuyerName(data) {
  return normalizeString(data?.customer?.name || data?.custom_data?.user_name);
}

function extractAmount(data) {
  const total = data?.details?.totals?.total || data?.details?.adjusted_totals?.total || data?.totals?.total;
  if (total === undefined || total === null) return null;
  const numeric = Number(total);
  return Number.isFinite(numeric) ? (numeric / 100).toFixed(2) : normalizeString(total);
}

function extractTaxAmount(data) {
  const tax = data?.details?.totals?.tax || data?.details?.adjusted_totals?.tax || data?.totals?.tax;
  if (tax === undefined || tax === null) return null;
  const numeric = Number(tax);
  return Number.isFinite(numeric) ? (numeric / 100).toFixed(2) : normalizeString(tax);
}

function buildPaymentSummary({ payload, creditPackage, status }) {
  const data = payload.data || {};
  const customData = data.custom_data || {};
  return {
    orderId: normalizeString(data.id),
    eventId: normalizeString(payload.event_id),
    eventType: normalizeString(payload.event_type),
    status,
    userId: normalizeString(customData.user_id),
    packageId: creditPackage?.id || normalizeString(customData.package_id),
    packageName: creditPackage?.name || null,
    credits: creditPackage?.credits || Number(customData.credits) || 0,
    amount: extractAmount(data) || normalizeString(customData.price_usd),
    currency: normalizeString(data.currency_code || customData.currency) || "USD",
    buyerEmail: extractBuyerEmail(data),
    buyerName: extractBuyerName(data),
    providerCustomerId: normalizeString(data.customer_id || data.customer?.id),
    providerSubscriptionId: normalizeString(data.subscription_id),
    providerProductId: extractProductId(data),
    providerPriceId: extractPriceId(data),
    internalOrderId: normalizeString(customData.internal_order_id),
    taxAmount: extractTaxAmount(data),
  };
}

async function upsertPaymentOrder({ tx = prisma, summary, rawPayload }) {
  return tx.paymentOrder.upsert({
    where: { providerOrderId: summary.orderId },
    create: {
      provider: "paddle",
      providerOrderId: summary.orderId,
      providerEventId: summary.eventId,
      eventType: summary.eventType,
      status: summary.status,
      userId: summary.userId,
      packageId: summary.packageId,
      packageName: summary.packageName,
      credits: summary.credits,
      amount: summary.amount,
      currency: summary.currency,
      buyerEmail: summary.buyerEmail,
      buyerName: summary.buyerName,
      providerCustomerId: summary.providerCustomerId,
      providerSubscriptionId: summary.providerSubscriptionId,
      providerProductId: summary.providerProductId,
      providerPriceId: summary.providerPriceId,
      internalOrderId: summary.internalOrderId,
      taxAmount: summary.taxAmount,
      rawPayload,
    },
    update: {
      provider: "paddle",
      providerEventId: summary.eventId,
      eventType: summary.eventType,
      status: summary.status,
      userId: summary.userId,
      packageId: summary.packageId,
      packageName: summary.packageName,
      credits: summary.credits,
      amount: summary.amount,
      currency: summary.currency,
      buyerEmail: summary.buyerEmail,
      buyerName: summary.buyerName,
      providerCustomerId: summary.providerCustomerId,
      providerSubscriptionId: summary.providerSubscriptionId,
      providerProductId: summary.providerProductId,
      providerPriceId: summary.providerPriceId,
      internalOrderId: summary.internalOrderId,
      taxAmount: summary.taxAmount,
      rawPayload,
    },
  });
}

async function markWebhookEvent(eventId, data) {
  return prisma.paddleWebhookEvent.update({
    where: { eventId },
    data,
  });
}

function resolveCreditPackage(data) {
  const customPackageId = normalizeString(data?.custom_data?.package_id);
  const packageFromCustomData = customPackageId ? getCreditPackageById(customPackageId) : null;
  const packageFromPrice = getCreditPackageByPaddlePriceId(extractPriceId(data));

  if (packageFromCustomData && packageFromPrice && packageFromCustomData.id !== packageFromPrice.id) {
    return { creditPackage: null, error: "package_price_mismatch" };
  }

  const creditPackage = packageFromCustomData || packageFromPrice;
  if (!creditPackage) return { creditPackage: null, error: "package_not_matched" };

  const packageConfig = getPaddlePackageConfig(creditPackage.id);
  const receivedPriceId = extractPriceId(data);
  if (!packageConfig?.paddlePriceId || receivedPriceId !== packageConfig.paddlePriceId) {
    return { creditPackage: null, error: "price_not_configured_or_mismatched" };
  }

  return { creditPackage, error: null };
}

async function processCreditableTransaction({ payload, creditPackage }) {
  const data = payload.data || {};
  const summary = buildPaymentSummary({ payload, creditPackage, status: "matched" });

  if (!summary.orderId) {
    throw webhookError("Paddle transaction id is missing.", 400);
  }

  if (!summary.userId) {
    await upsertPaymentOrder({ summary: { ...summary, status: "unresolved" }, rawPayload: payload });
    return { status: "unresolved", credited: false, reason: "user_id_missing" };
  }

  const user = await prisma.user.findUnique({
    where: { id: summary.userId },
    select: { id: true, email: true },
  });

  if (!user) {
    await upsertPaymentOrder({ summary: { ...summary, status: "unresolved" }, rawPayload: payload });
    return { status: "unresolved", credited: false, reason: "user_not_found" };
  }

  return prisma.$transaction(async (tx) => {
    const paymentOrder = await upsertPaymentOrder({
      tx,
      summary: { ...summary, userId: user.id, status: "matched" },
      rawPayload: payload,
    });

    const claimed = await tx.paymentOrder.updateMany({
      where: {
        id: paymentOrder.id,
        provider: "paddle",
        creditedAt: null,
      },
      data: {
        status: "credited",
        creditedAt: new Date(),
      },
    });

    if (claimed.count === 0) {
      return { status: "already_credited", credited: false, paymentOrderId: paymentOrder.id };
    }

    const updatedUser = await tx.user.update({
      where: { id: user.id },
      data: { credits: { increment: creditPackage.credits } },
      select: { credits: true },
    });

    await tx.creditEvent.create({
      data: {
        userId: user.id,
        amount: creditPackage.credits,
        action: "paddle_purchase",
        note: `Paddle purchase: ${creditPackage.name}`,
        referenceId: `paddle:${data.id}`,
        metadata: {
          provider: "paddle",
          providerOrderId: data.id,
          providerEventId: payload.event_id,
          eventType: payload.event_type,
          packageId: creditPackage.id,
          providerPriceId: summary.providerPriceId,
          providerProductId: summary.providerProductId,
          internalOrderId: summary.internalOrderId,
          balanceAfter: updatedUser.credits,
        },
      },
    });

    return {
      status: "credited",
      credited: true,
      paymentOrderId: paymentOrder.id,
      userId: user.id,
      packageId: creditPackage.id,
      credits: creditPackage.credits,
    };
  });
}

export async function processPaddleWebhook({ rawBody, signatureHeader }) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) throw webhookError("Paddle webhook secret is not configured.", 500);
  if (!verifyPaddleSignature(rawBody, signatureHeader, secret)) {
    throw webhookError("Invalid Paddle webhook signature.", 401);
  }

  const payload = parsePaddlePayload(rawBody);
  const eventId = normalizeString(payload.event_id);
  const eventType = normalizeString(payload.event_type);
  if (!eventId || !eventType) throw webhookError("Paddle webhook event id or type is missing.", 400);

  try {
    await prisma.paddleWebhookEvent.create({
      data: {
        eventId,
        eventType,
        occurredAt: payload.occurred_at ? new Date(payload.occurred_at) : null,
        processingStatus: "received",
        payload,
      },
    });
  } catch (error) {
    if (error?.code === "P2002") {
      return { status: "duplicate_event", credited: false };
    }
    throw error;
  }

  try {
    const data = payload.data || {};

    if (CREDIT_EVENTS.has(eventType)) {
      // Paddle marks transactions as completed after paid transaction processing finishes; this is the fulfillment event for one-time credit packs.
      const { creditPackage, error } = resolveCreditPackage(data);
      if (error) {
        const summary = buildPaymentSummary({ payload, creditPackage: null, status: "failed" });
        if (summary.orderId) await upsertPaymentOrder({ summary, rawPayload: payload });
        await markWebhookEvent(eventId, { processingStatus: "failed", errorMessage: error, processedAt: new Date() });
        return { status: "failed", credited: false, reason: error };
      }

      const result = await processCreditableTransaction({ payload, creditPackage });
      await markWebhookEvent(eventId, { processingStatus: "processed", processedAt: new Date() });
      return result;
    }

    if (PENDING_EVENTS.has(eventType)) {
      const { creditPackage } = resolveCreditPackage(data);
      const summary = buildPaymentSummary({ payload, creditPackage, status: "paid_pending_completion" });
      if (summary.orderId) await upsertPaymentOrder({ summary, rawPayload: payload });
      await markWebhookEvent(eventId, { processingStatus: "processed", processedAt: new Date() });
      return { status: "paid_pending_completion", credited: false };
    }

    if (FAILED_EVENTS.has(eventType)) {
      const { creditPackage } = resolveCreditPackage(data);
      const summary = buildPaymentSummary({ payload, creditPackage, status: "payment_failed" });
      if (summary.orderId) await upsertPaymentOrder({ summary, rawPayload: payload });
      await markWebhookEvent(eventId, { processingStatus: "processed", processedAt: new Date() });
      return { status: "payment_failed", credited: false };
    }

    if (REFUND_REVIEW_EVENTS.has(eventType)) {
      const transactionId = normalizeString(data?.transaction_id);
      if (transactionId) {
        await prisma.paymentOrder.updateMany({
          where: { provider: "paddle", providerOrderId: transactionId },
          data: { status: "refund_review", rawPayload: payload },
        });
      }
      await markWebhookEvent(eventId, { processingStatus: "processed", processedAt: new Date() });
      return { status: "refund_review", credited: false };
    }

    await markWebhookEvent(eventId, { processingStatus: "ignored", processedAt: new Date() });
    return { status: "ignored", credited: false, reason: "event_not_handled" };
  } catch (error) {
    await markWebhookEvent(eventId, {
      processingStatus: "failed",
      errorMessage: error?.message || "Paddle webhook processing failed.",
      processedAt: new Date(),
    });
    throw error;
  }
}
