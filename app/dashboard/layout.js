import Link from "next/link";
import CreditBadge from "@/components/CreditBadge";
import BrandLogo from "@/components/BrandLogo";
import SignOutButton from "@/components/SignOutButton";
import { getSessionUser } from "@/lib/session";

const nav = [
  ["Dashboard", "/dashboard"],
  ["My Videos", "/dashboard/videos"],
  ["Credits", "/dashboard/credits"],
];

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }) {
  const user = await getSessionUser();

  return (
    <div className="pr-shell min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-[var(--pr-border-soft)] bg-[#071010]/95 p-5 lg:block">
        <Link href="/" className="mb-8 flex items-center gap-3" aria-label="Viseo home">
          <BrandLogo />
        </Link>
        <nav className="space-y-2">
          {nav.map(([label, href]) => (
            <Link key={href} href={href} className="block rounded-md px-3 py-2 text-sm font-semibold text-[var(--pr-muted)] hover:bg-[var(--pr-cyan-soft)] hover:text-[var(--pr-text)]">
              {label}
            </Link>
          ))}
          {user?.role === "admin" && (
            <Link href="/admin" className="block rounded-md px-3 py-2 text-sm font-semibold text-[var(--pr-cyan)] hover:bg-[var(--pr-cyan-soft)]">
              Admin
            </Link>
          )}
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[var(--pr-border-soft)] bg-[#0d1515]/90 px-6 backdrop-blur">
          <div>
            <p className="pr-kicker">Real estate video platform</p>
            <p className="font-semibold text-[var(--pr-text)]">{user?.name || user?.email || "Viseo"}</p>
          </div>
          <div className="flex items-center gap-3">
            <CreditBadge credits={user?.credits || 0} />
            <SignOutButton />
          </div>
        </header>
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
