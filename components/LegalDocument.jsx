"use client";

import { useState } from "react";

export default function LegalDocument({ document }) {
  const [language, setLanguage] = useState("en");
  const active = document[language];

  return (
    <article className="pr-section mx-auto max-w-5xl p-6 md:p-8">
      <div className="flex flex-col gap-4 border-b border-[var(--pr-border-soft)] pb-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="pr-kicker">Legal</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">{active.title}</h1>
          <p className="mt-3 text-sm text-[var(--pr-muted)]">Last updated: {document.lastUpdated}</p>
        </div>
        <div className="flex rounded-md border border-[var(--pr-border-soft)] bg-[#071010] p-1">
          {[
            ["en", "EN"],
            ["tr", "TR"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setLanguage(id)}
              className={`rounded px-3 py-2 text-sm font-black transition ${
                language === id ? "bg-[var(--pr-cyan)] text-[#002020]" : "text-[var(--pr-muted)] hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {active.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-xl font-black">{section.heading}</h2>
            <div className="mt-3 space-y-3 text-sm leading-7 text-[var(--pr-muted)]">
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
