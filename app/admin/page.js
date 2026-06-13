import AdminCreditsForm from "@/components/AdminCreditsForm";
import AdminFalCostsPanel from "@/components/AdminFalCostsPanel";
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

  return (
    <main className="pr-shell min-h-screen p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <p className="pr-kicker">Platform control</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--pr-muted)]">Manage users, generated videos, and credit balances.</p>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="pr-section-flat p-5"><p className="text-sm text-[var(--pr-muted)]">Total Users</p><p className="mt-2 text-3xl font-black">{users.length}</p></div>
          <div className="pr-section-flat p-5"><p className="text-sm text-[var(--pr-muted)]">Total Videos Generated</p><p className="mt-2 text-3xl font-black">{totalVideos}</p></div>
          <div className="pr-section-flat p-5"><p className="text-sm text-[var(--pr-muted)]">Credits in Circulation</p><p className="mt-2 text-3xl font-black">{creditAggregate._sum.credits || 0}</p></div>
        </section>

        <AdminFalCostsPanel />

        <div className="overflow-hidden rounded-lg border border-[var(--pr-border-soft)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#071010] text-[var(--pr-muted)]">
              <tr><th className="p-3">Email</th><th className="p-3">Name</th><th className="p-3">Credits</th><th className="p-3">Videos Created</th><th className="p-3">Join Date</th><th className="p-3">Actions</th></tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-[var(--pr-border-soft)]">
                  <td className="p-3">{user.email}</td>
                  <td className="p-3 text-[var(--pr-muted)]">{user.name || "-"}</td>
                  <td className="p-3 font-semibold text-[var(--pr-cyan)]">{user.credits}</td>
                  <td className="p-3">{user._count.videos}</td>
                  <td className="p-3 text-[var(--pr-muted)]">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="p-3"><AdminCreditsForm email={user.email} /></td>
                </tr>
              ))}
              {!users.length && <tr><td className="p-6 text-center text-[var(--pr-muted)]" colSpan={6}>No users yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
