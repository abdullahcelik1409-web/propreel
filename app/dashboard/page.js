import Link from "next/link";
import ListingCard from "@/components/ListingCard";
import VideoCard from "@/components/VideoCard";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { MULTI_IMAGE_VIDEO_CREDIT_COSTS, VIDEO_GENERATION_CREDIT_COST } from "@/lib/videoConfig";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  const [listings, videos] = await Promise.all([
    prisma.listing.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 4 }),
    prisma.video.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 4, include: { listing: true } }),
  ]);

  return (
    <div className="space-y-8">
      <section className="pr-section overflow-hidden p-6">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="pr-kicker text-[var(--pr-cyan)]">Credit balance</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">{user.credits} credits available</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--pr-muted)]">
              Basic videos use {VIDEO_GENERATION_CREDIT_COST} credits. Multi Image videos use {MULTI_IMAGE_VIDEO_CREDIT_COSTS[10]} credits for 10s or {MULTI_IMAGE_VIDEO_CREDIT_COSTS[30]} credits for 30s.
            </p>
          </div>
          <Link href="/dashboard/listings/new" className="pr-primary px-4 py-2 text-center text-sm">
            Add property
          </Link>
        </div>
      </section>

      <section className="flex items-end justify-between gap-4">
        <div>
          <p className="pr-kicker">Portfolio</p>
          <h2 className="mt-1 text-xl font-bold">Recent listings</h2>
          <p className="mt-1 text-sm text-[var(--pr-muted)]">Select a property and move straight into video production.</p>
        </div>
      </section>
      {listings.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div>
      ) : (
        <div className="pr-section-flat p-10 text-center text-[var(--pr-muted)]">
          No listings yet. Add a property to start building your video library.
        </div>
      )}

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="pr-kicker">Production</p>
            <h2 className="mt-1 text-xl font-bold">Recent videos</h2>
          </div>
          <Link href="/dashboard/videos" className="pr-secondary px-3 py-2 text-sm font-semibold">
            View all
          </Link>
        </div>
        {videos.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{videos.map((video) => <VideoCard key={video.id} video={video} />)}</div>
        ) : (
          <div className="pr-section-flat p-10 text-center text-[var(--pr-muted)]">Generated videos will appear here.</div>
        )}
      </section>
    </div>
  );
}
