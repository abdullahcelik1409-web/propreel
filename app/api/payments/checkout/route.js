import { NextResponse } from "next/server";
import { createPaymentCheckout } from "@/lib/payments/paymentService";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function handleCheckout(request, provider) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required.", redirectUrl: "/auth/login?next=/pricing" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const packageId = typeof body.packageId === "string" ? body.packageId : "";
    const result = await createPaymentCheckout({
      user,
      packageId,
      provider,
      headers: request.headers,
      metadata: {},
    });

    return NextResponse.json({
      provider: result.provider,
      checkoutId: result.providerCheckoutId,
      checkoutUrl: result.checkoutUrl,
      internalOrderId: result.internalOrderId,
      successUrl: `${(process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "")}/payments/success`,
    });
  } catch (error) {
    console.error("[payment:checkout] request failed", {
      status: error?.status || 500,
      message: error?.message || "Payment checkout failed.",
    });

    return NextResponse.json({ error: error?.message || "Payment checkout failed." }, { status: error?.status || 500 });
  }
}

export async function POST(request) {
  return handleCheckout(request);
}

export { handleCheckout };
