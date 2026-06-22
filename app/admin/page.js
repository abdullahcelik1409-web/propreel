import AdminDashboardTabs from "@/components/AdminDashboardTabs";
import { getActivePaymentProvider } from "@/lib/payments/providerConfig";
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
  const activePaymentProvider = getActivePaymentProvider();

  const [users, totalVideos, creditAggregate, recentPayments] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { videos: true } } },
    }),
    prisma.video.count(),
    prisma.user.aggregate({ _sum: { credits: true } }),
    prisma.paymentOrder.findMany({
      where: { provider: activePaymentProvider },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        providerOrderId: true,
        provider: true,
        providerCustomerId: true,
        buyerEmail: true,
        packageName: true,
        packageId: true,
        credits: true,
        amount: true,
        currency: true,
        status: true,
        providerEventId: true,
        eventType: true,
        createdAt: true,
      },
    }),
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
        <div className="pr-section p-6">
          <p className="pr-kicker text-[var(--pr-cyan)]">Platform control</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Admin Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--pr-muted)]">Manage users, generated videos, payment events, and credit balances.</p>
        </div>

        <AdminDashboardTabs
          users={adminUsers}
          totalVideos={totalVideos}
          creditsInCirculation={creditAggregate._sum.credits || 0}
          recentPayments={recentPayments.map((payment) => ({
            ...payment,
            createdAt: payment.createdAt.toISOString(),
          }))}
          activePaymentProvider={activePaymentProvider}
        />
      </div>
    </main>
  );
}
