import { NextResponse } from "next/server";
import { processLemonSqueezyWebhook } from "@/lib/lemonSqueezyWebhook";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request) {
  try {
    const signatureHeader = request.headers.get("x-signature");
    const rawBody = await request.text();
    const result = await processLemonSqueezyWebhook({ rawBody, signatureHeader });

    return NextResponse.json({
      received: true,
      ...result,
    });
  } catch (error) {
    console.error("[lemon-squeezy:webhook] request failed", {
      status: error?.status || 500,
      message: error?.message || "Lemon Squeezy webhook failed.",
    });

    return NextResponse.json(
      {
        received: false,
        error: error?.message || "Lemon Squeezy webhook failed.",
      },
      { status: error?.status || 500 },
    );
  }
}
