import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";

export const metadata = {
  title: "Payment Canceled - Viseo",
};

export default function PaddlePaymentCancelPage() {
  return (
    <main className="pr-shell min-h-screen">
      <MarketingNav />
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="pr-section p-6">
          <p className="pr-kicker">Payment not completed</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">No credits were added</h1>
          <p className="mt-4 text-sm leading-7 text-[var(--pr-muted)]">
            The Paddle checkout was closed or canceled. Credits are never added from this page; only a verified completed webhook can update your balance.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/pricing" className="pr-primary px-5 py-3 text-center text-sm">
              Return to Pricing
            </Link>
            <Link href="/contact" className="pr-secondary px-5 py-3 text-center text-sm font-semibold">
              Contact Support
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
