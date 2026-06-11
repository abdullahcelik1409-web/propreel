import crypto from "crypto";
import { prisma } from "./prisma";
import { CREDIT_PACKAGES } from "./videoConfig";
import { getShopierPackageByProductId } from "./paymentConfig";

const PAID_EVENTS = new Set(["order.fulfilled", "order.paid", "payment.succeeded", "payment.completed"]);
const REFUND_EVENTS = new Set(["refund.created", "refund.updated", "order.refunded", "payment.refunded"]);
const PAID_STATUSES = new Set(["paid", "fulfilled", "completed", "success", "succeeded", "approved", "confirmed"]);
const REFUND_STATUSES = new Set(["refunded", "refund", "cancelled", "canceled"]);
const PACKAGE_IDS = new Set(CREDIT_PACKAGES.map((creditPackage) => creditPackage.id));

function normalizeString(value) {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized || null;
}

function normalizeEmail(value) {
  const normalized = normalizeString(value);
  return normalized ? normalized.toLowerCase() : null;
}

function readPath(source, path) {
  return path.reduce((current, key) => (current && typeof current === "object" ? current[key] : undefined), source);
}

function firstPath(source, paths) {
  for (const path of paths) {
    const value = normalizeString(readPath(source, path));
    if (value) return value;
  }
  return null;
}

function extractOrder(payload) {
  return payload?.data?.object || payload?.data?.order || payload?.data || payload?.order || payload;
}

function extractEventType(payload) {
  return normalizeString(payload?.type || payload?.event || payload?.eventType || payload?.event_name);
}

function extractOrderId(payload, order) {
  return firstPath(
    { payload, order },
    [
      ["order", "id"],
      ["order", "orderId"],
      ["order", "order_id"],
      ["order", "number"],
      ["order", "orderNumber"],
      ["payload", "orderId"],
      ["payload", "order_id"],
      ["payload", "id"],
    ],
  );
}

function extractEventId(payload) {
  return firstPath(
    payload,
    [
      ["id"],
      ["eventId"],
      ["event_id"],
      ["webhookId"],
      ["webhook_id"],
    ],
  );
}

function extractStatus(payload, order) {
  return normalizeString(
    order?.paymentStatus ||
      order?.payment_status ||
      order?.financialStatus ||
      order?.financial_status ||
      order?.status ||
      payload?.paymentStatus ||
      payload?.status,
  )?.toLowerCase();
}

function extractAmount(order) {
  const value =
    order?.totalAmount ||
    order?.total_amount ||
    order?.amount ||
    order?.price ||
    order?.grandTotal ||
    order?.grand_total ||
    order?.total;
  return normalizeString(value);
}

function extractCurrency(order) {
  return normalizeString(order?.currency || order?.currencyCode || order?.currency_code);
}

function extractBuyerName(order) {
  return firstPath(
    order,
    [
      ["customer", "name"],
      ["customer", "fullName"],
      ["customer", "full_name"],
      ["buyer", "name"],
      ["buyer", "fullName"],
      ["billingAddress", "name"],
      ["shippingAddress", "name"],
    ],
  );
}

function collectItemProductIds(order) {
  const containers = [order?.items, order?.lineItems, order?.line_items, order?.products, order?.orderItems, order?.order_items].filter(Array.isArray);
  const ids = [];

  for (const items of containers) {
    for (const item of items) {
      const candidates = [
        item?.productId,
        item?.product_id,
        item?.product?.id,
        item?.product?.productId,
        item?.product?.product_id,
        item?.listingId,
        item?.listing_id,
        item?.id,
      ];

      for (const candidate of candidates) {
        const normalized = normalizeString(candidate);
        if (normalized) ids.push(normalized);
      }
    }
  }

  return [...new Set(ids)];
}

function extractPackageFromPayload(payload, order) {
  for (const productId of collectItemProductIds(order)) {
    const creditPackage = getShopierPackageByProductId(productId);
    if (creditPackage) return creditPackage;
  }

  const rawText = JSON.stringify(payload);
  for (const packageId of PACKAGE_IDS) {
    if (rawText.includes(packageId)) {
      return CREDIT_PACKAGES.find((creditPackage) => creditPackage.id === packageId) || null;
    }
  }

  const normalizedRawText = rawText.toLowerCase();
  for (const creditPackage of CREDIT_PACKAGES) {
    if (normalizedRawText.includes(creditPackage.name.toLowerCase())) {
      return creditPackage;
    }
  }

  return null;
}

function extractCandidateEmails(order) {
  const values = [
    order?.email,
    order?.customerEmail,
    order?.customer_email,
    order?.customer?.email,
    order?.buyer?.email,
    order?.billingAddress?.email,
    order?.billing_address?.email,
    order?.shippingAddress?.email,
    order?.shipping_address?.email,
    order?.note,
    order?.customerNote,
    order?.customer_note,
    order?.description,
  ];

  const emails = [];
  for (const value of values) {
    const normalized = normalizeString(value);
    if (!normalized) continue;
    const matches = normalized.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
    emails.push(...matches.map(normalizeEmail).filter(Boolean));
  }

  return [...new Set(emails)];
}

function timingSafeStringEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyShopierSignature(rawBody, signatureHeader, secret) {
  const signature = normalizeString(signatureHeader);
  if (!signature || !secret) return false;

  const digest = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest();
  const candidates = [digest.toString("hex"), digest.toString("base64"), digest.toString("base64url")];
  const receivedCandidates = signature
    .split(/[,\s]+/)
    .flatMap((part) => {
      const value = part.includes("=") ? part.split("=").pop() : part;
      return [part, value, value?.replace(/^sha256=/i, "")].filter(Boolean);
    })
    .map((part) => part.replace(/^sha256=/i, ""));

  return candidates.some((candidate) => receivedCandidates.some((received) => timingSafeStringEqual(candidate, received)));
}

