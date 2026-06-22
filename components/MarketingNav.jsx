import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MARKETING_NAV_LINKS } from "@/lib/siteContent";
import BrandLogo from "@/components/BrandLogo";

export default async function MarketingNav() {
  const session = await getServerSession(authOptions);

  return (
    <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
      <Link href="/" className="flex items-center gap-3" aria-label="Viseo home">
        <BrandLogo />
      </Link>
      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-1 rounded-full border border-[var(--pr-border-soft)] bg-[#071010]/60 p-1 md:flex">
          {MARKETING_NAV_LINKS.map(([label, href]) => (
            <Link key={href} href={href} className="rounded-full px-3 py-2 text-sm font-semibold text-[var(--pr-muted)] transition hover:bg-[var(--pr-cyan-soft)] hover:text-white">
              {label}
            </Link>
          ))}
        </div>
        {session?.user ? (
          <Link href="/dashboard" className="pr-primary px-4 py-2 text-sm font-semibold">
            Dashboard
          </Link>
        ) : (
          <>
            <Link href="/auth/login" className="pr-secondary px-4 py-2 text-sm font-semibold">
              Login
            </Link>
            <Link href="/auth/register" className="rounded-lg border border-[var(--pr-cyan)]/35 bg-[var(--pr-cyan-soft)] px-3 py-2 text-sm font-black text-[var(--pr-cyan)] transition hover:border-[var(--pr-cyan)] hover:bg-[rgba(0,251,251,0.16)] sm:px-4">
              Sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
