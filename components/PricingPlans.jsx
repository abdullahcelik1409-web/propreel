"use client";

import { useState } from "react";

function PlanIcon({ id }) {
  const className = "h-5 w-5";

  if (id === "pro_credits_25000" || id === "premium_credits_50000") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <path d="M12 3L14.4 8.2L20 9L15.8 13L16.9 18.6L12 15.8L7.1 18.6L8.2 13L4 9L9.6 8.2L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M4 21H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (id === "growth_credits") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <path d="M4 17L9 12L13 15L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 7H20V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (id === "agency_credits") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <path d="M4 20V6C4 5 5 4 6 4H14C15 4 16 5 16 6V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M16 10H19C20 10 21 11 21 12V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 8H12M8 12H12M8 16H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 20C12 13 8 9 4 8C4 15 7 19 12 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 20C12 12 15 7 20 5C20 12 17 18 12 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 20V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M8 11V8C8 5.8 9.8 4 12 4C14.2 4 16 5.8 16 8V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 11H18V20H6V11Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function formatUsd(amount) {
  return `$${Number(amount || 0).toLocaleString("en-US")}`;
}

export default function PricingPlans({ packages, compact = false }) {
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [checkoutError, setCheckoutError] = useState("");
  const [loadingPackageId, setLoadingPackageId] = useState("");

  async function startCheckout(pack) {
    setCheckoutError("");
    setLoadingPackageId(pack.id);

    try {
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ packageId: pack.id }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.status === 401 && data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Could not start payment checkout.");
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      throw new Error("Payment checkout response is missing checkout details.");
    } catch (error) {
      setSelectedPackage(pack);
      setCheckoutError(error?.message || "Could not start payment checkout.");
    } finally {
      setLoadingPackageId("");
    }
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {packages.map((pack) => {
          const premium = pack.id === "pro_credits_25000" || pack.id === "premium_credits_50000";
          const flagship = pack.id === "premium_credits_50000";
          const highlighted = pack.badge === "Most Popular";
          const badge = pack.badge || null;
          const loading = loadingPackageId === pack.id;

          return (
            <article
              key={pack.id}
              className={`relative flex min-h-[360px] flex-col overflow-hidden rounded-2xl border p-5 transition hover:-translate-y-1 ${
                flagship
                  ? "border-[var(--pr-gold)] bg-[linear-gradient(180deg,rgba(233,193,118,0.16),rgba(7,16,16,0.92))] shadow-[0_0_34px_rgba(255,209,102,0.14)]"
                  : premium
                    ? "border-[var(--pr-gold)]/45 bg-[linear-gradient(180deg,rgba(233,193,118,0.09),rgba(7,16,16,0.9))] shadow-[0_0_28px_rgba(255,209,102,0.08)]"
                    : highlighted
                      ? "border-[var(--pr-cyan)] bg-[linear-gradient(180deg,rgba(0,251,251,0.11),rgba(7,16,16,0.9))] shadow-[0_0_34px_rgba(0,251,251,0.10)]"
                      : "border-[var(--pr-border-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(7,16,16,0.9))]"
              }`}
            >
              <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              {badge && (
                <span
                  className={`absolute right-4 top-4 max-w-[calc(100%-2rem)] rounded-full border bg-[#071010] px-3 py-1 text-right text-[11px] font-black uppercase leading-4 ${
                    premium
                      ? "border-[var(--pr-gold)]/40 text-[var(--pr-gold)]"
                      : "border-[var(--pr-cyan)]/30 text-[var(--pr-cyan)]"
                  }`}
                >
                  {badge}
                </span>
              )}
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl border bg-[#071010] ${
                  premium
                    ? "border-[var(--pr-gold)]/40 text-[var(--pr-gold)]"
                    : "border-[var(--pr-border-soft)] text-[var(--pr-cyan)]"
                }`}
              >
                <PlanIcon id={pack.id} />
              </div>
              <p className="mt-4 text-sm font-black uppercase tracking-[0.14em] text-[var(--pr-muted)]">{pack.name}</p>
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <p className="text-4xl font-black tabular-nums text-white">{formatUsd(pack.priceUsd)}</p>
                <p className="pb-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--pr-dim)]">USD / one-time</p>
              </div>
              <p className="mt-2 text-lg font-bold text-[var(--pr-cyan)]">{pack.credits.toLocaleString("en-US")} credits</p>
              <p className="mt-3 min-h-12 text-sm leading-6 text-[var(--pr-muted)]">{pack.description}</p>
              {!compact && (
                <ul className="mt-5 flex-1 space-y-3 text-sm text-[var(--pr-muted)]">
                  {pack.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <span className={`mt-1 h-2 w-2 rounded-full ${premium ? "bg-[var(--pr-gold)]" : "bg-[var(--pr-cyan)]"}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={() => startCheckout(pack)}
                disabled={loading}
                className={`mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-70 ${
                  premium ? "border border-[var(--pr-gold)]/45 bg-[var(--pr-gold)] text-[#221700] hover:bg-[#ffe2a2]" : "pr-primary"
                }`}
              >
                <LockIcon /> {loading ? "Opening checkout..." : pack.checkoutLabel || "Buy Now"}
              </button>
              <p className="mt-2 text-center text-xs font-bold text-[var(--pr-dim)]">
                {pack.checkoutProviderLabel || "Secure payment checkout"}
              </p>
            </article>
          );
        })}
      </div>

      {selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[var(--pr-border-soft)] bg-[#071010] p-5 shadow-2xl">
            <p className="pr-kicker">Secure payment</p>
            <h2 className="mt-2 text-xl font-black">{selectedPackage.name}</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--pr-muted)]">
              Payment checkout could not be opened automatically. Confirm the active provider environment variables and package mapping for this package, then try again.
            </p>
            <p className="mt-3 rounded-md border border-[var(--pr-cyan)]/25 bg-[var(--pr-cyan-soft)] p-3 text-sm font-semibold text-[var(--pr-cyan)]">
              {selectedPackage.credits.toLocaleString("en-US")} credits / {formatUsd(selectedPackage.priceUsd)}
            </p>
            {checkoutError && <p className="mt-3 text-xs leading-5 text-amber-200">{checkoutError}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedPackage(null)}
                className="rounded-lg border border-[var(--pr-border-soft)] px-4 py-2 text-sm text-[var(--pr-muted)] transition hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
