import { NextResponse } from "next/server";
import { processShopierWebhook } from "@/lib/shopierWebhook";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function formDataToPayload(formData) {
  const payload = {};
  for (const [key, value] of formData.entries()) {
    payload[key] = typeof value === "string" ? value : value.name || "";
  }
  return payload;
}

export async function POST(request) {
  try {
    const signatureHeader =
      request.headers.get("shopier-signature") ||
      request.headers.get("Shopier-Signature") ||
      request.headers.get("x-shopier-signature");
    const authorizationHeader = request.headers.get("authorization") || "";
    const contentType = request.headers.get("content-type") || "";
    const isMultipart = contentType.toLowerCase().includes("multipart/form-data");
    const parsedPayload = isMultipart ? formDataToPayload(await request.formData()) : null;
    const rawBody = parsedPayload ? JSON.stringify(parsedPayload) : await request.text();

    const result = await processShopierWebhook({ rawBody, signatureHeader, authorizationHeader, contentType, parsedPayload });

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
