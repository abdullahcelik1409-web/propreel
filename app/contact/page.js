import MarketingNav from "@/components/MarketingNav";
import { PRODUCT_SUMMARY, SELLER_INFO } from "@/lib/siteContent";

export const metadata = {
  title: "Contact - PropReel",
  description: "Contact PropReel seller support for digital real estate video credits.",
};

export default function ContactPage() {
  return (
    <main className="pr-shell min-h-screen">
      <MarketingNav />
      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-14 lg:grid-cols-[.9fr_1.1fr]">
        <div className="space-y-6">
          <div>
            <p className="pr-kicker">Contact</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Contact PropReel</h1>
            <p className="mt-5 text-lg leading-8 text-[var(--pr-muted)]">
              Reach us for questions about digital credit packages, AI video generation, refunds, and account support.
            </p>
          </div>

          <div className="pr-section p-5">
            <h2 className="text-xl font-black">Seller information</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="font-bold text-white">Seller</dt>
                <dd className="mt-1 text-[var(--pr-muted)]">{SELLER_INFO.displayName}</dd>
              </div>
              <div>
                <dt className="font-bold text-white">Address</dt>
                <dd className="mt-1 text-[var(--pr-muted)]">{SELLER_INFO.address}</dd>
              </div>
              <div>
                <dt className="font-bold text-white">Phone</dt>
                <dd className="mt-1 text-[var(--pr-muted)]">{SELLER_INFO.phone}</dd>
              </div>
              <div>
                <dt className="font-bold text-white">Email</dt>
                <dd className="mt-1 text-[var(--pr-muted)]">{SELLER_INFO.email}</dd>
              </div>
            </dl>
          </div>

          <div className="pr-section-flat p-5">
            <h2 className="text-xl font-black">About PropReel</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--pr-muted)]">{PRODUCT_SUMMARY}</p>
          </div>
        </div>

        <form className="pr-section p-5" aria-label="Contact form">
          <h2 className="text-xl font-black">Send a message</h2>
          <p className="mt-2 text-sm text-[var(--pr-muted)]">This form is a contact UI. You can also email us directly for support.</p>
          <div className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-bold">
              Name
              <input className="pr-input px-3 py-3 font-normal" placeholder="Your name" />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Email
              <input type="email" className="pr-input px-3 py-3 font-normal" placeholder="you@example.com" />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Subject
              <input className="pr-input px-3 py-3 font-normal" placeholder="Credit package or account support" />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Message
              <textarea className="pr-input min-h-36 px-3 py-3 font-normal" placeholder="How can we help?" />
            </label>
            <button type="button" className="pr-primary px-5 py-3 text-sm">
              Send Message
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
