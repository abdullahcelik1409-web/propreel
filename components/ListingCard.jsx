"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

function formatPriceLabel(price) {
  const value = String(price || "").trim();
  if (!value) return "Price on request";
  const numeric = value.replace(/[^\d]/g, "");
  if (!numeric) return value;
  return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export default function ListingCard({ listing }) {
  const router = useRouter();
  const [deleted, setDeleted] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const photo = listing.photos?.[0];

  const deleteListing = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      const response = await fetch(`/api/listings/${listing.id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });
      const result = await readJsonResponse(response);
      if (!response.ok || result.success === false || result.error) {
        throw new Error(result.error || "Could not delete this listing.");
      }
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
    <article className="group overflow-hidden rounded-2xl border border-[var(--pr-border-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(7,16,16,0.92))] transition hover:-translate-y-1 hover:border-[rgba(0,251,251,0.35)] hover:shadow-[0_18px_48px_rgba(0,0,0,0.25)]">
      <div className="aspect-[4/3] bg-[#071010]">
        {photo ? (
          <img src={photo} alt={listing.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-[var(--pr-dim)]">
            <span className="rounded-full border border-[var(--pr-border-soft)] px-3 py-1">No photo</span>
          </div>
        )}
      </div>
      <div className="space-y-3 p-4">
        <div>
          <h3 className="line-clamp-1 font-semibold text-[var(--pr-text)]">{listing.title}</h3>
          <p className="mt-1 text-sm text-[var(--pr-muted)]">{listing.location || "Location not set"}</p>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-bold tabular-nums text-[var(--pr-cyan)]">{formatPriceLabel(listing.price)}</span>
          <span className="text-[var(--pr-muted)]">
            {[listing.bedrooms && `${listing.bedrooms} bd`, listing.bathrooms && `${listing.bathrooms} ba`].filter(Boolean).join(" / ")}
          </span>
        </div>
        <Link
          href={`/dashboard/listings/${listing.id}/generate`}
          className="pr-primary block px-3 py-2 text-center text-sm"
        >
          Create property video
        </Link>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="pr-danger-secondary w-full px-3 py-2 text-sm font-semibold"
        >
          Delete
        </button>
      </div>
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[var(--pr-border-soft)] bg-[var(--pr-surface)] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-300">Delete listing</p>
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
              This listing and its property details will be permanently removed. Generated videos stay in your video library.
            </p>
            <div className="mt-4 rounded-xl border border-[var(--pr-border-soft)] bg-[#071010] p-3">
              <p className="line-clamp-1 text-sm font-semibold text-white">{listing.title}</p>
              <p className="mt-1 text-xs text-[var(--pr-muted)]">{listing.location || "Location not set"}</p>
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
                onClick={deleteListing}
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
