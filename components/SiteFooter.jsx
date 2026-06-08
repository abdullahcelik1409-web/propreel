import Link from "next/link";
import { LEGAL_LINKS, PAYMENT_NOTICE, SELLER_INFO } from "@/lib/siteContent";

const productLinks = [
  ["Home", "/"],
  ["Pricing", "/pricing"],
  ["Contact", "/contact"],
  ["Dashboard", "/dashboard"],
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-[var(--pr-border-soft)] bg-[#071010] px-6 py-10 text-sm text-[var(--pr-muted)]">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.2fr_.8fr_1.4fr]">
        <div>
          <Link href="/" className="flex items-center gap-3 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--pr-cyan)] text-sm font-black text-[#002020]">PR</span>
            <span className="text-lg font-bold tracking-tight">PropReel</span>
          </Link>
          <p className="mt-3 max-w-sm leading-6">AI-powered property video production for real estate agents</p>
        </div>

        <nav aria-label="Footer navigation">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--pr-dim)]">Product</p>
          <div className="mt-4 flex flex-col gap-2">
            {productLinks.map(([label, href]) => (
              <Link key={href} href={href} className="transition hover:text-white">
                {label}
              </Link>
            ))}
          </div>
        </nav>

        <nav aria-label="Legal navigation">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--pr-dim)]">Legal</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {LEGAL_LINKS.map(([label, href]) => (
              <Link key={href} href={href} className="transition hover:text-white">
                {label}
              </Link>
            ))}
          </div>
        </nav>
      </div>

      <div className="mx-auto mt-8 flex max-w-7xl flex-col gap-3 border-t border-[var(--pr-border-soft)] pt-6 md:flex-row md:items-center md:justify-between">
        <p className="leading-6">© 2025 PropReel · {SELLER_INFO.footerLine}</p>
        <p className="rounded-md border border-[var(--pr-cyan)]/25 bg-[var(--pr-cyan-soft)] px-3 py-2 text-xs font-bold text-[var(--pr-cyan)]">
          {PAYMENT_NOTICE}
        </p>
      </div>
    </footer>
  );
}
