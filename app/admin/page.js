import AdminDashboardTabs from "@/components/AdminDashboardTabs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin().catch((error) => {
    if (error.status === 401) redirect("/auth/login");
    if (error.status === 403) redirect("/dashboard");
    throw error;
  });

  const [users, totalVideos, creditAggregate] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { videos: true } } },
    }),
    prisma.video.count(),
    prisma.user.aggregate({ _sum: { credits: true } }),
  ]);
  const adminUsers = users.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    credits: user.credits,
    createdAt: user.createdAt.toISOString(),
    videoCount: user._count.videos,
  }));

  return (
    <main className="pr-shell min-h-screen p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <p className="pr-kicker">Platform control</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--pr-muted)]">Manage users, generated videos, and credit balances.</p>
        </div>

        <AdminDashboardTabs users={adminUsers} totalVideos={totalVideos} creditsInCirculation={creditAggregate._sum.credits || 0} />
      </div>
    </main>
  );
}
