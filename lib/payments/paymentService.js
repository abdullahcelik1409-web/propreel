import crypto from "crypto";
import { prisma } from "../prisma.js";
import { getPackageConfig } from "./packageConfig.js";
import { getActivePaymentProvider, getPaymentProviderConfig, resolvePaymentProvider } from "./providerConfig.js";
import { lemonAdapter } from "./providers/lemon.js";
import { paytrAdapter } from "./providers/paytr.js";
import { polarAdapter } from "./providers/polar.js";

const adapters = {
  lemon: lemonAdapter,
  polar: polarAdapter,
  paytr: paytrAdapter,
};

function paymentError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function getAppUrl(env = process.env) {
  return env.NEXT_PUBLIC_APP_URL || env.NEXTAUTH_URL || "http://localhost:3000";
}

function asAmount(value) {
  if (value === undefined || value === null || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(2) : String(value);
}

function isExpectedAmount(webhookResult, packageConfig) {
  const actual = asAmount(webhookResult.amount);
  if (!actual) return true;
  return actual === Number(packageConfig.priceUsd).toFixed(2);
}

function isExpectedCurrency(webhookResult, packageConfig) {
  if (!webhookResult.currency) return true;
  return String(webhookResult.currency).toUpperCase() === String(packageConfig.currency || "USD").toUpperCase();
}

function isExpectedProviderMapping(webhookResult, packageConfig) {
  if (webhookResult.provider === "paytr") return true;
  if (webhookResult.providerPriceId && packageConfig.providerPriceId && String(webhookResult.providerPriceId) !== String(packageConfig.providerPriceId)) return false;
  if (webhookResult.providerProductId && packageConfig.providerProductId && String(webhookResult.providerProductId) !== String(packageConfig.providerProductId)) return false;
  return true;
}

function orderKeyFromWebhook(webhookResult) {
  return webhookResult.providerTransactionId || webhookResult.providerCheckoutId || webhookResult.eventId;
}

async function upsertPaymentOrder({ tx = prisma, webhookResult, packageConfig, status }) {
  const providerOrderId = orderKeyFromWebhook(webhookResult);
  if (!providerOrderId) throw paymentError("Provider transaction id is missing.", 400);

  const data = {
    provider: webhookResult.provider,
    providerOrderId,
    providerEventId: webhookResult.eventId,
    eventType: webhookResult.eventType,
    status,
    userId: webhookResult.userId,
    packageId: packageConfig?.id || webhookResult.packageId,
    packageName: packageConfig?.name || null,
    credits: packageConfig?.credits || 0,
    amount: asAmount(webhookResult.amount) || (packageConfig ? Number(packageConfig.priceUsd).toFixed(2) : null),
    currency: webhookResult.currency || packageConfig?.currency || "USD",
    buyerEmail: webhookResult.buyerEmail || null,
    buyerName: webhookResult.buyerName || null,
    providerCustomerId: webhookResult.providerCustomerId || null,
    providerSubscriptionId: webhookResult.providerSubscriptionId || null,
    providerProductId: webhookResult.providerProductId || packageConfig?.providerProductId || null,
    providerPriceId: webhookResult.providerPriceId || packageConfig?.providerPriceId || null,
    internalOrderId: webhookResult.internalOrderId || null,
    taxAmount: webhookResult.taxAmount || null,
    rawPayload: webhookResult.rawPayload,
  };

  return tx.paymentOrder.upsert({
    where: { provider_providerOrderId: { provider: webhookResult.provider, providerOrderId } },
    create: data,
    update: data,
  });
}

async function markWebhookEvent(provider, eventId, data) {
  return prisma.paymentWebhookEvent.update({
    where: { provider_eventId: { provider, eventId } },
    data,
  });
}

async function processPaidWebhook(webhookResult) {
  if (!webhookResult.userId) {
    const packageConfig = webhookResult.packageId ? getPackageConfig(webhookResult.packageId, webhookResult.provider) : null;
    await upsertPaymentOrder({ webhookResult, packageConfig, status: "unresolved" });
    return { status: "unresolved", credited: false, reason: "user_id_missing" };
  }

  const packageConfig = getPackageConfig(webhookResult.packageId, webhookResult.provider);
  if (!packageConfig || !packageConfig.active) {
    await upsertPaymentOrder({ webhookResult, packageConfig: null, status: "failed" });
    return { status: "failed", credited: false, reason: "package_not_matched" };
  }

  if (!isExpectedProviderMapping(webhookResult, packageConfig)) {
    await upsertPaymentOrder({ webhookResult, packageConfig, status: "failed" });
    return { status: "failed", credited: false, reason: "provider_price_or_product_mismatch" };
  }

  if (!isExpectedAmount(webhookResult, packageConfig) || !isExpectedCurrency(webhookResult, packageConfig)) {
    await upsertPaymentOrder({ webhookResult, packageConfig, status: "failed" });
    return { status: "failed", credited: false, reason: "amount_or_currency_mismatch" };
  }

  const user = await prisma.user.findUnique({
    where: { id: webhookResult.userId },
    select: { id: true, email: true },
  });

  if (!user) {
    await upsertPaymentOrder({ webhookResult, packageConfig, status: "unresolved" });
    return { status: "unresolved", credited: false, reason: "user_not_found" };
  }

  return prisma.$transaction(async (tx) => {
    const paymentOrder = await upsertPaymentOrder({
      tx,
      webhookResult: { ...webhookResult, userId: user.id },
      packageConfig,
      status: "matched",
    });

    const claimed = await tx.paymentOrder.updateMany({
      where: {
        id: paymentOrder.id,
        provider: webhookResult.provider,
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
      data: { credits: { increment: packageConfig.credits } },
      select: { credits: true },
    });

    await tx.creditEvent.create({
      data: {
        userId: user.id,
        amount: packageConfig.credits,
        action: `${webhookResult.provider}_purchase`,
        note: `${getPaymentProviderConfig(webhookResult.provider).displayName} purchase: ${packageConfig.name}`,
        referenceId: `${webhookResult.provider}:${paymentOrder.providerOrderId}`,
        metadata: {
          provider: webhookResult.provider,
          providerOrderId: paymentOrder.providerOrderId,
          providerEventId: webhookResult.eventId,
          eventType: webhookResult.eventType,
          packageId: packageConfig.id,
          providerPriceId: webhookResult.providerPriceId,
          providerProductId: webhookResult.providerProductId,
          internalOrderId: webhookResult.internalOrderId,
          balanceAfter: updatedUser.credits,
        },
      },
    });

    return {
      status: "credited",
      credited: true,
      paymentOrderId: paymentOrder.id,
      userId: user.id,
      packageId: packageConfig.id,
      credits: packageConfig.credits,
    };
  });
}

export function getPaymentAdapter(provider = getActivePaymentProvider()) {
  const resolvedProvider = resolvePaymentProvider(provider);
  const adapter = adapters[resolvedProvider];
  if (!adapter) throw paymentError(`Payment adapter is not registered for ${resolvedProvider}.`, 500);
  return adapter;
}

export async function createPaymentCheckout({ user, packageId, headers, metadata = {}, provider = getActivePaymentProvider(), env = process.env }) {
  const resolvedProvider = resolvePaymentProvider(provider, env);
  const packageConfig = getPackageConfig(packageId, resolvedProvider, env);
  if (!packageConfig) throw paymentError("Unknown credit package.", 400);
  if (!packageConfig.active) throw paymentError("Credit package is not active.", 400);

  const baseUrl = getAppUrl(env).replace(/\/$/, "");
  const internalOrderId = crypto.randomUUID();
  const adapter = getPaymentAdapter(resolvedProvider);
  const result = await adapter.createCheckout({
    packageConfig,
    user,
    internalOrderId,
    successUrl: `${baseUrl}/payments/success`,
    cancelUrl: `${baseUrl}/payments/cancel`,
    headers,
    metadata,
    env,
  });

  const providerOrderId = result.providerCheckoutId || result.providerTransactionId || internalOrderId;
  await prisma.paymentOrder.upsert({
    where: { provider_providerOrderId: { provider: resolvedProvider, providerOrderId } },
    create: {
      provider: resolvedProvider,
      providerOrderId,
      status: "checkout_created",
      userId: user.id,
      packageId: packageConfig.id,
      packageName: packageConfig.name,
      credits: packageConfig.credits,
      amount: Number(packageConfig.priceUsd).toFixed(2),
      currency: packageConfig.currency,
      buyerEmail: user.email,
      buyerName: user.name,
      providerPriceId: packageConfig.providerPriceId,
      providerProductId: packageConfig.providerProductId,
      internalOrderId,
      rawPayload: result.rawPayload || result,
    },
    update: {
      status: "checkout_created",
      userId: user.id,
      packageId: packageConfig.id,
      packageName: packageConfig.name,
      credits: packageConfig.credits,
      amount: Number(packageConfig.priceUsd).toFixed(2),
      currency: packageConfig.currency,
      buyerEmail: user.email,
      buyerName: user.name,
      providerPriceId: packageConfig.providerPriceId,
      providerProductId: packageConfig.providerProductId,
      internalOrderId,
      rawPayload: result.rawPayload || result,
    },
  });

  return {
    ...result,
    provider: resolvedProvider,
    internalOrderId,
    packageId: packageConfig.id,
  };
}

export async function processPaymentWebhook({ provider = getActivePaymentProvider(), rawBody, headers, env = process.env }) {
  const resolvedProvider = resolvePaymentProvider(provider, env);
  const adapter = getPaymentAdapter(resolvedProvider);

  if (!adapter.verifyWebhook(rawBody, headers, env)) {
    throw paymentError(`Invalid ${getPaymentProviderConfig(resolvedProvider).displayName} webhook signature.`, 401);
  }

  const webhookResult = adapter.parseWebhook(rawBody, headers, env);
  if (!webhookResult.eventId || !webhookResult.eventType) {
    throw paymentError("Payment webhook event id or type is missing.", 400);
  }

  try {
    await prisma.paymentWebhookEvent.create({
      data: {
        provider: resolvedProvider,
        eventId: webhookResult.eventId,
        eventType: webhookResult.eventType,
        processingStatus: "received",
        rawPayload: webhookResult.rawPayload,
      },
    });
  } catch (error) {
    if (error?.code === "P2002") {
      return { status: "duplicate_event", credited: false };
    }
    throw error;
  }

  try {
    if (webhookResult.status === "paid") {
      const result = await processPaidWebhook(webhookResult);
      await markWebhookEvent(resolvedProvider, webhookResult.eventId, {
        processingStatus: result.credited || result.status === "already_credited" ? "processed" : result.status === "failed" || result.status === "unresolved" ? "failed" : "ignored",
        errorMessage: result.reason || null,
        processedAt: new Date(),
      });
      return result;
    }

    if (webhookResult.status === "refunded") {
      const providerOrderId = orderKeyFromWebhook(webhookResult);
      if (providerOrderId) {
        await prisma.paymentOrder.updateMany({
          where: { provider: resolvedProvider, providerOrderId },
          data: { status: "refund_review", rawPayload: webhookResult.rawPayload },
        });
      }
      await markWebhookEvent(resolvedProvider, webhookResult.eventId, { processingStatus: "processed", processedAt: new Date() });
      return { status: "refund_review", credited: false };
    }

    if (webhookResult.status === "failed") {
      await upsertPaymentOrder({ webhookResult, packageConfig: webhookResult.packageId ? getPackageConfig(webhookResult.packageId, resolvedProvider) : null, status: "failed" });
      await markWebhookEvent(resolvedProvider, webhookResult.eventId, { processingStatus: "failed", processedAt: new Date() });
      return { status: "failed", credited: false };
    }

    await markWebhookEvent(resolvedProvider, webhookResult.eventId, { processingStatus: "ignored", processedAt: new Date() });
    return { status: "ignored", credited: false, reason: "event_not_handled" };
  } catch (error) {
    await markWebhookEvent(resolvedProvider, webhookResult.eventId, {
      processingStatus: "failed",
      errorMessage: error?.message || "Payment webhook processing failed.",
      processedAt: new Date(),
    });
    throw error;
  }
}
