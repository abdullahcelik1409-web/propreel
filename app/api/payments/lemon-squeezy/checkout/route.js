import crypto from "crypto";
import { NextResponse } from "next/server";
import { createLemonSqueezyCheckout, isLemonSqueezyApiConfigured } from "@/lib/lemonSqueezyApi";
import { getLemonSqueezyPackageConfig } from "@/lib/paymentConfig";
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
    const packageConfig = getLemonSqueezyPackageConfig(packageId);
    if (!packageConfig) {
      return NextResponse.json({ error: "Unknown credit package." }, { status: 400 });
    }

    if (!packageConfig.lemonSqueezyVariantId) {
      return NextResponse.json({ error: "Lemon Squeezy variant ID is not configured for this package." }, { status: 503 });
    }

    if (!isLemonSqueezyApiConfigured()) {
      return NextResponse.json({ error: "Lemon Squeezy API key or store ID is not configured." }, { status: 503 });
    }

    const internalOrderId = crypto.randomUUID();
    const checkoutResponse = await createLemonSqueezyCheckout({
      packageConfig,
      user,
      internalOrderId,
      appUrl: getAppUrl(),
    });

    const checkout = checkoutResponse?.data;
    const checkoutUrl = checkout?.attributes?.url;
    if (!checkout?.id || !checkoutUrl) {
      return NextResponse.json({ error: "Lemon Squeezy did not return a checkout URL." }, { status: 502 });
    }

    await prisma.paymentOrder.upsert({
      where: { providerOrderId: checkout.id },
      create: {
        provider: "lemon_squeezy",
        providerOrderId: checkout.id,
        status: "checkout_created",
        userId: user.id,
        packageId: packageConfig.id,
        packageName: packageConfig.name,
        credits: packageConfig.credits,
        amount: packageConfig.priceUsd.toFixed(2),
        currency: packageConfig.currency,
        buyerEmail: user.email,
        buyerName: user.name,
        providerPriceId: packageConfig.lemonSqueezyVariantId,
        providerProductId: packageConfig.lemonSqueezyProductId,
        internalOrderId,
        rawPayload: checkout,
      },
      update: {
        status: "checkout_created",
        userId: user.id,
        packageId: packageConfig.id,
        packageName: packageConfig.name,
        credits: packageConfig.credits,
        amount: packageConfig.priceUsd.toFixed(2),
        currency: packageConfig.currency,
        buyerEmail: user.email,
        buyerName: user.name,
        providerPriceId: packageConfig.lemonSqueezyVariantId,
        providerProductId: packageConfig.lemonSqueezyProductId,
        internalOrderId,
        rawPayload: checkout,
      },
    });

    return NextResponse.json({
      checkoutId: checkout.id,
      checkoutUrl,
      successUrl: `${getAppUrl().replace(/\/$/, "")}/payments/lemon-squeezy/success`,
    });
  } catch (error) {
    console.error("[lemon-squeezy:checkout] request failed", {
      status: error?.status || 500,
      message: error?.message || "Lemon Squeezy checkout failed.",
    });

    return NextResponse.json(
      {
        error: error?.message || "Lemon Squeezy checkout failed.",
      },
      { status: error?.status || 500 },
    );
  }
}
