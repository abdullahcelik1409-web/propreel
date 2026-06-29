import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MARKETING_NAV_LINKS } from "@/lib/siteContent";
import BrandLogo from "@/components/BrandLogo";

export default async function MarketingNav({ signUpHref = "/auth/register" }) {
  const session = await getServerSession(authOptions);

  return (
    <nav className="mx-0 flex max-w-[390px] items-center justify-between gap-3 px-4 py-5 sm:mx-auto sm:max-w-7xl sm:px-6">
      <Link href="/" className="flex min-w-0 shrink-0 items-center gap-3" aria-label="Viseo home">
        <BrandLogo />
      </Link>
      <div className="flex min-w-0 shrink-0 items-center gap-2">
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
            <Link href="/auth/login" className="pr-secondary whitespace-nowrap px-3 py-2 text-sm font-semibold sm:px-4">
              Login
            </Link>
            <Link href={signUpHref} className="whitespace-nowrap rounded-lg border border-[var(--pr-cyan)]/35 bg-[var(--pr-cyan-soft)] px-3 py-2 text-sm font-black text-[var(--pr-cyan)] transition hover:border-[var(--pr-cyan)] hover:bg-[rgba(0,251,251,0.16)] sm:px-4">
              Sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
