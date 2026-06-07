"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const MIN_CREDITS = 1;
const MAX_CREDITS = 10000;

export default function AdminCreditsForm({ email }) {
  const router = useRouter();
  const [amount, setAmount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  const parsedAmount = Number.parseInt(amount, 10);
  const isValidAmount = Number.isInteger(parsedAmount) && parsedAmount >= MIN_CREDITS && parsedAmount <= MAX_CREDITS;

  const addCredits = async () => {
    if (!isValidAmount) {
      setError(`Enter a credit amount between ${MIN_CREDITS} and ${MAX_CREDITS}.`);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/credits", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "propreel-admin",
        },
        body: JSON.stringify({ email, amount: parsedAmount }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Could not add credits");
      }
      setConfirming(false);
      router.refresh();
    } catch (requestError) {
      setError(requestError.message || "Could not add credits");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={MIN_CREDITS}
            max={MAX_CREDITS}
            value={amount}
            onChange={(event) => {
              setError("");
              setAmount(event.target.value);
            }}
            className="w-24 rounded-md border border-[var(--pr-border-soft)] bg-[#071010] px-2 py-2 text-sm outline-none focus:border-[rgba(0,251,251,0.65)]"
          />
          <button
            onClick={() => {
              if (!isValidAmount) {
                setError(`Enter ${MIN_CREDITS}-${MAX_CREDITS} credits.`);
                return;
              }
              setConfirming(true);
            }}
            disabled={loading || !isValidAmount}
            className="pr-primary px-3 py-2 text-sm"
          >
            Add Credits
          </button>
        </div>
        {error && <p className="max-w-xs text-xs text-red-300">{error}</p>}
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-[var(--pr-border-soft)] bg-[#071010] p-5 shadow-2xl">
            <p className="pr-kicker">Admin action</p>
            <h2 className="mt-2 text-xl font-black">Confirm credit update</h2>
            <p className="mt-3 text-sm text-[var(--pr-muted)]">
              Add <span className="font-semibold text-white">{parsedAmount}</span> credits to{" "}
              <span className="font-semibold text-white">{email}</span>?
            </p>
            <p className="mt-2 text-xs text-[var(--pr-muted)]">
              This action is recorded in the credit event audit log.
            </p>
            {error && <p className="mt-3 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={loading}
                className="rounded-md border border-[var(--pr-border-soft)] px-4 py-2 text-sm text-[var(--pr-muted)] hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button type="button" onClick={addCredits} disabled={loading} className="pr-primary px-4 py-2 text-sm">
                {loading ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
