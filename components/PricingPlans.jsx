"use client";

import Link from "next/link";
import { useState } from "react";

function PlanIcon({ id }) {
  const className = "h-5 w-5";

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

export default function PricingPlans({ packages, action = "modal", compact = false }) {
  const [selectedPackage, setSelectedPackage] = useState(null);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        {packages.map((pack) => {
          const popular = pack.id === "growth_credits";

          return (
            <article
              key={pack.id}
              className={`relative flex flex-col rounded-lg border p-5 transition hover:-translate-y-1 ${
                popular
                  ? "border-[var(--pr-cyan)] bg-[var(--pr-cyan-soft)] shadow-[0_0_34px_rgba(0,251,251,0.10)]"
                  : "border-[var(--pr-border-soft)] bg-[var(--pr-surface)]"
              }`}
            >
              {popular && (
                <span className="absolute right-4 top-4 rounded-md border border-[var(--pr-cyan)]/30 bg-[#071010] px-3 py-1 text-xs font-black text-[var(--pr-cyan)]">
                  Most Popular
                </span>
              )}
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[var(--pr-border-soft)] bg-[#071010] text-[var(--pr-cyan)]">
                <PlanIcon id={pack.id} />
              </div>
              <p className="mt-4 text-sm font-black uppercase tracking-[0.14em] text-[var(--pr-muted)]">{pack.name}</p>
              <div className="mt-3 flex items-end gap-2">
                <p className="text-5xl font-black tabular-nums text-white">${pack.priceUsd}</p>
                <p className="pb-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--pr-dim)]">USD · one-time</p>
              </div>
              <p className="mt-2 text-lg font-bold text-[var(--pr-muted)]">{pack.credits.toLocaleString("en-US")} credits</p>
              <p className="mt-3 min-h-12 text-sm leading-6 text-[var(--pr-muted)]">{pack.description}</p>
              {!compact && (
                <ul className="mt-5 flex-1 space-y-3 text-sm text-[var(--pr-muted)]">
                  {pack.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-[var(--pr-cyan)]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              )}
              {action === "link" ? (
                <Link href="/pricing" className="pr-primary mt-6 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm">
                  <LockIcon /> Buy Now
                </Link>
              ) : (
                <button type="button" onClick={() => setSelectedPackage(pack)} className="pr-primary mt-6 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm">
                  <LockIcon /> Buy Now
                </button>
              )}
              <p className="mt-2 text-center text-xs font-bold text-[var(--pr-dim)]">Secure · iyzico</p>
            </article>
          );
        })}
      </div>

      {selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-[var(--pr-border-soft)] bg-[#071010] p-5 shadow-2xl">
            <p className="pr-kicker">Secure payment</p>
            <h2 className="mt-2 text-xl font-black">{selectedPackage.name}</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--pr-muted)]">
              You're being redirected to our secure iyzico payment page.
            </p>
            <p className="mt-3 rounded-md border border-[var(--pr-cyan)]/25 bg-[var(--pr-cyan-soft)] p-3 text-sm font-semibold text-[var(--pr-cyan)]">
              {selectedPackage.credits.toLocaleString("en-US")} credits · ${selectedPackage.priceUsd} USD
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedPackage(null)}
                className="rounded-md border border-[var(--pr-border-soft)] px-4 py-2 text-sm text-[var(--pr-muted)] transition hover:text-white"
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
