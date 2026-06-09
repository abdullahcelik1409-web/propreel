import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";
import PricingPlans from "@/components/PricingPlans";
import { getCreditPackagesWithPaymentLinks } from "@/lib/paymentConfig";
import { PRODUCTION_DEFAULT_USER_CREDITS } from "@/lib/videoConfig";

const features = [
  {
    title: "Upload Photos",
    body: "Add property photos and keep the strongest visuals ready for video generation.",
    icon: "upload",
  },
  {
    title: "Add Listing Details",
    body: "Price, location, beds, baths, features, and selling angles in one structured flow.",
    icon: "clipboard",
  },
  {
    title: "Generate Video",
    body: "Create property marketing videos with model-specific styles and scene direction.",
    icon: "sparkles",
  },
  {
    title: "Download & Share",
    body: "Export completed videos for YouTube, LinkedIn, Instagram, TikTok, and listing pages.",
    icon: "share",
  },
];

const packageFeatures = {
  starter_credits: ["Starter batch for new listings"],
  growth_credits: ["Most popular for active agents"],
  agency_credits: ["Best value for teams and agencies"],
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
  const packages = getCreditPackagesWithPaymentLinks().map((pack) => ({
    ...pack,
    features: packageFeatures[pack.id] || [pack.description],
  }));

  return (
    <main className="pr-shell min-h-screen">
      <MarketingNav />

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[1.05fr_.95fr] lg:py-20">
        <div className="flex flex-col justify-center">
          <div className="mb-5 inline-flex w-fit rounded-md border border-[var(--pr-cyan)]/25 bg-[var(--pr-cyan-soft)] px-3 py-1 text-xs font-bold text-[var(--pr-cyan)]">
            {PRODUCTION_DEFAULT_USER_CREDITS} free credits with every new account - no credit card required
          </div>
          <h1 className="max-w-4xl text-4xl font-black leading-[1.05] tracking-tight md:text-6xl">
            Property video production for working real estate agents
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--pr-muted)]">
            PropReel turns listing photos, prices, location data, and property features into clean marketing videos for agencies that need repeatable output.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/auth/register" className="pr-primary px-5 py-3 text-center">
              Start free
            </Link>
            <Link href="#how-it-works" className="pr-secondary px-5 py-3 text-center font-semibold">
              See how it works
            </Link>
          </div>
        </div>

        <div className="pr-section p-5 shadow-2xl transition hover:shadow-[0_0_40px_rgba(0,251,251,0.10)]">
          <div className="rounded-md border border-[var(--pr-border-soft)] bg-[#071010] p-4">
            <div className="relative aspect-video overflow-hidden rounded-md bg-[linear-gradient(160deg,#20322f,#0d1515,#24342f)] p-4">
              <span className="absolute left-4 top-4 rounded-md border border-white/10 bg-black/35 px-3 py-1 text-xs font-black text-white">
                Sample Output
              </span>
              <div className="flex h-full items-center justify-center rounded-md border border-[var(--pr-border-soft)] bg-black/20">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[var(--pr-cyan)]/35 bg-[var(--pr-cyan-soft)] text-3xl text-[var(--pr-cyan)] shadow-[0_0_34px_rgba(0,251,251,0.12)]">
                  <svg viewBox="0 0 24 24" fill="none" className="h-9 w-9" aria-hidden="true">
                    <path d="M8 5L19 12L8 19V5Z" fill="currentColor" />
                  </svg>
                </div>
              </div>
            </div>
            <h2 className="mt-5 text-2xl font-bold">Ocean View Villa</h2>
            <p className="mt-2 text-sm text-[var(--pr-muted)]">Luxury property showcase, 30s marketing video</p>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs font-bold">
              <span className="rounded-md border border-[var(--pr-border-soft)] bg-[#071010] py-2 text-[var(--pr-muted)]">16:9</span>
              <span className="rounded-md border border-violet-400/30 bg-violet-500/10 py-2 text-violet-200">Luxury</span>
              <span className="rounded-md border border-emerald-400/30 bg-emerald-500/10 py-2 text-emerald-200">Ready</span>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-6 pb-20">
        <div className="mb-6">
          <p className="pr-kicker">How it works</p>
          <h2 className="mt-2 text-3xl font-black">From listing photos to social-ready video</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {features.map((feature, index) => (
            <div key={feature.title} className="pr-section-flat relative overflow-hidden p-5">
              <span className="absolute right-4 top-2 text-5xl font-black text-[var(--pr-cyan)] opacity-10">{String(index + 1).padStart(2, "0")}</span>
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-md border border-[var(--pr-cyan)]/25 bg-[var(--pr-cyan-soft)] text-[var(--pr-cyan)]">
                <FeatureIcon type={feature.icon} />
              </div>
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--pr-muted)]">{feature.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <div className="mb-5 text-center">
            <p className="text-sm font-bold text-[var(--pr-cyan)]">Credit packages</p>
            <h2 className="mt-2 text-2xl font-bold">Start free, scale when your listings do.</h2>
          </div>
          <PricingPlans packages={packages} compact />
        </div>
      </section>
    </main>
  );
}
