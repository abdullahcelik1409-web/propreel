"use client";

import { useEffect, useMemo, useState } from "react";
import { buildOverlayPlan } from "@/lib/text-templates/buildOverlayPlan.mjs";

function getPreviewAspectRatio(aspectRatio) {
  if (aspectRatio === "9:16") return "9 / 16";
  if (aspectRatio === "1:1") return "1 / 1";
  return "16 / 9";
}

function getPreviewWidth(aspectRatio) {
  if (aspectRatio === "9:16") return "42%";
  if (aspectRatio === "1:1") return "68%";
  return "100%";
}

function getPlacementStyle(overlay) {
  const { layout } = overlay;
  return {
    left: `${layout.xPercent}%`,
    top: `${layout.yPercent}%`,
    width: `${layout.maxWidth}%`,
    transform: `translate(${layout.anchorX === "center" ? "-50%" : "0"}, ${layout.anchorY === "bottom" ? "-100%" : layout.anchorY === "center" ? "-50%" : "0"})`,
    textAlign: overlay.align,
  };
}

export default function TextTemplatePreview({
  property,
  duration,
  videoTemplateId,
  textTemplateId,
  aspectRatio,
  sceneConfig,
  imageUrl,
  accent,
  compact = false,
}) {
  const plan = useMemo(() => {
    try {
      return buildOverlayPlan({ property, duration, videoTemplateId, textTemplateId, aspectRatio, sceneConfig });
    } catch {
      return null;
    }
  }, [property, duration, videoTemplateId, textTemplateId, aspectRatio, sceneConfig]);
  const [activeScene, setActiveScene] = useState(0);

  useEffect(() => {
    setActiveScene(0);
    if (!plan?.overlays.length) return undefined;
    const timer = window.setInterval(() => {
      setActiveScene((current) => (current + 1) % plan.overlays.length);
    }, compact ? 2300 : 2800);
    return () => window.clearInterval(timer);
  }, [plan, compact]);

  if (!plan) {
    return <div className="flex aspect-video items-center justify-center rounded-xl bg-[#050b0b] text-xs text-[var(--pr-dim)]">Preview unavailable</div>;
  }

  const overlay = plan.overlays[activeScene] || plan.overlays[0];
  return (
    <div>
      <div
        className="relative mx-auto w-full overflow-hidden rounded-xl border border-white/10 bg-[#050b0b] shadow-[inset_0_0_40px_rgba(0,0,0,.5)]"
        style={{ aspectRatio: getPreviewAspectRatio(aspectRatio), width: getPreviewWidth(aspectRatio) }}
        aria-label={`${plan.textTemplateName} animated preview in ${aspectRatio}`}
      >
        {imageUrl ? (
          <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(0,251,251,.18),transparent_35%),linear-gradient(145deg,#152323,#071010)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-black/25" />
        {overlay && (
          <div
            key={`${overlay.sceneIndex}-${activeScene}`}
            className="absolute z-10"
            style={getPlacementStyle(overlay)}
          >
            <div className={`text-overlay-preview-enter flex flex-col ${overlay.align === "center" ? "items-center" : "items-start"}`} style={{ "--overlay-accent": accent || "#00fbfb" }}>
              <div className="mb-1 h-px w-8 bg-[var(--overlay-accent)] opacity-90" />
              <p className={`${compact ? "text-[clamp(.55rem,2vw,.85rem)]" : "text-[clamp(.75rem,2.7vw,1.2rem)]"} font-black leading-tight tracking-[-0.02em] text-white [text-shadow:0_2px_14px_rgba(0,0,0,.9)]`}>
                {overlay.primaryText}
              </p>
              {overlay.secondaryText && (
                <p className={`${compact ? "mt-1 text-[clamp(.42rem,1.45vw,.63rem)]" : "mt-1.5 text-[clamp(.55rem,1.8vw,.78rem)]"} font-medium text-white/78 [text-shadow:0_1px_9px_rgba(0,0,0,.9)]`}>
                  {overlay.secondaryText}
                </p>
              )}
            </div>
          </div>
        )}
        <div className="absolute inset-x-[7%] bottom-[4%] flex gap-1" aria-hidden="true">
          {plan.sceneDurations.map((sceneDuration, index) => (
            <span key={`${sceneDuration}-${index}`} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/20">
              <span className={`block h-full rounded-full transition-all duration-500 ${index === overlay?.sceneIndex ? "w-full" : "w-0"}`} style={{ backgroundColor: accent || "#00fbfb" }} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
