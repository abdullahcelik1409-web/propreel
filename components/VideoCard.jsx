"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import VideoStatusPoller from "./VideoStatusPoller";
import { getAudioMetadata, getPlayableVideoUrl } from "@/lib/audioConfig";
import { formatStableDate } from "@/lib/dateFormatting";
import { VIDEO_STYLE_TEMPLATES } from "@/lib/videoConfig";

function StatusBadge({ status }) {
  const tone = {
    completed: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    failed: "bg-red-500/10 text-red-300 border-red-500/30",
    refunded: "bg-red-500/10 text-red-200 border-red-500/30",
    processing: "bg-amber-500/10 text-amber-200 border-amber-500/30",
    pending: "bg-blue-500/10 text-blue-200 border-blue-500/30",
  }[status] || "bg-white/10 text-white/60 border-white/10";

  return <span className={`rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${tone}`}>{status}</span>;
}

function getPreviewAspectClass(format) {
  if (format === "9:16") return "mx-auto aspect-[9/16] max-h-[520px] w-full max-w-[320px]";
  if (format === "1:1") return "aspect-square";
  return "aspect-video";
}

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

export default function VideoCard({ video }) {
  const router = useRouter();
  const [current, setCurrent] = useState(video);
  const [deleted, setDeleted] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const listingTitle = current.listing?.title || "Property video";
  const playableVideoUrl = getPlayableVideoUrl(current);
  const audioMetadata = getAudioMetadata(current);
  const isDone = current.status === "completed" && playableVideoUrl;
  const shouldShowErrorMessage = !!current.errorMessage && (current.status === "failed" || current.status === "refunded" || !playableVideoUrl);
  const templateName = VIDEO_STYLE_TEMPLATES.find((template) => template.id === current.style)?.name || current.style;

  const deleteVideo = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      if (!current.id) throw new Error("Video id is missing.");
      const response = await fetch(`/api/videos/${current.id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });
      const result = await readJsonResponse(response);
      if (!response.ok || result.success === false) throw new Error(result.error || "Could not delete this video record.");
      setDeleted(true);
      setConfirmOpen(false);
      router.refresh();
    } catch (error) {
      setDeleteError(error.message);
    } finally {
      setDeleting(false);
    }
  };

  if (deleted) return null;

  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--pr-border-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(7,16,16,0.92))] transition hover:-translate-y-1 hover:border-[rgba(0,251,251,0.35)] hover:shadow-[0_18px_48px_rgba(0,0,0,0.25)]">
      <VideoStatusPoller
        jobId={current.falJobId}
        enabled={current.status === "pending" || current.status === "processing"}
        onComplete={setCurrent}
      />
      <div className={`${getPreviewAspectClass(current.format)} bg-[#071010]`}>
        {isDone ? (
          <video src={playableVideoUrl} className="h-full w-full object-cover" muted />
        ) : current.thumbnailUrl ? (
          <img src={current.thumbnailUrl} alt={listingTitle} className="h-full w-full object-cover opacity-80" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[var(--pr-dim)]">Video preview</div>
        )}
      </div>
      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="line-clamp-1 font-semibold text-[var(--pr-text)]">{listingTitle}</h3>
            <p className="mt-1 text-xs text-[var(--pr-dim)]">{formatStableDate(current.createdAt)}</p>
          </div>
          <StatusBadge status={current.status} />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--pr-muted)]">
          {current.videoMode && <span className="rounded-full border border-[var(--pr-border-soft)] px-2 py-1">{current.videoMode === "multi_image" ? "Multi Image" : "Basic"}</span>}
          <span className="rounded-full border border-[var(--pr-border-soft)] px-2 py-1">{current.format}</span>
          <span className="rounded-full border border-[var(--pr-border-soft)] px-2 py-1">{current.duration}s</span>
          {Number.isFinite(current.creditsCharged) && <span className="rounded-full border border-[var(--pr-border-soft)] px-2 py-1">{current.creditsCharged} credits</span>}
          {templateName && <span className="rounded-full border border-[var(--pr-border-soft)] px-2 py-1">{templateName}</span>}
          {audioMetadata.audio_status === "completed" && <span className="rounded-full border border-emerald-500/20 px-2 py-1 text-emerald-200">Music</span>}
          {audioMetadata.audio_status === "none" && <span className="rounded-full border border-[var(--pr-border-soft)] px-2 py-1">No Music</span>}
        </div>
        {shouldShowErrorMessage && <p className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-100">{current.errorMessage}</p>}
        {audioMetadata.audio_status === "failed" && (
          <p className="rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
            Video was created, but background music could not be added. The silent video is available.
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <a
            href={playableVideoUrl || "#"}
            download
            className={`rounded-lg px-3 py-2 text-center text-sm font-semibold ${
              isDone ? "bg-[var(--pr-cyan)] font-bold text-[#002020] hover:bg-[#79ffff]" : "cursor-not-allowed bg-white/5 text-white/30"
            }`}
          >
            Download
          </a>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="pr-danger-secondary px-3 py-2 text-sm font-semibold"
          >
            Delete
          </button>
        </div>
      </div>
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[var(--pr-border-soft)] bg-[var(--pr-surface)] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-300">Delete video record</p>
                <h2 className="mt-2 text-xl font-bold text-white">Are you sure?</h2>
              </div>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-lg border border-white/10 px-2 py-1 text-sm text-white/55 hover:bg-white/5 hover:text-white"
              >
                Close
              </button>
            </div>
            <p className="mt-4 text-sm leading-6 text-white/55">
              This video record will be permanently removed from your dashboard and database. This action cannot be undone.
            </p>
            <div className="mt-4 rounded-xl border border-[var(--pr-border-soft)] bg-[#071010] p-3">
              <p className="line-clamp-1 text-sm font-semibold text-white">{listingTitle}</p>
              <p className="mt-1 text-xs capitalize text-[var(--pr-muted)]">
                {current.status} / {current.videoMode === "multi_image" ? "Multi Image" : "Basic"} / {current.duration}s
              </p>
            </div>
            {deleteError && <p className="mt-4 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-100">{deleteError}</p>}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={deleting}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-white/70 hover:bg-white/5 disabled:opacity-50"
              >
                Keep it
              </button>
              <button
                type="button"
                onClick={deleteVideo}
                disabled={deleting}
                className="rounded-lg bg-red-400 px-4 py-2 text-sm font-bold text-[#1b0505] hover:bg-red-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
