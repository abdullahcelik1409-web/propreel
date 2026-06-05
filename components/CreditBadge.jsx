import { VIDEO_GENERATION_CREDIT_COST } from "@/lib/videoConfig";

export default function CreditBadge({ credits = 0 }) {
  const tone =
    credits <= 0
      ? "border-red-400/35 bg-red-500/10 text-red-200"
      : credits < VIDEO_GENERATION_CREDIT_COST
        ? "border-[var(--pr-gold)]/35 bg-[var(--pr-gold-soft)] text-[var(--pr-gold)]"
        : "border-emerald-400/35 bg-emerald-500/10 text-emerald-200";

  return (
    <div className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-bold tabular-nums ${tone}`}>
      <span className="h-2 w-2 rounded-full bg-current" />
      <span>{credits} credits</span>
    </div>
  );
}
