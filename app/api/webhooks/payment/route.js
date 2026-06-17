import { NextResponse } from "next/server";
import { processPaymentWebhook } from "@/lib/payments/paymentService";
import { getActivePaymentProvider, resolvePaymentProvider } from "@/lib/payments/providerConfig";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function handlePaymentWebhook(request, provider) {
  try {
    const url = new URL(request.url);
    const routeProvider = provider || url.searchParams.get("provider") || getActivePaymentProvider();
    const resolvedProvider = resolvePaymentProvider(routeProvider);
    const rawBody = await request.text();
    const result = await processPaymentWebhook({
      provider: resolvedProvider,
      rawBody,
      headers: request.headers,
    });

    return NextResponse.json({
      received: true,
      provider: resolvedProvider,
      ...result,
    });
  } catch (error) {
    console.error("[payment:webhook] request failed", {
      status: error?.status || 500,
      message: error?.message || "Payment webhook failed.",
    });

    return NextResponse.json(
      {
        received: false,
        error: error?.message || "Payment webhook failed.",
      },
      { status: error?.status || 500 },
    );
  }
}

export async function POST(request) {
  return handlePaymentWebhook(request);
}

export { handlePaymentWebhook };
