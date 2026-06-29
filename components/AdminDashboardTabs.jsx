"use client";

import { useState } from "react";
import AdminCreditsForm from "@/components/AdminCreditsForm";
import AdminDemoLinkBuilder from "@/components/AdminDemoLinkBuilder";
import AdminFalCostsPanel from "@/components/AdminFalCostsPanel";
import { formatStableDate } from "@/lib/dateFormatting";

function formatJoinDate(value) {
  return formatStableDate(value);
}

function formatPaymentAmount(payment) {
  if (!payment.amount) return "-";
  return `${payment.amount} ${payment.currency || "USD"}`;
}

export default function AdminDashboardTabs({ users = [], totalVideos = 0, creditsInCirculation = 0, recentPayments = [], activePaymentProvider = "lemon" }) {
  const [activeTab, setActiveTab] = useState("management");

  return (
    <div className="space-y-6">
      <div className="inline-flex max-w-full overflow-x-auto rounded-2xl border border-[var(--pr-border-soft)] bg-[#071010] p-1" role="tablist" aria-label="Admin dashboard sections">
        <button
          type="button"
          onClick={() => setActiveTab("management")}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
            activeTab === "management" ? "bg-[var(--pr-cyan)] text-[#002020]" : "text-[var(--pr-muted)] hover:bg-[var(--pr-cyan-soft)] hover:text-white"
          }`}
          aria-pressed={activeTab === "management"}
          role="tab"
          aria-selected={activeTab === "management"}
        >
          Management
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("usage")}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
            activeTab === "usage" ? "bg-[var(--pr-cyan)] text-[#002020]" : "text-[var(--pr-muted)] hover:bg-[var(--pr-cyan-soft)] hover:text-white"
          }`}
          aria-pressed={activeTab === "usage"}
          role="tab"
          aria-selected={activeTab === "usage"}
        >
          Usage Costs
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("demo-links")}
          className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold transition ${
            activeTab === "demo-links" ? "bg-[var(--pr-cyan)] text-[#002020]" : "text-[var(--pr-muted)] hover:bg-[var(--pr-cyan-soft)] hover:text-white"
          }`}
          aria-pressed={activeTab === "demo-links"}
          role="tab"
          aria-selected={activeTab === "demo-links"}
        >
          Demo Links
        </button>
      </div>

      {activeTab === "management" ? (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-3">
            <div className="pr-card p-5">
              <p className="text-sm text-[var(--pr-muted)]">Total Users</p>
              <p className="mt-2 text-3xl font-black">{users.length}</p>
            </div>
            <div className="pr-card p-5">
              <p className="text-sm text-[var(--pr-muted)]">Total Videos Generated</p>
              <p className="mt-2 text-3xl font-black">{totalVideos}</p>
            </div>
            <div className="pr-card p-5">
              <p className="text-sm text-[var(--pr-muted)]">Credits in Circulation</p>
              <p className="mt-2 text-3xl font-black">{creditsInCirculation}</p>
            </div>
          </section>

          <div className="pr-table-wrap">
            <table className="pr-table">
              <thead>
                <tr>
                  <th className="p-3">Email</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Credits</th>
                  <th className="p-3">Videos Created</th>
                  <th className="p-3">Join Date</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-[var(--pr-border-soft)]">
                    <td className="p-3">{user.email}</td>
                    <td className="p-3 text-[var(--pr-muted)]">{user.name || "-"}</td>
                    <td className="p-3 font-semibold text-[var(--pr-cyan)]">{user.credits}</td>
                    <td className="p-3">{user.videoCount}</td>
                    <td className="p-3 text-[var(--pr-muted)]">{formatJoinDate(user.createdAt)}</td>
                    <td className="p-3">
                      <AdminCreditsForm email={user.email} />
                    </td>
                  </tr>
                ))}
                {!users.length && (
                  <tr>
                    <td className="p-6 text-center text-[var(--pr-muted)]" colSpan={6}>
                      No users yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="pr-table-wrap">
            <div className="border-b border-[var(--pr-border-soft)] bg-[#071010] p-4">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-[var(--pr-muted)]">Recent {activePaymentProvider} Payments</p>
            </div>
            <table className="pr-table">
              <thead>
                <tr>
                  <th className="p-3">Transaction</th>
                  <th className="p-3">Provider</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Package</th>
                  <th className="p-3">Credits</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map((payment) => (
                  <tr key={payment.id} className="border-t border-[var(--pr-border-soft)]">
                    <td className="max-w-48 truncate p-3 font-mono text-xs text-[var(--pr-muted)]">{payment.providerOrderId}</td>
                    <td className="p-3 text-[var(--pr-muted)]">{payment.provider || "-"}</td>
                    <td className="p-3">{payment.buyerEmail || payment.providerCustomerId || "-"}</td>
                    <td className="p-3 text-[var(--pr-muted)]">{payment.packageName || payment.packageId || "-"}</td>
                    <td className="p-3 font-semibold text-[var(--pr-cyan)]">{payment.credits}</td>
                    <td className="p-3">{formatPaymentAmount(payment)}</td>
                    <td className="p-3 text-[var(--pr-muted)]">{payment.status}</td>
                    <td className="p-3 text-[var(--pr-muted)]">{formatJoinDate(payment.createdAt)}</td>
                  </tr>
                ))}
                {!recentPayments.length && (
                  <tr>
                    <td className="p-6 text-center text-[var(--pr-muted)]" colSpan={8}>
                      No {activePaymentProvider} payments yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === "usage" ? (
        <AdminFalCostsPanel />
      ) : (
        <AdminDemoLinkBuilder />
      )}
    </div>
  );
}
