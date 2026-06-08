import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MARKETING_NAV_LINKS } from "@/lib/siteContent";

export default async function MarketingNav() {
  const session = await getServerSession(authOptions);

  return (
    <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
      <Link href="/" className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--pr-cyan)] text-sm font-black text-[#002020]">PR</span>
        <span className="text-lg font-bold tracking-tight">PropReel</span>
      </Link>
      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-1 md:flex">
          {MARKETING_NAV_LINKS.map(([label, href]) => (
            <Link key={href} href={href} className="rounded-md px-3 py-2 text-sm font-semibold text-[var(--pr-muted)] transition hover:text-white">
              {label}
            </Link>
          ))}
        </div>
        {session?.user ? (
          <Link href="/dashboard" className="pr-primary px-4 py-2 text-sm font-semibold">
            Dashboard
          </Link>
        ) : (
          <Link href="/auth/login" className="pr-secondary px-4 py-2 text-sm font-semibold">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
