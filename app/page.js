import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";

const features = [
  ["Upload Photos", "Add up to 15 property photos and keep them ready for video generation."],
  ["Add Listing Details", "Price, location, beds, baths, features, and agent overlays in one flow."],
  ["Generate Video", "Use Fal.ai image-to-video models to create property marketing videos."],
  ["Download & Share", "Export completed videos for YouTube, LinkedIn, Instagram, and listing pages."],
];

export default function LandingPage() {
  return (
    <main className="pr-shell min-h-screen">
      <MarketingNav />

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[1.05fr_.95fr] lg:py-20">
        <div className="flex flex-col justify-center">
          <div className="mb-5 inline-flex w-fit rounded-md border border-[var(--pr-cyan)]/25 bg-[var(--pr-cyan-soft)] px-3 py-1 text-xs font-bold text-[var(--pr-cyan)]">
            Starter credits for every new account
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
            <Link href="/auth/login" className="pr-secondary px-5 py-3 text-center font-semibold">
              View Dashboard
            </Link>
          </div>
        </div>

        <div className="pr-section p-5 shadow-2xl">
          <div className="rounded-md border border-[var(--pr-border-soft)] bg-[#071010] p-4">
            <div className="aspect-video rounded-md bg-[linear-gradient(160deg,#20322f,#0d1515,#24342f)] p-4">
              <div className="flex h-full flex-col justify-between rounded-md border border-[var(--pr-border-soft)] bg-black/20 p-4">
                <div>
                  <div className="h-40 rounded-md bg-[linear-gradient(135deg,rgba(0,251,251,0.16),rgba(233,193,118,0.12))]" />
                  <h2 className="mt-5 text-2xl font-bold">Ocean View Villa</h2>
                  <p className="mt-2 text-sm text-[var(--pr-muted)]">Luxury property showcase, 30s marketing video</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs text-[var(--pr-muted)]">
                  <span className="rounded-md border border-[var(--pr-border-soft)] bg-[#071010] py-2">16:9</span>
                  <span className="rounded-md border border-[var(--pr-border-soft)] bg-[#071010] py-2">Luxury</span>
                  <span className="rounded-md border border-emerald-400/30 bg-emerald-500/10 py-2 text-emerald-200">Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid gap-4 md:grid-cols-4">
          {features.map(([title, body]) => (
            <div key={title} className="pr-section-flat p-5">
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--pr-muted)]">{body}</p>
            </div>
          ))}
        </div>
        <div className="pr-section mt-6 p-6 text-center">
          <p className="text-sm font-bold text-[var(--pr-cyan)]">Credit packages</p>
          <h2 className="mt-2 text-2xl font-bold">Start free, scale when your listings do.</h2>
          <p className="mt-2 text-[var(--pr-muted)]">View transparent USD pricing before buying digital video credits.</p>
          <Link href="/pricing" className="pr-primary mt-5 inline-flex px-5 py-3 text-center">
            View Pricing
          </Link>
        </div>
      </section>
    </main>
  );
}
