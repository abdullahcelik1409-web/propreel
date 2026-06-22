"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BASIC_VIDEO_SCENE_TEMPLATES,
  DEFAULT_PROMPT_TEMPLATE_ID,
  DEFAULT_SCENE_TEMPLATE_ID,
  getDefaultSceneTemplateId,
  getMultiImageCreditCost,
  getSceneTemplatesForMode,
  PREMIUM_GENERATE_ACTION,
  MULTI_IMAGE_DURATION_OPTIONS,
  MULTI_IMAGE_MAX_IMAGES,
  VIDEO_MODE_ULTRA_CINEMATIC,
  getPremiumDurationPlan,
  isPremiumVideoMode,
  normalizeSceneTemplateIdForMode,
  premiumUiCopy,
  premiumVideoConfig,
  VIDEO_MODE_BASIC,
  VIDEO_MODE_MULTI_IMAGE,
  VIDEO_STYLE_TEMPLATES,
  VIDEO_GENERATION_CREDIT_COST,
  VIDEO_GENERATION_DURATION_SECONDS,
} from "@/lib/videoConfig";
import { DEFAULT_AUDIO_BY_VIDEO_STYLE, NO_AUDIO_OPTION, NO_AUDIO_TRACK_ID } from "@/lib/audioConfig";

const formats = [
  {
    value: "16:9",
    title: "Horizontal 16:9",
    description: "Best for YouTube, websites, LinkedIn, and wide property showcases.",
  },
  {
    value: "1:1",
    title: "Square 1:1",
    description: "Best for Instagram feed posts and balanced social previews.",
  },
  {
    value: "9:16",
    title: "Vertical 9:16",
    description: "Best for TikTok, Instagram Reels, YouTube Shorts and mobile-first property videos.",
    badge: "Recommended for social media",
  },
];

