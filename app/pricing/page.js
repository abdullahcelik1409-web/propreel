import MarketingNav from "@/components/MarketingNav";
import PricingFaq from "@/components/PricingFaq";
import PricingPlans from "@/components/PricingPlans";
import { CREDIT_PACKAGES, MULTI_IMAGE_VIDEO_CREDIT_COSTS, VIDEO_GENERATION_CREDIT_COST } from "@/lib/videoConfig";

const packageFeatures = {
  starter_credits: [
    "Digital credits for AI real estate video generation",
    `Enough for multiple basic videos at ${VIDEO_GENERATION_CREDIT_COST} credits each`,
    "Good for testing PropReel with live listings",
  ],
  growth_credits: [
    "Digital credits for active listing marketing",
    `Supports basic and multi-image videos from ${MULTI_IMAGE_VIDEO_CREDIT_COSTS[10]} credits`,
    "Best fit for weekly property promotion workflows",
  ],
  agency_credits: [
    "Digital credits for high-volume real estate teams",
    `Supports 30s multi-image videos at ${MULTI_IMAGE_VIDEO_CREDIT_COSTS[30]} credits`,
    "Best value for agencies managing many listings",
  ],
};

export const metadata = {
  title: "Pricing - PropReel",
  description: "PropReel digital credit packages for AI real estate marketing videos.",
};

export default function PricingPage() {
  const packages = CREDIT_PACKAGES.map((pack) => ({
    ...pack,
    features: packageFeatures[pack.id] || ["Digital credits for PropReel video generation"],
  }));

  return (
    <main className="pr-shell min-h-screen">
      <MarketingNav />
      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="max-w-3xl">
          <p className="pr-kicker">Pricing</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Transparent USD credit packages</h1>
          <p className="mt-5 text-lg leading-8 text-[var(--pr-muted)]">
            Buy digital credits and use them to generate real estate marketing videos. Payments will be completed through secure iyzico payment links.
          </p>
        </div>
        <div className="mt-10">
          <PricingPlans packages={packages} />
        </div>
        <PricingFaq />
        <div className="pr-section mt-8 p-5">
          <p className="pr-kicker">Purchase notes</p>
          <div className="mt-4 grid gap-3 text-sm leading-7 text-[var(--pr-muted)] md:grid-cols-2">
            <p>✓ Credits are delivered digitally to your PropReel account after payment confirmation.</p>
            <p>✓ Credits are delivered instantly after payment confirmation.</p>
            <p>✓ No subscription — one-time purchase.</p>
            <p>✓ Unused credits are refundable — see our Cancellation Policy.</p>
            <p>✓ Payments secured by iyzico (BDDK licensed).</p>
            <p>
              ✓ Basic videos use {VIDEO_GENERATION_CREDIT_COST} credits. Multi Image videos use {MULTI_IMAGE_VIDEO_CREDIT_COSTS[10]} credits for 10s or{" "}
              {MULTI_IMAGE_VIDEO_CREDIT_COSTS[30]} credits for 30s.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
