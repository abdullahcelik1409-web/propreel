import { ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { sanitizeDemoEventPayload } from "@/lib/marketing/demoConfig";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { error, data } = sanitizeDemoEventPayload(body, {
      pagePath: body?.page_path,
      referrer: body?.referrer,
      userAgent: request.headers.get("user-agent") || "",
    });

    if (error || !data) {
      return ok({ ok: false, error: error || "Invalid payload" }, { status: 400 });
    }

    try {
      await prisma.demoEvent.create({
        data,
      });
    } catch (insertError) {
      console.warn("demo analytics insert failed", insertError?.message || insertError);
      return ok({ ok: false, error: "Analytics persistence failed." }, { status: 500 });
    }

    return ok({ ok: true });
  } catch (error) {
    console.warn("demo analytics route failed", error?.message || error);
    return ok({ ok: false, error: "Unexpected analytics error." }, { status: 500 });
  }
}
