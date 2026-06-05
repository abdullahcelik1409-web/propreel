"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminCreditsForm({ email }) {
  const router = useRouter();
  const [amount, setAmount] = useState(5);
  const [loading, setLoading] = useState(false);

  const addCredits = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, amount }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Could not add credits");
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min="1"
        value={amount}
        onChange={(event) => setAmount(Number.parseInt(event.target.value || "1", 10))}
        className="w-20 rounded-md border border-[var(--pr-border-soft)] bg-[#071010] px-2 py-2 text-sm outline-none focus:border-[rgba(0,251,251,0.65)]"
      />
      <button onClick={addCredits} disabled={loading} className="pr-primary px-3 py-2 text-sm">
        Add Credits
      </button>
    </div>
  );
}
