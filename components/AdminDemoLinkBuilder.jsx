"use client";

import { useMemo, useState } from "react";
import { buildDemoUrl } from "@/lib/marketing/demoConfig";

const DEFAULT_FORM_VALUES = {
  source: "cold_email",
  medium: "outbound",
  campaign: "",
  content: "",
  term: "",
  rid: "",
};

const FIELDS = [
  {
    id: "source",
    label: "UTM Source",
    placeholder: "cold_email",
    help: "Where the visitor comes from, such as cold_email or linkedin.",
    required: true,
  },
  {
    id: "medium",
    label: "UTM Medium",
    placeholder: "outbound",
    help: "The channel type, such as outbound, social, or paid.",
    required: true,
  },
  {
    id: "campaign",
    label: "UTM Campaign",
    placeholder: "realtors_us_demo",
    help: "A stable campaign name used to group results.",
    required: true,
  },
  {
    id: "content",
    label: "UTM Content",
    placeholder: "standard_demo",
    help: "Optional message, creative, or link variation.",
  },
  {
    id: "term",
    label: "UTM Term",
    placeholder: "luxury_agents",
    help: "Optional audience or targeting label.",
  },
];

function createRecipientId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `lead_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
  }
  return `lead_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function AdminDemoLinkBuilder() {
  const [values, setValues] = useState(DEFAULT_FORM_VALUES);
  const [copyState, setCopyState] = useState("idle");

  const generatedUrl = useMemo(() => buildDemoUrl(values), [values]);
  const isReady = Boolean(values.source.trim() && values.medium.trim() && values.campaign.trim());

  const updateField = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }));
    setCopyState("idle");
  };

  const copyUrl = async () => {
    if (!isReady) return;
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  };

  const resetForm = () => {
    setValues(DEFAULT_FORM_VALUES);
    setCopyState("idle");
  };

  return (
    <section className="pr-section overflow-hidden" aria-labelledby="demo-link-builder-title">
      <div className="border-b border-[var(--pr-border-soft)] bg-[#071010] p-5 sm:p-6">
        <p className="pr-kicker">Outbound tools</p>
        <h2 id="demo-link-builder-title" className="mt-2 text-2xl font-black tracking-tight text-white">
          Demo Link Builder
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--pr-muted)]">
          Create a trackable public demo URL. Required campaign fields must be completed before the link can be copied or opened.
        </p>
      </div>

      <form className="space-y-6 p-5 sm:p-6" onSubmit={(event) => event.preventDefault()}>
        <div className="grid gap-5 md:grid-cols-2">
          {FIELDS.map((field) => (
            <div key={field.id} className="space-y-2">
              <label htmlFor={`demo-link-${field.id}`} className="block text-xs font-black uppercase tracking-[0.14em] text-[var(--pr-muted)]">
                {field.label}{field.required ? " *" : ""}
              </label>
              <input
                id={`demo-link-${field.id}`}
                type="text"
                required={field.required}
                value={values[field.id]}
                onChange={(event) => updateField(field.id, event.target.value)}
                placeholder={field.placeholder}
                autoComplete="off"
                spellCheck={false}
                aria-describedby={`demo-link-${field.id}-help`}
                className="pr-input w-full px-4 py-3 text-sm"
              />
              <p id={`demo-link-${field.id}-help`} className="text-xs leading-5 text-[var(--pr-dim)]">
                {field.help}
              </p>
            </div>
          ))}

          <div className="space-y-2">
            <label htmlFor="demo-link-rid" className="block text-xs font-black uppercase tracking-[0.14em] text-[var(--pr-muted)]">
              Recipient ID
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="demo-link-rid"
                type="text"
                value={values.rid}
                onChange={(event) => updateField("rid", event.target.value)}
                placeholder="lead_8d03f5c2a741"
                autoComplete="off"
                spellCheck={false}
                aria-describedby="demo-link-rid-help"
                className="pr-input min-w-0 flex-1 px-4 py-3 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => updateField("rid", createRecipientId())}
                className="pr-secondary shrink-0 px-4 py-3 text-sm font-bold"
              >
                Generate ID
              </button>
            </div>
            <p id="demo-link-rid-help" className="text-xs leading-5 text-[var(--pr-dim)]">
              Optional unique lead identifier. Use a different ID for each recipient when individual attribution is needed.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--pr-border-soft)] bg-[#050c0c] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--pr-muted)]">Live URL preview</p>
            <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${isReady ? "border-[var(--pr-cyan)]/30 bg-[var(--pr-cyan-soft)] text-[var(--pr-cyan)]" : "border-amber-400/25 bg-amber-400/10 text-amber-100"}`}>
              {isReady ? "Ready" : "Complete required fields"}
            </span>
          </div>
          <output className="mt-3 block break-all font-mono text-sm leading-6 text-white" aria-live="polite">
            {generatedUrl}
          </output>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={copyUrl}
            disabled={!isReady}
            className="pr-primary px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copyState === "copied" ? "URL copied" : "Copy URL"}
          </button>
          <button
            type="button"
            onClick={() => window.open(generatedUrl, "_blank", "noopener,noreferrer")}
            disabled={!isReady}
            className="pr-secondary px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
          >
            Open demo
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="rounded-xl px-5 py-3 text-sm font-bold text-[var(--pr-muted)] transition hover:bg-white/5 hover:text-white"
          >
            Reset
          </button>
        </div>

        <p className={`min-h-5 text-sm ${copyState === "error" ? "text-red-200" : "text-[var(--pr-cyan)]"}`} role="status" aria-live="polite">
          {copyState === "copied" ? "The demo URL is ready to paste." : copyState === "error" ? "The browser blocked clipboard access. Select and copy the URL preview manually." : ""}
        </p>
      </form>
    </section>
  );
}
