"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="rounded-md border border-[var(--pr-border-soft)] px-3 py-2 text-sm font-bold text-[var(--pr-muted)] transition hover:border-[var(--pr-cyan)]/45 hover:bg-[var(--pr-cyan-soft)] hover:text-[var(--pr-text)]"
    >
      Sign out
    </button>
  );
}
