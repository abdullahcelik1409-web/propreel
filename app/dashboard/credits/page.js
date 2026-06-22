import CreditBadge from "@/components/CreditBadge";
import PricingPlans from "@/components/PricingPlans";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { getCreditPackagesWithPaymentConfig } from "@/lib/paymentConfig";
import { getActivePaymentProviderConfig } from "@/lib/payments/providerConfig";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CreditsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const providerConfig = getActivePaymentProviderConfig();
  const events = await prisma.creditEvent.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 });
  const packages = getCreditPackagesWithPaymentConfig().map((pack) => ({
    ...pack,
    checkoutLabel: providerConfig.checkoutLabel,
    checkoutProviderLabel: providerConfig.checkoutProviderLabel,
    features: [`Secure ${providerConfig.displayName} checkout`, "Webhook-confirmed digital credit delivery", "No subscription"],
  }));

  return (
    <div className="space-y-6">
      <div className="pr-section p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="pr-kicker text-[var(--pr-cyan)]">Current balance</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">Credit wallet</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--pr-muted)]">
              Buy USD credit packages and track every debit, refund, and manual credit event.
            </p>
          </div>
          <CreditBadge credits={user.credits} />
        </div>
      </div>
      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--pr-cyan)]/25 bg-[var(--pr-cyan-soft)] p-4 text-sm font-semibold text-[var(--pr-cyan)] md:flex-row md:items-center md:justify-between">
        <span>Buy digital credits through secure {providerConfig.displayName} checkout.</span>
        <Link href="/pricing" className="pr-primary px-4 py-2 text-center text-sm">
          View Pricing
        </Link>
      </div>
      <div>
        <PricingPlans packages={packages} compact />
      </div>
      <div className="pr-table-wrap">
        <table className="pr-table">
          <thead>
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