function formatPriceLabel(price) {
  const value = String(price || "").trim();
  if (!value) return "Price on request";
  const numeric = value.replace(/[^\d]/g, "");
  if (!numeric) return value;
  return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export default function VideoGeneratorForm({ listing, userCredits, audioTracks = [] }) {
  const router = useRouter();
  const availableAudioTracks = audioTracks.length ? audioTracks : [NO_AUDIO_OPTION];
  const [videoMode, setVideoMode] = useState(VIDEO_MODE_BASIC);
  const [format, setFormat] = useState("16:9");
  const [multiImageDuration, setMultiImageDuration] = useState(10);
  const [selectedImageUrls, setSelectedImageUrls] = useState([]);
  const [templateId, setTemplateId] = useState(DEFAULT_PROMPT_TEMPLATE_ID);
  const [sceneTemplateId, setSceneTemplateId] = useState(DEFAULT_SCENE_TEMPLATE_ID);
  const [audioTrackId, setAudioTrackId] = useState(DEFAULT_AUDIO_BY_VIDEO_STYLE[DEFAULT_PROMPT_TEMPLATE_ID] || NO_AUDIO_TRACK_ID);
  const [audioTouched, setAudioTouched] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [overlays, setOverlays] = useState({ showPrice: true, showLocation: true, showBeds: true, showAgent: false, agentName: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const premiumSelected = isPremiumVideoMode(videoMode);
  const currentImageLimit = premiumSelected ? Math.max(...premiumVideoConfig.allowedPhotoCounts) : MULTI_IMAGE_MAX_IMAGES;
  const creditCost = premiumSelected
    ? premiumVideoConfig.creditCost
    : videoMode === VIDEO_MODE_MULTI_IMAGE
      ? getMultiImageCreditCost(multiImageDuration)
      : VIDEO_GENERATION_CREDIT_COST;
  const hasEnoughCredits = userCredits >= creditCost;
  const effectiveSelectedImages = selectedImageUrls.slice(0, currentImageLimit);
  const requiresPhotoSelection = videoMode === VIDEO_MODE_MULTI_IMAGE || premiumSelected;
  const premiumPhotoCountValid = premiumSelected && premiumVideoConfig.allowedPhotoCounts.includes(selectedImageUrls.length);
  const hasValidPhotoSelection = !requiresPhotoSelection ||
    (premiumSelected ? premiumPhotoCountValid : selectedImageUrls.length >= 1 && selectedImageUrls.length <= MULTI_IMAGE_MAX_IMAGES);
  const premiumDurationPlan = premiumSelected ? getPremiumDurationPlan(selectedImageUrls.length) : null;
  const availableSceneTemplates = useMemo(() => getSceneTemplatesForMode(videoMode), [videoMode]);
  const disabledSceneTemplates = useMemo(() => (videoMode === VIDEO_MODE_MULTI_IMAGE ? BASIC_VIDEO_SCENE_TEMPLATES.filter((template) => template.id === "single_photo_hero") : []), [videoMode]);
  const selectedStyle = VIDEO_STYLE_TEMPLATES.find((template) => template.id === templateId);
  const selectedScene = availableSceneTemplates.find((template) => template.id === sceneTemplateId);
  const selectedAudio = availableAudioTracks.find((track) => track.audio_id === audioTrackId);
  const canGenerate = !loading && hasEnoughCredits && !!listing.photos?.length && hasValidPhotoSelection;
  const generationDuration = premiumSelected
    ? `~${premiumVideoConfig.targetDurationSeconds}`
    : videoMode === VIDEO_MODE_MULTI_IMAGE
      ? multiImageDuration
      : VIDEO_GENERATION_DURATION_SECONDS;
  const generationEngine = premiumSelected
    ? "Kling 3 Pro premium image-to-video"
    : videoMode === VIDEO_MODE_MULTI_IMAGE
      ? "Multi-photo image-to-video"
      : "Single-photo image-to-video";
  const modeCards = [
    {
      value: VIDEO_MODE_BASIC,
      label: "Basic Video",
      description: "Single-photo image-to-video flow.",
      badge: "Everyday",
      creditLabel: `${VIDEO_GENERATION_CREDIT_COST} credits`,
      requirement: "Requires 1 photo",
      muted: true,
    },
    {
      value: VIDEO_MODE_MULTI_IMAGE,
      label: "Multi Image Video",
      description: "Use 1 to 4 listing photos for a richer property video.",
      badge: "Richer Flow",
      creditLabel: `${getMultiImageCreditCost(multiImageDuration)} credits`,
      requirement: `Requires 1 to ${MULTI_IMAGE_MAX_IMAGES} photos`,
      muted: true,
    },
    {
      value: VIDEO_MODE_ULTRA_CINEMATIC,
      label: premiumUiCopy.title,
      description: premiumUiCopy.subtitle,
      badge: premiumUiCopy.badge,
      creditLabel: premiumUiCopy.creditLabel,
      requirement: premiumUiCopy.requirements,
      muted: false,
    },
  ];

  useEffect(() => {
    const normalizedSceneTemplateId = normalizeSceneTemplateIdForMode(sceneTemplateId, videoMode);
    if (normalizedSceneTemplateId !== sceneTemplateId) {
      setSceneTemplateId(normalizedSceneTemplateId || getDefaultSceneTemplateId(videoMode));
    }
  }, [sceneTemplateId, videoMode]);

  const toggle = (key) => setOverlays((prev) => ({ ...prev, [key]: !prev[key] }));
  const chooseVideoMode = (nextVideoMode) => {
    setVideoMode(nextVideoMode);
    if (nextVideoMode === VIDEO_MODE_MULTI_IMAGE) {
      setSelectedImageUrls((prev) => prev.slice(0, MULTI_IMAGE_MAX_IMAGES));
    }
  };
  const chooseTemplate = (nextTemplateId) => {
    setTemplateId(nextTemplateId);
    if (!audioTouched) {
      setAudioTrackId(DEFAULT_AUDIO_BY_VIDEO_STYLE[nextTemplateId] || NO_AUDIO_TRACK_ID);
    }
  };
  const chooseAudioTrack = (nextAudioTrackId) => {
    setAudioTrackId(nextAudioTrackId);
    setAudioTouched(true);
  };
  const toggleImage = (photo) => {
    setSelectedImageUrls((prev) => {
      if (prev.includes(photo)) return prev.filter((item) => item !== photo);
      if (prev.length >= currentImageLimit) return prev;
      return [...prev, photo];
    });
  };

  const generate = async () => {
    setError("");
    if (premiumSelected && !premiumPhotoCountValid) {
      setError(premiumUiCopy.photoValidation);
      return;
    }
    if (!premiumSelected && requiresPhotoSelection && selectedImageUrls.length < 1) {
      setError(`Select at least 1 and up to ${MULTI_IMAGE_MAX_IMAGES} photos before generating a Multi Image video.`);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/videos/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          videoMode,
          format,
          duration: videoMode === VIDEO_MODE_MULTI_IMAGE ? multiImageDuration : premiumSelected ? premiumVideoConfig.targetDurationSeconds : VIDEO_GENERATION_DURATION_SECONDS,
          selectedImageUrls: requiresPhotoSelection ? selectedImageUrls.slice(0, currentImageLimit) : [],
          templateId,
          sceneTemplateId,
          audio_track_id: audioTrackId === NO_AUDIO_TRACK_ID ? null : audioTrackId,
          generationAction: PREMIUM_GENERATE_ACTION,
          prompt,
          overlays,
        }),
      });
      const rawResponse = await response.text();
      const result = rawResponse ? JSON.parse(rawResponse) : {};
      if (!response.ok || result.success === false) throw new Error(result.error || "Could not start generation");
      router.push("/dashboard/videos");
      router.refresh();
    } catch (err) {
      const message = err instanceof SyntaxError
        ? "The server returned an invalid response while starting generation. Please try again."
        : err?.message || "Could not start generation";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)_340px]">
      <aside className="pr-section h-fit p-4 xl:sticky xl:top-24">
        <p className="pr-kicker">Production steps</p>
        <div className="mt-4 space-y-3">
          {[
            ["01", "Media", "Choose the property visuals"],
            ["02", "Property", "Review listing facts"],
            ["03", "Style", "Set creative direction"],
            ["04", "Review", "Confirm cost and generate"],
          ].map(([number, title, body]) => (
            <div key={number} className="rounded-2xl border border-[var(--pr-border-soft)] bg-[#071010] p-3">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--pr-cyan)] text-xs font-black text-[#002020]">{number}</span>
                <span className="font-semibold">{title}</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-[var(--pr-muted)]">{body}</p>
            </div>
          ))}
        </div>
      </aside>

      <main className="space-y-5">
        <section className="pr-section overflow-hidden">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_.9fr]">
            <div className="aspect-video bg-[#071010] lg:aspect-auto">
              {listing.photos?.[0] ? (
                <img src={listing.photos[0]} alt={listing.title} className="h-full min-h-[300px] w-full object-cover" />
              ) : (
                <div className="flex h-full min-h-[300px] items-center justify-center text-[var(--pr-dim)]">No photos</div>
              )}
            </div>
            <div className="p-5">
              <p className="pr-kicker text-[var(--pr-cyan)]">Property source</p>
              <h1 className="mt-2 text-2xl font-black tracking-tight">{listing.title}</h1>
              <p className="mt-2 text-sm text-[var(--pr-muted)]">{listing.location || "Location not set"}</p>
              <p className="mt-4 text-2xl font-black tabular-nums text-[var(--pr-cyan)]">{formatPriceLabel(listing.price)}</p>
              <div className="mt-5 grid grid-cols-3 gap-2 text-center text-sm">
                <span className="rounded-xl border border-[var(--pr-border-soft)] bg-[#071010] py-2 text-[var(--pr-muted)]">{listing.bedrooms || "-"} beds</span>
                <span className="rounded-xl border border-[var(--pr-border-soft)] bg-[#071010] py-2 text-[var(--pr-muted)]">{listing.bathrooms || "-"} baths</span>
                <span className="rounded-xl border border-[var(--pr-border-soft)] bg-[#071010] py-2 text-[var(--pr-muted)]">{listing.sqft || "-"} sqft</span>
              </div>
              {listing.propertyType && <p className="mt-4 text-sm text-[var(--pr-gold)]">{listing.propertyType}</p>}
              {listing.description && <p className="mt-3 line-clamp-4 text-sm leading-6 text-[var(--pr-muted)]">{listing.description}</p>}
            </div>
          </div>
        </section>

        <section className="pr-section p-5">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <p className="pr-kicker">Media</p>
              <h2 className="mt-1 text-xl font-bold">Video setup</h2>
              <p className="mt-1 text-sm text-[var(--pr-muted)]">Mode, format, duration, and photo selection are locked before generation starts.</p>
            </div>
            <span className="rounded-full border border-[var(--pr-gold)]/30 bg-[var(--pr-gold-soft)] px-3 py-2 text-sm font-bold text-[var(--pr-gold)]">
              {creditCost} credits
            </span>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {modeCards.map(({ value, label, description, badge, creditLabel, requirement, muted }) => {
              const selected = videoMode === value;
              const premiumCard = value === VIDEO_MODE_ULTRA_CINEMATIC;
              return (
              <button
                key={value}
                type="button"
                onClick={() => chooseVideoMode(value)}
                className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${selected ? "border-[var(--pr-cyan)] bg-[var(--pr-cyan-soft)]" : premiumCard ? "border-[var(--pr-gold)]/45 bg-[var(--pr-gold-soft)] hover:border-[var(--pr-gold)]/70" : "border-[var(--pr-border-soft)] bg-[#071010] opacity-80 hover:border-[rgba(0,251,251,0.25)] hover:opacity-100"}`}
              >
                <span className="flex flex-wrap items-center gap-2 font-bold">
                  {label}
                  <span className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${premiumCard ? "border-[var(--pr-gold)]/35 bg-[var(--pr-gold-soft)] text-[var(--pr-gold)]" : "border-[var(--pr-border-soft)] bg-[#071010] text-[var(--pr-muted)]"}`}>{badge}</span>
                </span>
                <span className="mt-1 block text-sm leading-6 text-[var(--pr-muted)]">{description}</span>
                <span className={`mt-3 block text-xs leading-5 ${muted ? "text-[var(--pr-muted)]" : "font-semibold text-[var(--pr-gold)]"}`}>
                  {creditLabel} - {requirement}
                </span>
              </button>
            );
            })}
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-bold text-[var(--pr-muted)]">Aspect ratio</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {formats.map(({ value, title, description, badge }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormat(value)}
                    className={`rounded-2xl border p-4 text-left transition ${format === value ? "border-[var(--pr-cyan)] bg-[var(--pr-cyan-soft)]" : "border-[var(--pr-border-soft)] bg-[#071010] hover:border-[rgba(0,251,251,0.35)]"}`}
                  >
                    <span className="flex flex-wrap items-center gap-2 text-lg font-black">
                      {title}
                      {badge && <span className="rounded-full border border-[var(--pr-cyan)]/25 bg-[#071010] px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-[var(--pr-cyan)]">{badge}</span>}
                    </span>
                    <span className="mt-2 block text-sm leading-6 text-[var(--pr-muted)]">{description}</span>
                  </button>
                ))}
              </div>
            </div>

            {videoMode === VIDEO_MODE_MULTI_IMAGE && (
              <div>
                <p className="mb-3 text-sm font-bold text-[var(--pr-muted)]">Duration</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {MULTI_IMAGE_DURATION_OPTIONS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMultiImageDuration(value)}
                      className={`rounded-2xl border p-4 text-left transition ${multiImageDuration === value ? "border-[var(--pr-cyan)] bg-[var(--pr-cyan-soft)]" : "border-[var(--pr-border-soft)] bg-[#071010] hover:border-[rgba(0,251,251,0.35)]"}`}
                    >
                      <span className="block text-lg font-black">{value}s</span>
                      <span className="text-sm text-[var(--pr-muted)]">{getMultiImageCreditCost(value)} credits</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {requiresPhotoSelection && (
            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[var(--pr-muted)]">{premiumSelected ? "Ultra Cinematic photos" : "Multi Image photos"}</p>
                  <p className="mt-1 text-sm text-[var(--pr-muted)]">
                    {premiumSelected ? premiumUiCopy.photoValidation : `Select at least 1 and up to ${MULTI_IMAGE_MAX_IMAGES} listing photos.`}
                  </p>
                </div>
                <p className="rounded-full border border-[var(--pr-border-soft)] px-3 py-1.5 text-xs font-bold text-[var(--pr-muted)]">
                  {premiumSelected ? `${effectiveSelectedImages.length}/8 or 10 selected` : `${effectiveSelectedImages.length}/${MULTI_IMAGE_MAX_IMAGES} will be used`}
                </p>
              </div>
              {premiumSelected && (
                <div className={`mb-3 rounded-2xl border px-3 py-2 text-sm ${premiumPhotoCountValid ? "border-[var(--pr-cyan)]/25 bg-[var(--pr-cyan-soft)] text-[var(--pr-cyan)]" : "border-amber-500/25 bg-amber-500/10 text-amber-100"}`}>
                  <p>{premiumUiCopy.formatDescription}</p>
                  <p className="mt-1">{premiumUiCopy.creditRequirement}</p>
                  {premiumDurationPlan?.valid && <p className="mt-1">Scene durations: {premiumDurationPlan.durations.join("s, ")}s.</p>}
                </div>
              )}
              {!premiumSelected && selectedImageUrls.length < 1 && (
                <p className="mb-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                  Select at least 1 photo to continue with Multi Image Video.
                </p>
              )}
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                {(listing.photos || []).map((photo, index) => {
                  const selected = selectedImageUrls.includes(photo);
                  const disabled = !selected && selectedImageUrls.length >= currentImageLimit;
                  return (
                    <button
                      key={photo}
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleImage(photo)}
                      className={`group relative aspect-square overflow-hidden rounded-2xl border text-left transition ${selected ? "border-[var(--pr-cyan)]" : "border-[var(--pr-border-soft)]"} ${disabled ? "cursor-not-allowed opacity-45" : "hover:border-[rgba(0,251,251,0.35)]"}`}
                    >
                      <img src={photo} alt={`Listing photo ${index + 1}`} className="h-full w-full object-cover" />
                      <span className={`absolute left-2 top-2 rounded-full px-2 py-1 text-xs font-bold ${selected ? "bg-[var(--pr-cyan)] text-[#002020]" : "bg-black/75 text-white"}`}>
                        {selected ? "Selected" : `Photo ${index + 1}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <section className="pr-section p-5">
          <p className="pr-kicker">Style</p>
          <h2 className="mt-1 text-xl font-bold">Creative direction</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {VIDEO_STYLE_TEMPLATES.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => chooseTemplate(template.id)}
                className={`rounded-2xl border p-4 text-left transition ${templateId === template.id ? "border-[var(--pr-cyan)] bg-[var(--pr-cyan-soft)]" : "border-[var(--pr-border-soft)] bg-[#071010] hover:border-[rgba(0,251,251,0.35)]"}`}
              >
                <span className="block font-bold">{template.name}</span>
                <span className="mt-1 block text-sm leading-6 text-[var(--pr-muted)]">{template.description}</span>
              </button>
            ))}
          </div>

          {!premiumSelected && (
          <div className="mt-6">
            <p className="mb-3 text-sm font-bold text-[var(--pr-muted)]">Scene direction</p>
            <div className="grid gap-3 md:grid-cols-2">
              {availableSceneTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSceneTemplateId(template.id)}
                  className={`rounded-2xl border p-4 text-left transition ${sceneTemplateId === template.id ? "border-[var(--pr-cyan)] bg-[var(--pr-cyan-soft)]" : "border-[var(--pr-border-soft)] bg-[#071010] hover:border-[rgba(0,251,251,0.35)]"}`}
                >
                  <span className="block font-bold">{template.name}</span>
                  <span className="mt-1 block text-sm leading-6 text-[var(--pr-muted)]">{template.description}</span>
                </button>
              ))}
              {disabledSceneTemplates.map((template) => (
                <button
                  key={`disabled-${template.id}`}
                  type="button"
                  disabled
                  className="cursor-not-allowed rounded-2xl border border-[var(--pr-border-soft)] bg-[#071010] p-4 text-left opacity-45"
                >
                  <span className="block font-bold">{template.name}</span>
                  <span className="mt-1 block text-sm leading-6 text-[var(--pr-muted)]">
                    Disabled for Multi Image. This scene is designed only for single-photo generation.
                  </span>
                </button>
              ))}
            </div>
          </div>
          )}
          {premiumSelected && (
            <div className="mt-6 rounded-2xl border border-[var(--pr-gold)]/25 bg-[var(--pr-gold-soft)] p-4">
              <p className="text-sm font-bold text-[var(--pr-gold)]">Premium multi-scene continuity</p>
              <p className="mt-2 text-sm leading-6 text-[var(--pr-muted)]">
                Create a smoother, more cinematic property walkthrough with bridge-frame planning, premium scene directives, and architecture-safe prompts.
              </p>
            </div>
          )}
        </section>

        <section className="pr-section p-5">
          <p className="pr-kicker">Finishing</p>
          <h2 className="mt-1 text-xl font-bold">Overlays, music, and notes</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[["showPrice", "Show Price"], ["showLocation", "Show Location"], ["showBeds", "Show Beds/Baths"], ["showAgent", "Show Agent Name"]].map(([key, label]) => (
              <label key={key} className="flex items-center justify-between rounded-2xl border border-[var(--pr-border-soft)] bg-[#071010] p-3">
                <span className="font-semibold">{label}</span>
                <input type="checkbox" checked={overlays[key]} onChange={() => toggle(key)} className="h-4 w-4 accent-[var(--pr-cyan)]" />
              </label>
            ))}
          </div>
          {overlays.showAgent && (
            <input value={overlays.agentName} onChange={(event) => setOverlays((prev) => ({ ...prev, agentName: event.target.value }))} placeholder="Agent name" className="pr-input mt-3 px-3 py-3" />
          )}

          <div className="mt-6">
            <p className="mb-3 text-sm font-bold text-[var(--pr-muted)]">Background Music</p>
            {premiumSelected && (
              <p className="mb-3 rounded-md border border-[var(--pr-border-soft)] bg-[#071010] px-3 py-2 text-sm text-[var(--pr-muted)]">
                Kling native audio stays off. The selected background music will be added after the video is generated.
              </p>
            )}
            <div className="grid gap-3 md:grid-cols-2">
              {availableAudioTracks.map((track) => {
                const selected = audioTrackId === track.audio_id;
                return (
                  <button
                    key={track.audio_id}
                    type="button"
                    onClick={() => chooseAudioTrack(track.audio_id)}
                className={`rounded-2xl border p-4 text-left transition ${selected ? "border-[var(--pr-cyan)] bg-[var(--pr-cyan-soft)]" : "border-[var(--pr-border-soft)] bg-[#071010] hover:border-[rgba(0,251,251,0.35)]"}`}
                  >
                    <span className="block font-bold">{track.label}</span>
                    <span className="mt-1 block text-sm leading-6 text-[var(--pr-muted)]">{track.description}</span>
                    {track.content_id_registered && (
                      <span className="mt-3 block rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
                        This track is marked as Content ID Registered. Social platforms may show an automatic claim warning.
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-3 text-sm font-bold text-[var(--pr-muted)]">Additional prompt</p>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={4}
              placeholder="Optional English instructions for this property video"
              className="pr-input resize-none px-3 py-3 text-sm"
            />
          </div>
        </section>
      </main>

      <aside className="pr-section h-fit p-5 xl:sticky xl:top-24">
        <p className="pr-kicker">Review</p>
        <h2 className="mt-1 text-xl font-bold">Generation summary</h2>
        <div className="mt-5 space-y-3 text-sm">
          {[
            ["Engine", generationEngine],
            ["Selected model", premiumSelected ? premiumUiCopy.title : videoMode === VIDEO_MODE_MULTI_IMAGE ? "Multi Image" : "Basic"],
            ["Duration", premiumSelected ? `${generationDuration} seconds` : `${generationDuration}s`],
            ["Format", format],
            ["Style", selectedStyle?.name || templateId],
            ["Scene", premiumSelected ? "Premium scene planner" : selectedScene?.name || sceneTemplateId],
            ["Music", selectedAudio?.label || "No music"],
            ...(premiumSelected ? [["Kling native audio", "Off"]] : []),
            ...(premiumSelected ? [["Continuity mode", "Enabled"]] : []),
          ].map(([label, value]) => (
            <div key={label} className="flex items-start justify-between gap-4 border-b border-[var(--pr-border-soft)] pb-3">
              <span className="text-[var(--pr-muted)]">{label}</span>
              <span className="max-w-[190px] text-right font-semibold">{value}</span>
            </div>
          ))}
          {requiresPhotoSelection && (
            <div className="flex items-start justify-between gap-4 border-b border-[var(--pr-border-soft)] pb-3">
              <span className="text-[var(--pr-muted)]">Photos</span>
              <span className="font-semibold">{premiumSelected ? `${effectiveSelectedImages.length} selected` : `${effectiveSelectedImages.length}/${MULTI_IMAGE_MAX_IMAGES}`}</span>
            </div>
          )}
          <div className="rounded-2xl border border-[var(--pr-gold)]/30 bg-[var(--pr-gold-soft)] p-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--pr-gold)]">Cost</p>
            <p className="mt-1 text-2xl font-black tabular-nums text-[var(--pr-gold)]">{creditCost} credits</p>
            <p className="mt-1 text-xs text-[var(--pr-muted)]">Available: {userCredits} credits</p>
          </div>
        </div>

        {!listing.photos?.length && (
          <p className="mt-4 rounded-md border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">This listing needs at least 1 photo before video generation.</p>
        )}
        {!hasEnoughCredits && (
          <p className="mt-4 rounded-md border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            {premiumSelected ? premiumUiCopy.insufficientCredits : `You need ${creditCost} credits to generate this video.`}
          </p>
        )}
        {premiumSelected && !premiumPhotoCountValid && (
          <p className="mt-4 rounded-md border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            {premiumUiCopy.photoValidation}
          </p>
        )}
        {error && <p className="mt-4 rounded-md border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</p>}

        <button onClick={generate} disabled={!canGenerate} className="pr-primary mt-5 w-full px-4 py-3 text-sm">
          {loading ? "Starting generation..." : `Generate video - ${creditCost} credits`}
        </button>
      </aside>
    </div>
  );
}
