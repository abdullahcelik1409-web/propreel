import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";

export const metadata = {
  title: "Payment Processing - Viseo",
};

export default function PaddlePaymentSuccessPage() {
  return (
    <main className="pr-shell min-h-screen">
      <MarketingNav />
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="pr-section p-6">
          <p className="pr-kicker">Payment received</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">Your credits are being confirmed</h1>
          <p className="mt-4 text-sm leading-7 text-[var(--pr-muted)]">
            Paddle has received the payment flow. Viseo credits are added only after the signed Paddle webhook confirms the completed transaction, which usually takes a few seconds.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard/credits" className="pr-primary px-5 py-3 text-center text-sm">
              View Credits
            </Link>
            <Link href="/dashboard" className="pr-secondary px-5 py-3 text-center text-sm font-semibold">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
