import CreditBadge from "@/components/CreditBadge";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { getCreditPackagesWithPaymentLinks } from "@/lib/paymentConfig";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CreditsPage() {
  const user = await getSessionUser();
  const events = await prisma.creditEvent.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 });
  const packages = getCreditPackagesWithPaymentLinks();

  return (
    <div className="space-y-6">
      <div className="pr-section p-6">
        <p className="pr-kicker">Current balance</p>
        <div className="mt-3"><CreditBadge credits={user.credits} /></div>
      </div>
      <div className="flex flex-col gap-3 rounded-lg border border-[var(--pr-cyan)]/25 bg-[var(--pr-cyan-soft)] p-4 text-sm font-semibold text-[var(--pr-cyan)] md:flex-row md:items-center md:justify-between">
        <span>Buy digital credits through secure iyzico payment links.</span>
        <Link href="/pricing" className="pr-primary px-4 py-2 text-center text-sm">
          View Pricing
        </Link>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {packages.map((pack) => (
          <div key={pack.id} className="pr-section-flat p-4">
            <p className="font-semibold">{pack.name}</p>
            <p className="mt-2 text-2xl font-black tabular-nums">{pack.credits} credits</p>
            <p className="mt-1 text-sm font-bold text-[var(--pr-cyan)]">${pack.priceUsd}</p>
            <p className="mt-3 text-sm leading-6 text-[var(--pr-muted)]">{pack.description}</p>
            {pack.paymentUrl ? (
              <a href={pack.paymentUrl} target="_blank" rel="noopener noreferrer" className="pr-primary mt-4 inline-flex w-full justify-center px-4 py-2 text-sm">
                Buy with iyzico
              </a>
            ) : (
              <Link href="/pricing" className="pr-secondary mt-4 inline-flex w-full justify-center px-4 py-2 text-sm font-semibold">
                View purchase details
              </Link>
            )}
          </div>
        ))}
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
