import Link from "next/link";
import { getActivePaymentProviderConfig } from "@/lib/payments/providerConfig";

export const metadata = {
  title: "Payment Received - Viseo",
};

export default function PaymentSuccessPage() {
  const providerConfig = getActivePaymentProviderConfig();

  return (
    <main className="min-h-screen bg-[var(--pr-bg)] px-6 py-20 text-white">
      <div className="mx-auto max-w-2xl rounded-lg border border-[var(--pr-border-soft)] bg-[var(--pr-surface)] p-8">
        <p className="pr-kicker">Payment received</p>
        <h1 className="mt-3 text-3xl font-black">Your credits are being confirmed</h1>
        <p className="mt-4 text-sm leading-6 text-[var(--pr-muted)]">
          {providerConfig.displayName} has received the checkout flow. Viseo credits are added only after the signed payment webhook confirms the completed order, which usually takes a few seconds.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/dashboard/credits" className="pr-primary px-5 py-3 text-sm">
            View Credits
          </Link>
          <Link href="/pricing" className="rounded-md border border-[var(--pr-border-soft)] px-5 py-3 text-sm font-bold text-[var(--pr-muted)] transition hover:text-white">
            Back to Pricing
          </Link>
        </div>
      </div>
    </main>
  );
}
