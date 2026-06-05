import VideoCard from "@/components/VideoCard";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function VideosPage({ searchParams }) {
  const user = await getSessionUser();
  const params = await searchParams;
  const filter = params?.status || "all";
  const where = { userId: user.id, ...(filter !== "all" ? { status: filter } : {}) };
  const videos = await prisma.video.findMany({ where, orderBy: { createdAt: "desc" }, include: { listing: true } });
  const filters = ["all", "pending", "processing", "completed", "failed", "refunded"];

  return (
    <div className="space-y-6">
      <div>
        <p className="pr-kicker">Production library</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight">My Videos</h1>
        <p className="mt-1 text-sm text-[var(--pr-muted)]">Track, download, and clean up generated property videos.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <a key={item} href={`/dashboard/videos?status=${item}`} className={`rounded-md border px-3 py-2 text-sm font-semibold capitalize ${filter === item ? "border-[var(--pr-cyan)] bg-[var(--pr-cyan-soft)] text-[var(--pr-cyan)]" : "border-[var(--pr-border-soft)] text-[var(--pr-muted)] hover:bg-[var(--pr-cyan-soft)] hover:text-[var(--pr-text)]"}`}>
            {item}
          </a>
        ))}
      </div>
      {videos.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{videos.map((video) => <VideoCard key={video.id} video={video} />)}</div>
      ) : (
        <div className="pr-section-flat p-10 text-center text-[var(--pr-muted)]">No videos in this view.</div>
      )}
    </div>
  );
}
