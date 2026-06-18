import ContactSupportForm from "@/components/ContactSupportForm";
import MarketingNav from "@/components/MarketingNav";
import { getActivePaymentProviderConfig } from "@/lib/payments/providerConfig";
import { PRODUCT_SUMMARY, SELLER_INFO } from "@/lib/siteContent";

export const metadata = {
  title: "Contact - Viseo",
  description: "Contact Viseo seller support for digital real estate video credits.",
};

export default function ContactPage() {
  const providerConfig = getActivePaymentProviderConfig();

  return (
    <main className="pr-shell min-h-screen">
      <MarketingNav />
      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-14 lg:grid-cols-[.9fr_1.1fr]">
        <div className="space-y-6">
          <div>
            <p className="pr-kicker">Contact</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Contact Viseo</h1>
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
                <dt className="font-bold text-white">Email</dt>
                <dd className="mt-1 text-[var(--pr-muted)]">{SELLER_INFO.email}</dd>
              </div>
            </dl>
          </div>

          <div className="pr-section-flat p-5">
            <h2 className="text-xl font-black">About Viseo</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--pr-muted)]">{PRODUCT_SUMMARY}</p>
          </div>
        </div>

        <div className="pr-section p-5">
          <p className="pr-kicker">Support</p>
          <h2 className="mt-2 text-2xl font-black">Send a support message</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--pr-muted)]">
            Send payment, credit delivery, refund, or account questions directly to Viseo support.
          </p>
          <ContactSupportForm supportEmail={SELLER_INFO.email} />

          <div className="mt-6 rounded-lg border border-[var(--pr-border-soft)] bg-[#071010] p-4 text-sm leading-7 text-[var(--pr-muted)]">
            <p className="font-bold text-white">Support topics</p>
            <p className="mt-2">Digital credit delivery, refund requests, failed video generation, account access, and {providerConfig.displayName} checkout questions.</p>
            <p className="mt-2">{providerConfig.customerSupportText}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
