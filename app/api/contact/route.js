import { NextResponse } from "next/server";
import { sendContactEmail, validateContactMessage } from "@/lib/contactEmail";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const validation = validateContactMessage(body);

    if (validation.data.website) {
      return NextResponse.json({ ok: true });
    }

    if (!validation.ok) {
      return NextResponse.json({ error: "Check the highlighted fields.", errors: validation.errors }, { status: 400 });
    }

    const pageUrl = typeof body.pageUrl === "string" ? body.pageUrl : undefined;
    const result = await sendContactEmail(validation.data, {
      pageUrl,
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({ ok: true, id: result?.id || null });
  } catch (error) {
    console.error("[contact] message failed", {
      status: error?.status || 500,
      message: error?.message || "Contact message failed.",
    });

    return NextResponse.json({ error: error?.message || "Contact message failed." }, { status: error?.status || 500 });
  }
}
