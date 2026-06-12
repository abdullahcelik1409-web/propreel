import MarketingNav from "@/components/MarketingNav";
import PricingFaq from "@/components/PricingFaq";
import PricingPlans from "@/components/PricingPlans";
import { getCreditPackagesWithPaymentLinks } from "@/lib/paymentConfig";
import { MULTI_IMAGE_VIDEO_CREDIT_COSTS, VIDEO_GENERATION_CREDIT_COST, premiumVideoConfig } from "@/lib/videoConfig";

const packageFeatures = {
  starter_credits: [
    `Up to ${Math.floor(1200 / VIDEO_GENERATION_CREDIT_COST)} Basic videos at ${VIDEO_GENERATION_CREDIT_COST} credits each`,
    `Up to ${Math.floor(1200 / MULTI_IMAGE_VIDEO_CREDIT_COSTS[10])} short Multi Image videos for richer listing tests`,
    "A smart entry pack for validating your first property video workflow",
  ],
  growth_credits: [
    `Up to ${Math.floor(3000 / VIDEO_GENERATION_CREDIT_COST)} Basic videos for recurring listing promotion`,
    `Up to ${Math.floor(3000 / MULTI_IMAGE_VIDEO_CREDIT_COSTS[30])} extended 30s Multi Image tours`,
    `Enough credit headroom for up to ${Math.floor(3000 / premiumVideoConfig.creditCost)} Ultra Cinematic showcase`,
  ],
  agency_credits: [
    `Up to ${Math.floor(9000 / MULTI_IMAGE_VIDEO_CREDIT_COSTS[30])} extended 30s Multi Image property tours`,
    `Up to ${Math.floor(9000 / premiumVideoConfig.creditCost)} Ultra Cinematic premium showcases`,
    "A balanced pack for teams mixing everyday listings with selected luxury campaigns",
  ],
  pro_credits_25000: [
    `Up to ${Math.floor(25000 / premiumVideoConfig.creditCost)} Ultra Cinematic videos at ${premiumVideoConfig.creditCost.toLocaleString("en-US")} credits each`,
    `Up to ${Math.floor(25000 / MULTI_IMAGE_VIDEO_CREDIT_COSTS[30])} extended 30s Multi Image tours for campaign variety`,
    "Built for agents running premium listing launches week after week",
  ],
  premium_credits_50000: [
    `Up to ${Math.floor(50000 / premiumVideoConfig.creditCost)} Ultra Cinematic videos for flagship property campaigns`,
    `Up to ${Math.floor(50000 / MULTI_IMAGE_VIDEO_CREDIT_COSTS[30])} extended 30s Multi Image tours for high-volume marketing`,
    "Designed for luxury portfolios, agency teams, and always-on premium production",
  ],
};

export const metadata = {
  title: "Pricing - Viseo",
  description: "Viseo digital credit packages for AI real estate marketing videos.",
};

export default function PricingPage() {
  const packages = getCreditPackagesWithPaymentLinks().map((pack) => ({
    ...pack,
    features: packageFeatures[pack.id] || ["Digital credits for Viseo video generation"],
  }));

  return (
    <main className="pr-shell min-h-screen">
      <MarketingNav />
      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="max-w-3xl">
          <p className="pr-kicker">Pricing</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Transparent USD credit packages</h1>
          <p className="mt-5 text-lg leading-8 text-[var(--pr-muted)]">
            Buy digital credits and use them to generate real estate marketing videos. Payments will be completed through secure Shopier payment links.
          </p>
        </div>
        <div className="mt-10">
          <PricingPlans packages={packages} />
        </div>
        <PricingFaq />
        <div className="pr-section mt-8 p-5">
          <p className="pr-kicker">Purchase notes</p>
          <div className="mt-4 grid gap-3 text-sm leading-7 text-[var(--pr-muted)] md:grid-cols-2">
            <p>- Credits are delivered digitally to your Viseo account after payment confirmation.</p>
            <p>- Shopier payment links open externally when package links are configured.</p>
            <p>- No subscription; one-time purchase.</p>
            <p>- Unused credits are refundable; see our Cancellation Policy.</p>
            <p>- Payments secured by Shopier.</p>
            <p>
              - Basic videos use {VIDEO_GENERATION_CREDIT_COST} credits. Multi Image videos use {MULTI_IMAGE_VIDEO_CREDIT_COSTS[10]} credits for 10s or{" "}
              {MULTI_IMAGE_VIDEO_CREDIT_COSTS[30]} credits for 30s.
            </p>
            <p>- Ultra Cinematic videos use {premiumVideoConfig.creditCost.toLocaleString("en-US")} credits per generation.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
