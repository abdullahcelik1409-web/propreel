import { fail, ok } from "@/lib/api";
import { getFalUsageCostSummary } from "@/lib/falUsageCost.mjs";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const summary = await getFalUsageCostSummary();
    return ok(summary);
  } catch (error) {
    return fail(error);
  }
}
