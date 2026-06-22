import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";
import PricingPlans from "@/components/PricingPlans";
import { getCreditPackagesWithPaymentConfig } from "@/lib/paymentConfig";
import { PRODUCTION_DEFAULT_USER_CREDITS } from "@/lib/videoConfig";

const features = [
  {
    title: "Upload Photos",
    body: "Add the strongest property visuals and keep them ready for video production.",
    icon: "upload",
  },
  {
    title: "Add Listing Details",
    body: "Use price, location, beds, baths, features, and selling angles as structured campaign context.",
    icon: "clipboard",
  },
  {
    title: "Generate Video",
    body: "Choose a production mode, style direction, format, and launch a property video from the workspace.",
    icon: "sparkles",
  },
  {
    title: "Download & Share",
    body: "Export completed videos for YouTube, LinkedIn, Instagram, TikTok, and listing pages.",
    icon: "share",
  },
];

const packageFeatures = {
  starter_credits: ["Launch your first property video tests"],
  growth_credits: ["Scale routine listing promotion"],
  agency_credits: ["Blend multi-image tours with premium showcases"],
  pro_credits_25000: ["Up to 10 Ultra Cinematic campaigns"],
  premium_credits_50000: ["Up to 20 flagship premium campaigns"],
};

function FeatureIcon({ type }) {
  const className = "h-6 w-6";

  if (type === "clipboard") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <path d="M9 4H15L16 6H19V20H5V6H8L9 4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M8 11H16M8 15H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "sparkles") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <path d="M8 5L9.5 9.5L14 11L9.5 12.5L8 17L6.5 12.5L2 11L6.5 9.5L8 5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M17 4L18 7L21 8L18 9L17 12L16 9L13 8L16 7L17 4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M15 15L20 18L15 21V15Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "share") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <path d="M12 4V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 11L12 15L16 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 17V20H19V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M16 16L12 12L8 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 12V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 17.5C21.2 16.6 22 15.2 22 13.5C22 10.7 19.8 8.5 17 8.5H16.4C15.5 5.9 13.1 4 10.2 4C6.8 4 4 6.8 4 10.2C2.2 10.8 1 12.4 1 14.3C1 16.7 2.9 18.5 5.2 18.5H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function LandingPage() {
  const packages = getCreditPackagesWithPaymentConfig().map((pack) => ({
    ...pack,
    features: packageFeatures[pack.id] || [pack.description],
  }));

  return (
    <main className="pr-shell min-h-screen overflow-hidden">
      <MarketingNav />

      <section className="mx-0 grid max-w-[390px] gap-10 px-4 pb-16 pt-10 sm:mx-auto sm:max-w-7xl sm:px-6 lg:grid-cols-[1.02fr_.98fr] lg:pb-24 lg:pt-16">
        <div className="flex min-w-0 flex-col justify-center">
          <div className="mb-5 inline-flex w-fit rounded-full border border-[var(--pr-cyan)]/25 bg-[var(--pr-cyan-soft)] px-4 py-2 text-xs font-bold text-[var(--pr-cyan)]">
            {PRODUCTION_DEFAULT_USER_CREDITS} free credits with every new account
          </div>
          <h1 className="max-w-[22rem] break-words text-3xl font-black leading-[1.04] tracking-tight sm:max-w-4xl sm:text-4xl md:text-6xl">
            Property video production for modern real estate agents
          </h1>
          <p className="mt-6 max-w-[22rem] text-base leading-7 text-[var(--pr-muted)] sm:max-w-2xl sm:text-lg sm:leading-8">
            Viseo turns listing photos, price, location, and property features into clean marketing videos for agents who need repeatable campaign output.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/auth/register" className="pr-primary px-5 py-3 text-center">
              Start free
            </Link>
            <Link href="#how-it-works" className="pr-secondary px-5 py-3 text-center font-semibold">
              See workflow
            </Link>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="pr-card p-4">
              <p className="text-2xl font-black text-white">16:9</p>
              <p className="mt-1 text-sm text-[var(--pr-muted)]">Web and YouTube</p>
            </div>
            <div className="pr-card p-4">
              <p className="text-2xl font-black text-white">1:1</p>
              <p className="mt-1 text-sm text-[var(--pr-muted)]">Social feed</p>
            </div>
            <div className="pr-card p-4">
              <p className="text-2xl font-black text-white">USD</p>
              <p className="mt-1 text-sm text-[var(--pr-muted)]">One-time credits</p>
            </div>
          </div>
        </div>

        <div className="pr-section min-w-0 p-4 shadow-2xl">
          <div className="relative overflow-hidden rounded-xl border border-[var(--pr-border-soft)] bg-[#071010]">
            <div className="relative aspect-[16/11] bg-[#10201f]">
              <video
                className="absolute inset-0 h-full w-full object-cover"
                src="/assets/hero-campaign-preview.mp4"
                poster="/assets/hero-campaign-preview.jpg"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-hidden="true"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,16,16,0.10),rgba(7,16,16,0.18)_45%,rgba(7,16,16,0.40))]" />
            </div>
            <div className="grid gap-px bg-[var(--pr-border-soft)] sm:grid-cols-3">
              <div className="bg-[#071010] p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--pr-dim)]">Input</p>
                <p className="mt-1 font-bold">10 listing photos</p>
              </div>
              <div className="bg-[#071010] p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--pr-dim)]">Context</p>
                <p className="mt-1 font-bold">AI-built sales story</p>
              </div>
              <div className="bg-[#071010] p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--pr-dim)]">Output</p>
                <p className="mt-1 font-bold">Ready-to-share reel</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-0 max-w-[390px] px-4 pb-20 sm:mx-auto sm:max-w-7xl sm:px-6">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="pr-kicker">How it works</p>
            <h2 className="mt-2 text-3xl font-black">From property data to campaign video</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-[var(--pr-muted)]">
            The workflow stays practical for agents: collect details once, select photos, then generate repeatable outputs from the dashboard.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {features.map((feature, index) => (
            <div key={feature.title} className="pr-card relative overflow-hidden p-5">
              <span className="absolute right-4 top-2 text-5xl font-black text-[var(--pr-cyan)] opacity-10">{String(index + 1).padStart(2, "0")}</span>
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--pr-cyan)]/25 bg-[var(--pr-cyan-soft)] text-[var(--pr-cyan)]">
                <FeatureIcon type={feature.icon} />
              </div>
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--pr-muted)]">{feature.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <div className="mb-6 text-center">
            <p className="text-sm font-bold text-[var(--pr-cyan)]">Credit packages</p>
            <h2 className="mt-2 text-3xl font-black">Start free, scale with USD credit packs.</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[var(--pr-muted)]">
              One-time credit purchases. No subscription lock-in.
            </p>
          </div>
          <PricingPlans packages={packages} compact />
        </div>
      </section>
    </main>
  );
}
