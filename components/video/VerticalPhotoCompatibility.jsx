"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { classifyImageDimensions, IMAGE_ORIENTATION } from "@/lib/imageOrientation";

const ORIENTATION_LABELS = Object.freeze({
  [IMAGE_ORIENTATION.PORTRAIT]: "Portrait · Native 9:16",
  [IMAGE_ORIENTATION.LANDSCAPE]: "Landscape · Blur canvas",
  [IMAGE_ORIENTATION.SQUARE]: "Square · Blur canvas",
});

export default function VerticalPhotoCompatibility({ imageUrls = [] }) {
  const [analysisByUrl, setAnalysisByUrl] = useState({});
  const uniqueImageUrls = useMemo(() => [...new Set(imageUrls.filter(Boolean))], [imageUrls]);
  const imageUrlsKey = uniqueImageUrls.join("\n");
  const analyses = uniqueImageUrls.map((url) => analysisByUrl[url]).filter(Boolean);
  const analyzing = uniqueImageUrls.length > analyses.length;
  const hasFailedAnalysis = analyses.some((analysis) => analysis.failed);
  const hasNonPortrait = analyses.some((analysis) => analysis.orientation && analysis.orientation !== IMAGE_ORIENTATION.PORTRAIT);
  const allPortrait = analyses.length === uniqueImageUrls.length && analyses.length > 0 && !hasNonPortrait && !hasFailedAnalysis;

  const recordDimensions = useCallback((url, image) => {
    try {
      const orientation = classifyImageDimensions(image.naturalWidth, image.naturalHeight);
      setAnalysisByUrl((current) => {
        const existing = current[url];
        if (existing?.orientation === orientation && existing.width === image.naturalWidth && existing.height === image.naturalHeight) {
          return current;
        }
        return {
          ...current,
          [url]: { orientation, width: image.naturalWidth, height: image.naturalHeight },
        };
      });
    } catch {
      setAnalysisByUrl((current) => ({ ...current, [url]: { orientation: null, failed: true } }));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const pendingImages = [];
    const urlsToAnalyze = imageUrlsKey ? imageUrlsKey.split("\n") : [];
    for (const url of urlsToAnalyze) {
      const image = new Image();
      image.onload = () => {
        if (!cancelled) recordDimensions(url, image);
      };
      image.onerror = () => {
        if (!cancelled) {
          setAnalysisByUrl((current) => ({ ...current, [url]: { orientation: null, failed: true } }));
        }
      };
      image.src = url;
      if (image.complete && image.naturalWidth > 0 && image.naturalHeight > 0) {
        recordDimensions(url, image);
      }
      pendingImages.push(image);
    }
    return () => {
      cancelled = true;
      pendingImages.forEach((image) => {
        image.onload = null;
        image.onerror = null;
      });
    };
  }, [imageUrlsKey, recordDimensions]);

  return (
    <div
      className={`mt-5 rounded-2xl border p-4 ${hasNonPortrait ? "border-amber-400/30 bg-amber-400/10" : "border-[var(--pr-cyan)]/25 bg-[var(--pr-cyan-soft)]"}`}
      role={hasNonPortrait ? "alert" : "status"}
      aria-live="polite"
    >
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
        <div>
          <p className={`text-sm font-black ${hasNonPortrait ? "text-amber-100" : "text-[var(--pr-cyan)]"}`}>
            Vertical photo compatibility
          </p>
          {!uniqueImageUrls.length && (
            <p className="mt-1 text-sm leading-6 text-[var(--pr-muted)]">Select photos to preview how they will appear in a 9:16 video.</p>
          )}
          {analyzing && uniqueImageUrls.length > 0 && (
            <p className="mt-1 text-sm leading-6 text-[var(--pr-muted)]">Analyzing the selected photo dimensions…</p>
          )}
          {allPortrait && (
            <p className="mt-1 text-sm leading-6 text-[var(--pr-muted)]">
              Portrait photos are sent directly to FAL as native 9:16 video. No blurred canvas is added.
            </p>
          )}
          {hasNonPortrait && (
            <p className="mt-1 text-sm leading-6 text-amber-50/80">
              Landscape or square photos remain fully visible in the center. Only those clips receive a blurred 9:16 background, as previewed below.
            </p>
          )}
          {hasFailedAnalysis && (
            <p className="mt-1 text-sm leading-6 text-[var(--pr-muted)]">
              One or more previews could not be analyzed in the browser. The server will verify their dimensions before generation.
            </p>
          )}
        </div>
        {!!uniqueImageUrls.length && (
          <span className={`w-fit rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${hasNonPortrait ? "border-amber-300/30 text-amber-100" : "border-[var(--pr-cyan)]/25 text-[var(--pr-cyan)]"}`}>
            {analyses.length}/{uniqueImageUrls.length} analyzed
          </span>
        )}
      </div>

      {!!uniqueImageUrls.length && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {uniqueImageUrls.map((url, index) => {
            const analysis = analysisByUrl[url];
            const portrait = analysis?.orientation === IMAGE_ORIENTATION.PORTRAIT;
            return (
              <figure key={url} className="min-w-0">
                <div className="relative mx-auto aspect-[9/16] w-full max-w-28 overflow-hidden rounded-xl border border-white/15 bg-[#020808] shadow-lg shadow-black/20">
                  {!portrait && <img src={url} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover blur-lg opacity-65" />}
                  <img
                    src={url}
                    alt={`Vertical output preview for photo ${index + 1}`}
                    onLoad={(event) => recordDimensions(url, event.currentTarget)}
                    className={`relative h-full w-full ${portrait ? "object-cover" : "object-contain"}`}
                  />
                </div>
                <figcaption className="mt-2 truncate text-center text-[10px] font-bold text-[var(--pr-muted)]">
                  {analysis?.failed ? "Server will verify" : ORIENTATION_LABELS[analysis?.orientation] || "Analyzing…"}
                </figcaption>
              </figure>
            );
          })}
        </div>
      )}
    </div>
  );
}
