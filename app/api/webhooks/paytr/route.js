import { handlePaymentWebhook } from "@/app/api/webhooks/payment/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request) {
  return handlePaymentWebhook(request, "paytr");
}
