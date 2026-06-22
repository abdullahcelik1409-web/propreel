import VideoCard from "@/components/VideoCard";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function VideosPage({ searchParams }) {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const params = await searchParams;
  const filter = params?.status || "all";
  const where = { userId: user.id, ...(filter !== "all" ? { status: filter } : {}) };
  const videos = await prisma.video.findMany({ where, orderBy: { createdAt: "desc" }, include: { listing: true } });
  const filters = ["all", "pending", "processing", "completed", "failed", "refunded"];

  return (
    <div className="space-y-6">
      <div className="pr-section p-6">
        <p className="pr-kicker text-[var(--pr-cyan)]">Production library</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">My Videos</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--pr-muted)]">Track, download, and clean up generated property videos.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <a key={item} href={`/dashboard/videos?status=${item}`} className={`rounded-full border px-3 py-2 text-sm font-semibold capitalize ${filter === item ? "border-[var(--pr-cyan)] bg-[var(--pr-cyan-soft)] text-[var(--pr-cyan)]" : "border-[var(--pr-border-soft)] text-[var(--pr-muted)] hover:bg-[var(--pr-cyan-soft)] hover:text-[var(--pr-text)]"}`}>
            {item}
          </a>
        ))}
      </div>
      {videos.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{videos.map((video) => <VideoCard key={video.id} video={video} />)}</div>
      ) : (
        <div className="pr-section-flat p-10 text-center">
          <p className="text-lg font-bold text-white">No videos in this view</p>
          <p className="mt-2 text-sm text-[var(--pr-muted)]">Try another status filter or generate a new property video.</p>
        </div>
      )}
    </div>
  );
}
