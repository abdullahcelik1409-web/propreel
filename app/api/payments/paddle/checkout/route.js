import crypto from "crypto";
import { NextResponse } from "next/server";
import { createPaddleTransaction, getPaddleEnvironment, isPaddleApiConfigured } from "@/lib/paddleApi";
import { getPaddlePackageConfig } from "@/lib/paymentConfig";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
}

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required.", redirectUrl: "/auth/login?next=/pricing" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const packageId = typeof body.packageId === "string" ? body.packageId : "";
    const packageConfig = getPaddlePackageConfig(packageId);
    if (!packageConfig) {
      return NextResponse.json({ error: "Unknown credit package." }, { status: 400 });
    }

    if (!packageConfig.paddlePriceId) {
      return NextResponse.json({ error: "Paddle price ID is not configured for this package." }, { status: 503 });
    }

    if (!isPaddleApiConfigured()) {
      return NextResponse.json({ error: "Paddle API key is not configured." }, { status: 503 });
    }

    const internalOrderId = crypto.randomUUID();
    const paddleTransaction = await createPaddleTransaction({
      packageConfig,
      user,
      internalOrderId,
      appUrl: getAppUrl(),
    });

    const transaction = paddleTransaction?.data;
    if (!transaction?.id) {
      return NextResponse.json({ error: "Paddle did not return a transaction ID." }, { status: 502 });
    }

    await prisma.paymentOrder.upsert({
      where: { providerOrderId: transaction.id },
      create: {
        provider: "paddle",
        providerOrderId: transaction.id,
        status: transaction.status || "checkout_created",
        userId: user.id,
        packageId: packageConfig.id,
        packageName: packageConfig.name,
        credits: packageConfig.credits,
        amount: packageConfig.priceUsd.toFixed(2),
        currency: packageConfig.currency,
        buyerEmail: user.email,
        buyerName: user.name,
        providerPriceId: packageConfig.paddlePriceId,
        providerProductId: packageConfig.paddleProductId,
        providerCustomerId: transaction.customer_id,
        providerSubscriptionId: transaction.subscription_id,
        internalOrderId,
        rawPayload: transaction,
      },
      update: {
        status: transaction.status || "checkout_created",
        userId: user.id,
        packageId: packageConfig.id,
        packageName: packageConfig.name,
        credits: packageConfig.credits,
        amount: packageConfig.priceUsd.toFixed(2),
        currency: packageConfig.currency,
        buyerEmail: user.email,
        buyerName: user.name,
        providerPriceId: packageConfig.paddlePriceId,
        providerProductId: packageConfig.paddleProductId,
        providerCustomerId: transaction.customer_id,
        providerSubscriptionId: transaction.subscription_id,
        internalOrderId,
        rawPayload: transaction,
      },
    });

    return NextResponse.json({
      transactionId: transaction.id,
      checkoutUrl: transaction.checkout?.url || null,
      clientToken: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || null,
      environment: getPaddleEnvironment(),
      successUrl: `${getAppUrl().replace(/\/$/, "")}/payments/paddle/success`,
    });
  } catch (error) {
    console.error("[paddle:checkout] request failed", {
      status: error?.status || 500,
      message: error?.message || "Paddle checkout failed.",
    });

    return NextResponse.json(
      {
        error: error?.message || "Paddle checkout failed.",
      },
      { status: error?.status || 500 },
    );
  }
}
