"use client";

import { useState } from "react";

export default function PricingPlans({ packages }) {
  const [selectedPackage, setSelectedPackage] = useState(null);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        {packages.map((pack) => (
          <article key={pack.id} className="pr-section-flat flex flex-col p-5">
            <p className="pr-kicker">{pack.name}</p>
            <h2 className="mt-3 text-3xl font-black tabular-nums">{pack.credits.toLocaleString("en-US")} credits</h2>
            <p className="mt-2 text-2xl font-black text-[var(--pr-cyan)]">${pack.priceUsd} USD</p>
            <p className="mt-3 min-h-12 text-sm leading-6 text-[var(--pr-muted)]">{pack.description}</p>
            <ul className="mt-5 flex-1 space-y-3 text-sm text-[var(--pr-muted)]">
              {pack.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[var(--pr-cyan)]" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => setSelectedPackage(pack)} className="pr-primary mt-6 px-4 py-3 text-sm">
              Buy Now
            </button>
          </article>
        ))}
      </div>

      {selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-[var(--pr-border-soft)] bg-[#071010] p-5 shadow-2xl">
            <p className="pr-kicker">Secure payment</p>
            <h2 className="mt-2 text-xl font-black">{selectedPackage.name}</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--pr-muted)]">
              You'll be redirected to our secure iyzico payment page.
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
