import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";

export const metadata = {
  title: "Paddle Checkout - Viseo",
};

export default function PaddleHostedCheckoutPage() {
  return (
    <main className="pr-shell min-h-screen">
      <MarketingNav />
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="pr-section p-6">
          <p className="pr-kicker">Paddle checkout</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">Continue your secure payment</h1>
          <p className="mt-4 text-sm leading-7 text-[var(--pr-muted)]">
            If Paddle opened this page from a payment link, return to the pricing page and start checkout from the package button. The app creates a server-side Paddle transaction and opens the verified checkout overlay.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/pricing" className="pr-primary px-5 py-3 text-center text-sm">
              Open Pricing
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
