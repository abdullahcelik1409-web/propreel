import Link from "next/link";
import CreditBadge from "@/components/CreditBadge";
import BrandLogo from "@/components/BrandLogo";
import SignOutButton from "@/components/SignOutButton";
import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";

const nav = [
  ["Dashboard", "/dashboard"],
  ["My Videos", "/dashboard/videos"],
  ["Credits", "/dashboard/credits"],
];

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }) {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  return (
    <div className="pr-shell min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-[var(--pr-border-soft)] bg-[#071010]/90 p-5 shadow-[18px_0_60px_rgba(0,0,0,0.22)] backdrop-blur-xl lg:block">
        <Link href="/" className="mb-8 flex items-center gap-3" aria-label="Viseo home">
          <BrandLogo />
        </Link>
        <nav className="space-y-2">
          {nav.map(([label, href]) => (
            <Link key={href} href={href} className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--pr-muted)] transition hover:bg-[var(--pr-cyan-soft)] hover:text-[var(--pr-text)]">
              {label}
            </Link>
          ))}
          {user?.role === "admin" && (
            <Link href="/admin" className="block rounded-xl border border-[var(--pr-cyan)]/20 bg-[var(--pr-cyan-soft)] px-3 py-2.5 text-sm font-semibold text-[var(--pr-cyan)] hover:bg-[rgba(0,251,251,0.15)]">
              Admin
            </Link>
          )}
        </nav>
        <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-[var(--pr-border-soft)] bg-[rgba(255,255,255,0.03)] p-4">
          <p className="pr-kicker">Workspace</p>
          <p className="mt-2 text-sm font-semibold text-white">Property video production</p>
          <p className="mt-1 text-xs leading-5 text-[var(--pr-muted)]">Listings, credits, and generated videos in one place.</p>
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-4 border-b border-[var(--pr-border-soft)] bg-[#0d1515]/86 px-4 py-3 backdrop-blur-xl sm:px-6">
          <div>
            <p className="pr-kicker">Real estate video platform</p>
            <p className="font-semibold text-[var(--pr-text)]">{user?.name || user?.email || "Viseo"}</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <CreditBadge credits={user?.credits || 0} />
            <SignOutButton />
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-7">{children}</main>
      </div>
    </div>
  );
}
