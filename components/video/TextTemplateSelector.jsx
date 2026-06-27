"use client";

import TextTemplatePreview from "./TextTemplatePreview";
import { getAvailableTextTemplates } from "@/lib/text-templates/registry.mjs";

export default function TextTemplateSelector({
  property,
  duration,
  videoTemplateId,
  aspectRatio,
  sceneConfig,
  value,
  onChange,
  imageUrl,
}) {
  const templates = getAvailableTextTemplates(duration, videoTemplateId);

  return (
    <section className="pr-section p-5" aria-labelledby="text-style-heading">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="pr-kicker">Text Style</p>
          <h2 id="text-style-heading" className="mt-1 text-xl font-bold">Choose your overlay direction</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--pr-muted)]">
            Preview the same scene-aware text plan used by the final render. Copy stays concise and adapts to {aspectRatio} safe areas.
          </p>
        </div>
        <span className="pr-pill w-fit">{templates.length} compatible styles</span>
      </div>

      <div className="mt-5 grid snap-x snap-mandatory grid-flow-col auto-cols-[minmax(270px,88%)] gap-3 overflow-x-auto pb-2 sm:auto-cols-[minmax(300px,60%)] lg:grid-flow-row lg:grid-cols-3 lg:overflow-visible" role="radiogroup" aria-label="Text overlay style">
        {templates.map((template) => {
          const selected = value === template.id;
          return (
            <button
              key={template.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(template.id)}
              className={`group snap-start rounded-2xl border p-3 text-left outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-[var(--pr-cyan)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#071010] ${selected ? "border-[var(--pr-cyan)] bg-[var(--pr-cyan-soft)] shadow-[0_18px_50px_rgba(0,251,251,.08)]" : "border-[var(--pr-border-soft)] bg-[#071010] hover:-translate-y-0.5 hover:border-[rgba(0,251,251,.35)]"}`}
            >
              <TextTemplatePreview
                property={property}
                duration={duration}
                videoTemplateId={videoTemplateId}
                textTemplateId={template.id}
                aspectRatio={aspectRatio}
                sceneConfig={sceneConfig}
                imageUrl={imageUrl}
                accent={template.preview.accent}
                compact
              />
              <span className="mt-3 flex items-start justify-between gap-3">
                <span>
                  <span className="block font-bold text-white">{template.name}</span>
                  <span className="mt-1 block text-xs leading-5 text-[var(--pr-muted)]">{template.description}</span>
                </span>
                <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${selected ? "border-[var(--pr-cyan)] bg-[var(--pr-cyan)] text-[#002020]" : "border-white/25 text-transparent"}`} aria-hidden="true">✓</span>
              </span>
              <span className="mt-3 flex flex-wrap gap-1.5">
                {template.supportedAspectRatios.map((ratio) => <span key={ratio} className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[10px] font-bold text-white/65">{ratio}</span>)}
                <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[10px] font-bold text-white/65">{template.supportedSceneCounts[0]} scenes</span>
              </span>
              <span className="mt-3 block text-[11px] font-semibold" style={{ color: template.preview.accent }}>{template.preview.summary}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