function webhookError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function upsertPaymentOrder({ orderId, eventId, eventType, status, orderSummary, rawPayload }) {
  return prisma.paymentOrder.upsert({
    where: { providerOrderId: orderId },
    create: {
      providerOrderId: orderId,
      providerEventId: eventId,
      eventType,
      status,
      userId: orderSummary.userId,
      packageId: orderSummary.packageId,
      packageName: orderSummary.packageName,
      credits: orderSummary.credits || 0,
      amount: orderSummary.amount,
      currency: orderSummary.currency,
      buyerEmail: orderSummary.buyerEmail,
      buyerName: orderSummary.buyerName,
      rawPayload,
    },
    update: {
      providerEventId: eventId,
      eventType,
      status,
      userId: orderSummary.userId,
      packageId: orderSummary.packageId,
      packageName: orderSummary.packageName,
      credits: orderSummary.credits || 0,
      amount: orderSummary.amount,
      currency: orderSummary.currency,
      buyerEmail: orderSummary.buyerEmail,
      buyerName: orderSummary.buyerName,
      rawPayload,
    },
  });
}

export async function processShopierWebhook({ rawBody, signatureHeader }) {
  const secret = process.env.SHOPIER_WEBHOOK_SECRET;
  if (!secret) {
    throw webhookError("Shopier webhook secret is not configured.", 500);
  }

  if (!verifyShopierSignature(rawBody, signatureHeader, secret)) {
    throw webhookError("Invalid Shopier webhook signature.", 401);
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    throw webhookError("Invalid Shopier webhook JSON.", 400);
  }

  const order = extractOrder(payload);
  const eventType = extractEventType(payload);
  const eventId = extractEventId(payload);
  const orderId = extractOrderId(payload, order);
  const status = extractStatus(payload, order);

  if (!orderId) {
    throw webhookError("Shopier webhook order id is missing.", 400);
  }

  const isRefund = REFUND_EVENTS.has(eventType) || REFUND_STATUSES.has(status);
  const isPaid = PAID_EVENTS.has(eventType) || PAID_STATUSES.has(status);
  const creditPackage = extractPackageFromPayload(payload, order);
  const candidateEmails = extractCandidateEmails(order);
  const buyerEmail = candidateEmails[0] || null;
  const buyerName = extractBuyerName(order);

  const user = candidateEmails.length
    ? await prisma.user.findFirst({
        where: { email: { in: candidateEmails } },
        select: { id: true, email: true },
      })
    : null;

  const orderSummary = {
    userId: user?.id || null,
    packageId: creditPackage?.id || null,
    packageName: creditPackage?.name || null,
    credits: creditPackage?.credits || 0,
    amount: extractAmount(order),
    currency: extractCurrency(order),
    buyerEmail,
    buyerName,
  };

  if (isRefund) {
    await upsertPaymentOrder({
      orderId,
      eventId,
      eventType,
      status: "refund_review",
      orderSummary,
      rawPayload: payload,
    });
    return { status: "refund_review", credited: false, reason: "refund_requires_manual_review" };
  }

  if (!isPaid) {
    await upsertPaymentOrder({
      orderId,
      eventId,
      eventType,
      status: status || eventType || "received",
      orderSummary,
      rawPayload: payload,
    });
    return { status: "ignored", credited: false, reason: "event_not_paid" };
  }

  if (!creditPackage || !user) {
    await upsertPaymentOrder({
      orderId,
      eventId,
      eventType,
      status: "unresolved",
      orderSummary,
      rawPayload: payload,
    });
    return {
      status: "unresolved",
      credited: false,
      reason: !creditPackage ? "package_not_matched" : "user_not_matched",
    };
  }

  return prisma.$transaction(async (tx) => {
    const paymentOrder = await tx.paymentOrder.upsert({
      where: { providerOrderId: orderId },
      create: {
        providerOrderId: orderId,
        providerEventId: eventId,
        eventType,
        status: "matched",
        userId: user.id,
        packageId: creditPackage.id,
        packageName: creditPackage.name,
        credits: creditPackage.credits,
        amount: orderSummary.amount,
        currency: orderSummary.currency,
        buyerEmail,
        buyerName,
        rawPayload: payload,
      },
      update: {
        providerEventId: eventId,
        eventType,
        userId: user.id,
        packageId: creditPackage.id,
        packageName: creditPackage.name,
        credits: creditPackage.credits,
        amount: orderSummary.amount,
        currency: orderSummary.currency,
        buyerEmail,
        buyerName,
        rawPayload: payload,
      },
    });

    const claimed = await tx.paymentOrder.updateMany({
      where: {
        id: paymentOrder.id,
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

    await tx.user.update({
      where: { id: user.id },
      data: { credits: { increment: creditPackage.credits } },
    });

    await tx.creditEvent.create({
      data: {
        userId: user.id,
        amount: creditPackage.credits,
        action: "shopier_purchase",
        note: `Shopier purchase: ${creditPackage.name}`,
        referenceId: `shopier:${orderId}`,
        metadata: {
          provider: "shopier",
          providerOrderId: orderId,
          providerEventId: eventId,
          eventType,
          packageId: creditPackage.id,
          buyerEmail,
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
