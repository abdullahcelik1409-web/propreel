import Link from "next/link";

export const metadata = {
  title: "Payment Canceled - Viseo",
};

export default function LemonSqueezyPaymentCancelPage() {
  return (
    <main className="min-h-screen bg-[var(--pr-bg)] px-6 py-20 text-white">
      <div className="mx-auto max-w-2xl rounded-lg border border-[var(--pr-border-soft)] bg-[var(--pr-surface)] p-8">
        <p className="pr-kicker">Checkout canceled</p>
        <h1 className="mt-3 text-3xl font-black">No credits were added</h1>
        <p className="mt-4 text-sm leading-6 text-[var(--pr-muted)]">
          The Lemon Squeezy checkout was closed or canceled. Credits are never added from this page; only a verified order webhook can update your balance.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/pricing" className="pr-primary px-5 py-3 text-sm">
            Choose a Package
          </Link>
          <Link href="/dashboard/credits" className="rounded-md border border-[var(--pr-border-soft)] px-5 py-3 text-sm font-bold text-[var(--pr-muted)] transition hover:text-white">
            View Credits
          </Link>
        </div>
      </div>
    </main>
  );
}
