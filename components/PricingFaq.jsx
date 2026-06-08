"use client";

import { useState } from "react";

const faqs = [
  [
    "What is a credit?",
    "Each credit is a unit used to generate one video segment. Basic videos use 120 credits, multi-image videos use 160 credits (10s) or 480 credits (30s).",
  ],
  ["Do credits expire?", "No. Credits are added to your PropReel account and never expire."],
  [
    "Can I get a refund on unused credits?",
    "Yes. Unused credits can be refunded within 14 days of purchase. See our Cancellation & Refund Policy for details.",
  ],
  [
    "Which payment methods are accepted?",
    "Payments are processed via iyzico. All major credit and debit cards are accepted, including Visa and Mastercard.",
  ],
  [
    "Is my payment information secure?",
    "Yes. PropReel uses iyzico, a BDDK-licensed payment provider with PCI-DSS Level 1 certification. We never store your card details.",
  ],
];

export default function PricingFaq() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="mt-10">
      <div className="mb-5">
        <p className="pr-kicker">FAQ</p>
        <h2 className="mt-2 text-2xl font-black">Common pricing questions</h2>
      </div>
      <div className="space-y-3">
        {faqs.map(([question, answer], index) => {
          const open = openIndex === index;
          return (
            <div key={question} className="rounded-lg border border-[var(--pr-border-soft)] bg-[var(--pr-surface)]">
              <button
                type="button"
                onClick={() => setOpenIndex(open ? -1 : index)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                aria-expanded={open}
              >
                <span className="font-bold text-white">{question}</span>
                <span className="text-xl font-black text-[var(--pr-cyan)]">{open ? "-" : "+"}</span>
              </button>
              {open && <p className="border-t border-[var(--pr-border-soft)] px-5 py-4 text-sm leading-7 text-[var(--pr-muted)]">{answer}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
