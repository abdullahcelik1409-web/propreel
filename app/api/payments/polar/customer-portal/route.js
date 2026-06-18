import { NextResponse } from "next/server";
import { createPaymentCustomerPortalSession } from "@/lib/payments/paymentService";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required.", redirectUrl: "/auth/login?next=/dashboard/credits" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const returnUrl = typeof body.returnUrl === "string" ? body.returnUrl : undefined;
    const result = await createPaymentCustomerPortalSession({ user, returnUrl, provider: "polar" });

    return NextResponse.json({
      provider: result.provider,
      customerPortalUrl: result.customerPortalUrl,
    });
  } catch (error) {
    console.error("[payment:polar:customer-portal] request failed", {
      status: error?.status || 500,
      message: error?.message || "Polar customer portal session failed.",
    });

    return NextResponse.json({ error: error?.message || "Polar customer portal session failed." }, { status: error?.status || 500 });
  }
}
