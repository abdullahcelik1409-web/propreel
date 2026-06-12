import { NextResponse } from "next/server";
import { processShopierWebhook } from "@/lib/shopierWebhook";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request) {
  try {
    const rawBody = await request.text();
    const signatureHeader =
      request.headers.get("shopier-signature") ||
      request.headers.get("Shopier-Signature") ||
      request.headers.get("x-shopier-signature");
    const contentType = request.headers.get("content-type") || "";

    const result = await processShopierWebhook({ rawBody, signatureHeader, contentType });

    return NextResponse.json({
      received: true,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        received: false,
        error: error?.message || "Shopier webhook failed.",
      },
      { status: error?.status || 500 },
    );
  }
}
