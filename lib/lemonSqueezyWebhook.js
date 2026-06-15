import crypto from "crypto";
import { prisma } from "./prisma.js";
import { getCreditPackageById, getCreditPackageByLemonSqueezyVariantId, getLemonSqueezyPackageConfig } from "./paymentConfig.js";

const CREDIT_EVENTS = new Set(["order_created"]);
const REFUND_REVIEW_EVENTS = new Set(["order_refunded"]);

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

export function verifyLemonSqueezySignature(rawBody, signatureHeader, secret) {
  const signature = normalizeString(signatureHeader);
  if (!rawBody || !secret || !signature) return false;

  const expected = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  return timingSafeStringEqual(expected, signature);
}

function webhookError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function parseLemonSqueezyPayload(rawBody) {
  try {
    return JSON.parse(rawBody);
  } catch {
    throw webhookError("Invalid Lemon Squeezy webhook body.", 400);
  }
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

function buildPaymentSummary({ payload, creditPackage, status }) {
  const attributes = getAttributes(payload);
  const customData = getCustomData(payload);
  const eventType = getEventName(payload);

  return {
    orderId: getOrderId(payload),
    eventId: buildEventId(payload, eventType),
    eventType,
    status,
    userId: normalizeString(customData.user_id),
    packageId: creditPackage?.id || normalizeString(customData.package_id),
    packageName: creditPackage?.name || null,
    credits: creditPackage?.credits || Number(customData.credits) || 0,
    amount: extractAmount(payload) || normalizeString(customData.price_usd),
    currency: normalizeString(attributes.currency || customData.currency) || "USD",
    buyerEmail: normalizeEmail(attributes.user_email || attributes.customer_email || customData.user_email),
    buyerName: normalizeString(attributes.user_name || attributes.customer_name || customData.user_name),
    providerCustomerId: normalizeString(attributes.customer_id || attributes.customer?.id),
    providerSubscriptionId: normalizeString(attributes.subscription_id),
    providerProductId: getProductId(payload),
    providerPriceId: getVariantId(payload),
    internalOrderId: normalizeString(customData.internal_order_id),
    taxAmount: extractTaxAmount(payload),
  };
}

async function upsertPaymentOrder({ tx = prisma, summary, rawPayload }) {
  return tx.paymentOrder.upsert({
    where: { providerOrderId: summary.orderId },
    create: {
      provider: "lemon_squeezy",
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
      provider: "lemon_squeezy",
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
  return prisma.lemonSqueezyWebhookEvent.update({
    where: { eventId },
    data,
  });
}

function resolveCreditPackage(payload) {
  const customData = getCustomData(payload);
  const customPackageId = normalizeString(customData.package_id);
  const packageFromCustomData = customPackageId ? getCreditPackageById(customPackageId) : null;
  const variantId = getVariantId(payload);
  const packageFromVariant = getCreditPackageByLemonSqueezyVariantId(variantId);

  if (packageFromCustomData && packageFromVariant && packageFromCustomData.id !== packageFromVariant.id) {
    return { creditPackage: null, error: "package_variant_mismatch" };
  }

  const creditPackage = packageFromCustomData || packageFromVariant;
  if (!creditPackage) return { creditPackage: null, error: "package_not_matched" };

  const packageConfig = getLemonSqueezyPackageConfig(creditPackage.id);
  if (!packageConfig?.lemonSqueezyVariantId || String(variantId) !== String(packageConfig.lemonSqueezyVariantId)) {
    return { creditPackage: null, error: "variant_not_configured_or_mismatched" };
  }

  return { creditPackage, error: null };
}

async function processCreditableOrder({ payload, creditPackage }) {
  const summary = buildPaymentSummary({ payload, creditPackage, status: "matched" });

  if (!summary.orderId) {
    throw webhookError("Lemon Squeezy order id is missing.", 400);
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
        provider: "lemon_squeezy",
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
        action: "lemon_squeezy_purchase",
        note: `Lemon Squeezy purchase: ${creditPackage.name}`,
        referenceId: `lemon_squeezy:${summary.orderId}`,
        metadata: {
          provider: "lemon_squeezy",
          providerOrderId: summary.orderId,
          providerEventId: summary.eventId,
          eventType: summary.eventType,
          packageId: creditPackage.id,
          providerVariantId: summary.providerPriceId,
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

export async function processLemonSqueezyWebhook({ rawBody, signatureHeader }) {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if (!secret) throw webhookError("Lemon Squeezy webhook secret is not configured.", 500);
  if (!verifyLemonSqueezySignature(rawBody, signatureHeader, secret)) {
    throw webhookError("Invalid Lemon Squeezy webhook signature.", 401);
  }

  const payload = parseLemonSqueezyPayload(rawBody);
  const eventType = getEventName(payload);
  const eventId = buildEventId(payload, eventType);
  if (!eventId || !eventType) throw webhookError("Lemon Squeezy webhook event id or type is missing.", 400);

  try {
    await prisma.lemonSqueezyWebhookEvent.create({
      data: {
        eventId,
        eventType,
        occurredAt: getAttributes(payload)?.created_at ? new Date(getAttributes(payload).created_at) : null,
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
    if (CREDIT_EVENTS.has(eventType)) {
      const { creditPackage, error } = resolveCreditPackage(payload);
      if (error) {
        const summary = buildPaymentSummary({ payload, creditPackage: null, status: "failed" });
        if (summary.orderId) await upsertPaymentOrder({ summary, rawPayload: payload });
        await markWebhookEvent(eventId, { processingStatus: "failed", errorMessage: error, processedAt: new Date() });
        return { status: "failed", credited: false, reason: error };
      }

      const result = await processCreditableOrder({ payload, creditPackage });
      await markWebhookEvent(eventId, { processingStatus: "processed", processedAt: new Date() });
      return result;
    }

    if (REFUND_REVIEW_EVENTS.has(eventType)) {
      const orderId = getOrderId(payload);
      if (orderId) {
        await prisma.paymentOrder.updateMany({
          where: { provider: "lemon_squeezy", providerOrderId: orderId },
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
      errorMessage: error?.message || "Lemon Squeezy webhook processing failed.",
      processedAt: new Date(),
    });
    throw error;
  }
}
