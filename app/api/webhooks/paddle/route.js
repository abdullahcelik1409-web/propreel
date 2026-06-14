import { NextResponse } from "next/server";
import { processPaddleWebhook } from "@/lib/paddleWebhook";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request) {
  try {
    const signatureHeader = request.headers.get("paddle-signature");
    const rawBody = await request.text();
    const result = await processPaddleWebhook({ rawBody, signatureHeader });

    return NextResponse.json({
      received: true,
      ...result,
    });
  } catch (error) {
    console.error("[paddle:webhook] request failed", {
      status: error?.status || 500,
      message: error?.message || "Paddle webhook failed.",
    });

    return NextResponse.json(
      {
        received: false,
        error: error?.message || "Paddle webhook failed.",
      },
      { status: error?.status || 500 },
    );
  }
}
