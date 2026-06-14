"use client";

import { useEffect, useMemo, useState } from "react";

const costCards = [
  { id: "allTime", label: "All-time API cost", helper: "Available Fal.ai usage history" },
  { id: "last30Days", label: "Last 30 days API cost", helper: "Rolling 30-day usage" },
  { id: "last7Days", label: "Last 7 days API cost", helper: "Rolling 7-day usage" },
  { id: "today", label: "Today's API cost", helper: "Europe/Istanbul day boundary" },
];

function formatCost(amount = 0, currency = "USD") {
  const numeric = Number(amount || 0);
  const safeCurrency = currency === "MIXED" ? "USD" : currency || "USD";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: safeCurrency,
    maximumFractionDigits: numeric < 1 ? 4 : 2,
  }).format(numeric);
}

function formatNumber(value = 0) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(Number(value || 0));
}

function formatTimestamp(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatBucketLabel(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value));
}

function shortEndpoint(value = "") {
  const parts = String(value).split("/");
  return parts.length > 2 ? parts.slice(-3).join("/") : value || "Unknown";
}

function shortRequestId(value = "") {
  if (!value) return "-";
  return value.length > 12 ? `${value.slice(0, 6)}...${value.slice(-4)}` : value;
}

function maxCost(items = []) {
  return Math.max(...items.map((item) => Number(item.cost || item.costEstimateUsd || 0)), 0);
}

