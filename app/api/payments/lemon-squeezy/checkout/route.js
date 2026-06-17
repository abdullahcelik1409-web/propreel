import { handleCheckout } from "@/app/api/payments/checkout/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request) {
  return handleCheckout(request, "lemon");
}
