import CreditBadge from "@/components/CreditBadge";
import PricingPlans from "@/components/PricingPlans";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { getCreditPackagesWithPaymentConfig } from "@/lib/paymentConfig";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CreditsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const events = await prisma.creditEvent.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 });
  const packages = getCreditPackagesWithPaymentConfig().map((pack) => ({
    ...pack,
    features: ["Secure Paddle Checkout", "Webhook-confirmed digital credit delivery", "No subscription"],
  }));

  return (
    <div className="space-y-6">
      <div className="pr-section p-6">
        <p className="pr-kicker">Current balance</p>
        <div className="mt-3"><CreditBadge credits={user.credits} /></div>
      </div>
      <div className="flex flex-col gap-3 rounded-lg border border-[var(--pr-cyan)]/25 bg-[var(--pr-cyan-soft)] p-4 text-sm font-semibold text-[var(--pr-cyan)] md:flex-row md:items-center md:justify-between">
        <span>Buy digital credits through secure Paddle Checkout.</span>
        <Link href="/pricing" className="pr-primary px-4 py-2 text-center text-sm">
          View Pricing
        </Link>
      </div>
      <div>
        <PricingPlans packages={packages} compact />
      </div>
      <div className="overflow-hidden rounded-lg border border-[var(--pr-border-soft)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#071010] text-[var(--pr-muted)]">
            <tr><th className="p-3">Date</th><th className="p-3">Action</th><th className="p-3">Credits</th><th className="p-3">Note</th></tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-t border-[var(--pr-border-soft)]">
                <td className="p-3 text-[var(--pr-muted)]">{new Date(event.createdAt).toLocaleString()}</td>
                <td className="p-3">{event.action}</td>
                <td className={`p-3 font-semibold ${event.amount > 0 ? "text-emerald-300" : "text-amber-200"}`}>{event.amount}</td>
                <td className="p-3 text-[var(--pr-muted)]">{event.note || "-"}</td>
              </tr>
            ))}
            {!events.length && <tr><td className="p-6 text-center text-[var(--pr-muted)]" colSpan={4}>No usage history yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
