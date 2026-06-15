"use client";

import { useState } from "react";
import AdminCreditsForm from "@/components/AdminCreditsForm";
import AdminFalCostsPanel from "@/components/AdminFalCostsPanel";

function formatJoinDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

function formatPaymentAmount(payment) {
  if (!payment.amount) return "-";
  return `${payment.amount} ${payment.currency || "USD"}`;
}

export default function AdminDashboardTabs({ users = [], totalVideos = 0, creditsInCirculation = 0, recentPayments = [] }) {
  const [activeTab, setActiveTab] = useState("management");

  return (
    <div className="space-y-6">
      <div className="inline-flex rounded-lg border border-[var(--pr-border-soft)] bg-[#071010] p-1">
        <button
          type="button"
          onClick={() => setActiveTab("management")}
          className={`rounded-md px-4 py-2 text-sm font-bold transition ${
            activeTab === "management" ? "bg-[var(--pr-cyan)] text-[#002020]" : "text-[var(--pr-muted)] hover:bg-[var(--pr-cyan-soft)] hover:text-white"
          }`}
          aria-pressed={activeTab === "management"}
        >
          Management
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("usage")}
          className={`rounded-md px-4 py-2 text-sm font-bold transition ${
            activeTab === "usage" ? "bg-[var(--pr-cyan)] text-[#002020]" : "text-[var(--pr-muted)] hover:bg-[var(--pr-cyan-soft)] hover:text-white"
          }`}
          aria-pressed={activeTab === "usage"}
        >
          Usage Costs
        </button>
      </div>

      {activeTab === "management" ? (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-3">
            <div className="pr-section-flat p-5">
              <p className="text-sm text-[var(--pr-muted)]">Total Users</p>
              <p className="mt-2 text-3xl font-black">{users.length}</p>
            </div>
            <div className="pr-section-flat p-5">
              <p className="text-sm text-[var(--pr-muted)]">Total Videos Generated</p>
              <p className="mt-2 text-3xl font-black">{totalVideos}</p>
            </div>
            <div className="pr-section-flat p-5">
              <p className="text-sm text-[var(--pr-muted)]">Credits in Circulation</p>
              <p className="mt-2 text-3xl font-black">{creditsInCirculation}</p>
            </div>
          </section>

          <div className="overflow-hidden rounded-lg border border-[var(--pr-border-soft)]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#071010] text-[var(--pr-muted)]">
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

          <div className="overflow-hidden rounded-lg border border-[var(--pr-border-soft)]">
            <div className="border-b border-[var(--pr-border-soft)] bg-[#071010] p-4">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-[var(--pr-muted)]">Recent Lemon Squeezy Payments</p>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-[#071010] text-[var(--pr-muted)]">
                <tr>
                  <th className="p-3">Transaction</th>
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
                    <td className="p-6 text-center text-[var(--pr-muted)]" colSpan={7}>
                      No Lemon Squeezy payments yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <AdminFalCostsPanel />
      )}
    </div>
  );
}