export default function AdminFalCostsPanel() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadCosts({ refresh = false } = {}) {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/fal-costs", {
        cache: "no-store",
        headers: {
          "X-Requested-With": "viseo-admin",
        },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.error) {
        throw new Error(data.error || "Could not load Fal.ai API costs.");
      }

      setSummary(data);
    } catch (requestError) {
      setError(requestError.message || "Could not load Fal.ai API costs.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadCosts();
    const intervalId = window.setInterval(() => loadCosts({ refresh: true }), 5 * 60 * 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const last30Days = summary?.windows?.last30Days;
  const trend = last30Days?.timeSeries || [];
  const endpoints = last30Days?.endpointBreakdown || [];
  const authMethods = last30Days?.authMethodBreakdown || [];
  const units = last30Days?.unitBreakdown || [];
  const eventRows = summary?.recentBillingEvents || [];
  const generatedAt = useMemo(() => formatTimestamp(summary?.generatedAt), [summary?.generatedAt]);
  const trendMax = maxCost(trend);
  const endpointMax = maxCost(endpoints);

  return (
    <section className="space-y-5">
      <div className="pr-section-flat p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="pr-kicker">Fal.ai spend</p>
            <h2 className="mt-1 text-xl font-black tracking-tight">Usage Cost Overview</h2>
            <p className="mt-1 text-sm text-[var(--pr-muted)]">
              Live data from Fal.ai usage, account billing, and billing events APIs. Last updated: {loading ? "loading..." : generatedAt}
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadCosts({ refresh: true })}
            disabled={loading || refreshing}
            className="pr-secondary px-3 py-2 text-sm font-semibold"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-[rgba(255,143,133,0.35)] bg-[rgba(255,143,133,0.08)] p-3 text-sm text-[var(--pr-red)]">
            {error}
          </div>
        )}

        {!!summary?.optionalErrors?.length && (
          <div className="mt-4 rounded-md border border-[var(--pr-border-soft)] bg-[#071010] p-3 text-sm text-[var(--pr-muted)]">
            Some optional Fal.ai datasets could not be loaded: {summary.optionalErrors.map((item) => item.name).join(", ")}.
          </div>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {costCards.map((card) => {
            const windowData = summary?.windows?.[card.id];
            return (
              <div key={card.id} className="rounded-lg border border-[var(--pr-border-soft)] bg-[#071010] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--pr-dim)]">{card.label}</p>
                <p className="mt-3 min-h-9 text-3xl font-black tabular-nums text-white">
                  {loading ? "..." : windowData ? formatCost(windowData.cost, windowData.currency) : "-"}
                </p>
                <p className="mt-2 text-xs text-[var(--pr-muted)]">{windowData?.fallbackApplied ? "Started from today after Fal.ai range fallback" : card.helper}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="pr-section-flat p-4">
          <p className="pr-kicker">Account balance</p>
          <p className="mt-3 text-2xl font-black text-white">
            {summary?.accountBilling?.credits ? formatCost(summary.accountBilling.credits.currentBalance, summary.accountBilling.credits.currency) : loading ? "..." : "-"}
          </p>
          <p className="mt-2 text-xs text-[var(--pr-muted)]">From account billing API</p>
        </div>
        <div className="pr-section-flat p-4">
          <p className="pr-kicker">Tracked endpoints</p>
          <p className="mt-3 text-2xl font-black text-white">{loading ? "..." : endpoints.length}</p>
          <p className="mt-2 text-xs text-[var(--pr-muted)]">Models with usage in 30 days</p>
        </div>
        <div className="pr-section-flat p-4">
          <p className="pr-kicker">Output quantity</p>
          <p className="mt-3 text-2xl font-black text-white">{loading ? "..." : formatNumber(last30Days?.totalQuantity)}</p>
          <p className="mt-2 text-xs text-[var(--pr-muted)]">Billed units in 30 days</p>
        </div>
        <div className="pr-section-flat p-4">
          <p className="pr-kicker">Active days</p>
          <p className="mt-3 text-2xl font-black text-white">{loading ? "..." : last30Days?.activeBucketCount || 0}</p>
          <p className="mt-2 text-xs text-[var(--pr-muted)]">Days with non-zero spend</p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="pr-section-flat p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="pr-kicker">Daily trend</p>
              <h3 className="mt-1 text-lg font-black">Last 30 Days Cost</h3>
            </div>
            <p className="text-sm font-semibold text-white">{last30Days ? formatCost(last30Days.cost, last30Days.currency) : loading ? "..." : "-"}</p>
          </div>

          <div className="mt-5 flex h-48 items-end gap-1 border-b border-[var(--pr-border-soft)] pb-2">
            {trend.length ? (
              trend.map((bucket) => {
                const height = trendMax ? Math.max(4, (Number(bucket.cost || 0) / trendMax) * 100) : 0;
                return (
                  <div key={bucket.bucket} className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
                    <div className="w-full rounded-t-sm bg-[var(--pr-cyan)] transition group-hover:bg-white" style={{ height: `${height}%` }} title={`${formatBucketLabel(bucket.bucket)} - ${formatCost(bucket.cost)}`} />
                  </div>
                );
              })
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-[var(--pr-muted)]">{loading ? "Loading usage trend..." : "No usage returned for this period."}</div>
            )}
          </div>
          <div className="mt-3 flex justify-between text-xs text-[var(--pr-muted)]">
            <span>{trend[0] ? formatBucketLabel(trend[0].bucket) : "-"}</span>
            <span>{trend[trend.length - 1] ? formatBucketLabel(trend[trend.length - 1].bucket) : "-"}</span>
          </div>
        </div>

        <div className="pr-section-flat p-5">
          <p className="pr-kicker">Endpoint spend</p>
          <h3 className="mt-1 text-lg font-black">Top Models</h3>
          <div className="mt-4 space-y-4">
            {endpoints.length ? (
              endpoints.map((item) => (
                <div key={item.id}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-semibold text-white">{shortEndpoint(item.label)}</span>
                    <span className="tabular-nums text-[var(--pr-muted)]">{formatCost(item.cost)}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-[#071010]">
                    <div className="h-2 rounded-full bg-[var(--pr-cyan)]" style={{ width: `${endpointMax ? Math.max(3, (item.cost / endpointMax) * 100) : 0}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-[var(--pr-muted)]">{formatNumber(item.quantity)} billed units</p>
                </div>
              ))
            ) : (
              <p className="mt-4 text-sm text-[var(--pr-muted)]">{loading ? "Loading endpoint usage..." : "No endpoint spend returned."}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="pr-section-flat p-5">
          <p className="pr-kicker">Breakdowns</p>
          <h3 className="mt-1 text-lg font-black">Auth Methods and Units</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--pr-dim)]">Auth methods</p>
              {authMethods.length ? (
                authMethods.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 border-b border-[var(--pr-border-soft)] pb-2 text-sm">
                    <span className="truncate text-white">{item.label}</span>
                    <span className="tabular-nums text-[var(--pr-muted)]">{formatCost(item.cost)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--pr-muted)]">{loading ? "Loading..." : "No auth method data."}</p>
              )}
            </div>
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--pr-dim)]">Billed units</p>
              {units.length ? (
                units.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 border-b border-[var(--pr-border-soft)] pb-2 text-sm">
                    <span className="truncate text-white">{item.label}</span>
                    <span className="tabular-nums text-[var(--pr-muted)]">{formatNumber(item.quantity)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--pr-muted)]">{loading ? "Loading..." : "No unit data."}</p>
              )}
            </div>
          </div>
        </div>

        <div className="pr-section-flat overflow-hidden p-5">
          <p className="pr-kicker">Billing events</p>
          <h3 className="mt-1 text-lg font-black">Recent API Charges</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-[var(--pr-dim)]">
                <tr>
                  <th className="py-2 pr-3">Request</th>
                  <th className="py-2 pr-3">Endpoint</th>
                  <th className="py-2 pr-3">Units</th>
                  <th className="py-2 text-right">Cost</th>
                </tr>
              </thead>
              <tbody>
                {eventRows.length ? (
                  eventRows.map((event) => (
                    <tr key={`${event.requestId}-${event.timestamp}`} className="border-t border-[var(--pr-border-soft)]">
                      <td className="py-3 pr-3 font-mono text-xs text-[var(--pr-muted)]">{shortRequestId(event.requestId)}</td>
                      <td className="py-3 pr-3 text-white">{shortEndpoint(event.endpointId)}</td>
                      <td className="py-3 pr-3 text-[var(--pr-muted)]">{formatNumber(event.outputUnits)}</td>
                      <td className="py-3 text-right tabular-nums text-white">{formatCost(event.costEstimateUsd)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-6 text-center text-[var(--pr-muted)]" colSpan={4}>
                      {loading ? "Loading billing events..." : "No recent billing events returned."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
