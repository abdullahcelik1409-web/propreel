"use client";

import { useEffect, useMemo, useState } from "react";

const costCards = [
  { id: "allTime", label: "All-time API cost", helper: "From available Fal.ai usage history" },
  { id: "last30Days", label: "Last 30 days API cost", helper: "Rolling 30-day usage" },
  { id: "last7Days", label: "Last 7 days API cost", helper: "Rolling 7-day usage" },
  { id: "today", label: "Today's API cost", helper: "Europe/Istanbul day boundary" },
];

function formatCost(windowData) {
  const amount = Number(windowData?.cost || 0);
  const currency = windowData?.currency === "MIXED" ? "USD" : windowData?.currency || "USD";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: amount < 1 ? 4 : 2,
  }).format(amount);
}

function formatTimestamp(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
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

  const generatedAt = useMemo(() => formatTimestamp(summary?.generatedAt), [summary?.generatedAt]);

  return (
    <section className="pr-section-flat p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="pr-kicker">Fal.ai spend</p>
          <h2 className="mt-1 text-xl font-black tracking-tight">API Cost Overview</h2>
          <p className="mt-1 text-sm text-[var(--pr-muted)]">
            Live usage costs from Fal.ai. Last updated: {loading ? "loading..." : generatedAt}
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

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {costCards.map((card) => {
          const windowData = summary?.windows?.[card.id];
          return (
            <div key={card.id} className="rounded-lg border border-[var(--pr-border-soft)] bg-[#071010] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--pr-dim)]">{card.label}</p>
              <p className="mt-3 min-h-9 text-3xl font-black tabular-nums text-[var(--pr-gold)]">
                {loading ? "..." : windowData ? formatCost(windowData) : "-"}
              </p>
              <p className="mt-2 text-xs text-[var(--pr-muted)]">{windowData?.fallbackApplied ? "Started from today after Fal.ai range fallback" : card.helper}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
