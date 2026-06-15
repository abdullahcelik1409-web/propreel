import Link from "next/link";

export const metadata = {
  title: "Lemon Squeezy Checkout - Viseo",
};

export default function LemonSqueezyHostedCheckoutPage() {
  return (
    <main className="min-h-screen bg-[var(--pr-bg)] px-6 py-20 text-white">
      <div className="mx-auto max-w-2xl rounded-lg border border-[var(--pr-border-soft)] bg-[var(--pr-surface)] p-8">
        <p className="pr-kicker">Lemon Squeezy checkout</p>
        <h1 className="mt-3 text-3xl font-black">Start checkout from Viseo</h1>
        <p className="mt-4 text-sm leading-6 text-[var(--pr-muted)]">
          Return to the pricing page and start checkout from a package button. The app creates a server-side Lemon Squeezy checkout with your account and package metadata before redirecting you to the secure checkout page.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/pricing" className="pr-primary px-5 py-3 text-sm">
            Go to Pricing
          </Link>
          <Link href="/dashboard/credits" className="rounded-md border border-[var(--pr-border-soft)] px-5 py-3 text-sm font-bold text-[var(--pr-muted)] transition hover:text-white">
            View Credits
          </Link>
        </div>
      </div>
    </main>
  );
}
