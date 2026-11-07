import Link from "next/link";
import { NAV, site } from "@/lib/site";
import { countries, regions } from "@/data/countries";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-white no-underline hover:no-underline" aria-label={`${site.name} home`}>
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="#10b981" />
        <path d="M6 21c3-7 7-10 10-10s7 3 10 10" stroke="#06121f" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M9 21v-4M16 21v-8M23 21v-4" stroke="#06121f" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      <span className="text-lg font-extrabold tracking-tight">
        Odds<span className="text-brand-400">Bridge</span>
      </span>
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-ink-900 text-white shadow-sm">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          <div className="group relative">
            <Link href="/betting-sites" className="rounded-lg px-3 py-2 text-sm font-medium text-white/85 no-underline hover:bg-white/10 hover:text-white hover:no-underline">
              Betting Sites ▾
            </Link>
            <div className="invisible absolute top-full left-0 z-50 w-[34rem] pt-2 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
              <div className="grid grid-cols-2 gap-4 rounded-2xl border border-line bg-white p-4 text-ink-900 shadow-xl">
                {regions.map((r) => (
                  <div key={r.key}>
                    <p className="eyebrow">{r.name}</p>
                    <ul className="mt-1.5 space-y-0.5">
                      {r.countries.map((code) => {
                        const c = countries.find((x) => x.code === code)!;
                        return (
                          <li key={code}>
                            <Link href={`/betting-sites/${c.slug}`} className="block rounded-md px-2 py-1 text-sm text-ink-800 no-underline hover:bg-surface hover:no-underline">
                              {c.flag} {c.name}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-sm font-medium text-white/85 no-underline hover:bg-white/10 hover:text-white hover:no-underline">
              {n.label}
            </Link>
          ))}
        </nav>
        <Link href="/search" className="ml-auto rounded-lg p-2 text-white/85 hover:bg-white/10 hover:text-white lg:ml-0" aria-label="Search">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </Link>
        <Link href="/booking-code-converter" className="btn-primary hidden py-2 sm:inline-flex lg:hidden xl:inline-flex">
          Convert a code
        </Link>
        <details className="relative lg:hidden">
          <summary className="flex cursor-pointer list-none items-center rounded-lg p-2 hover:bg-white/10" aria-label="Open menu">
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </summary>
          <div className="absolute right-0 mt-2 max-h-[80vh] w-72 overflow-y-auto rounded-2xl border border-line bg-white p-3 text-ink-900 shadow-xl">
            <ul className="space-y-0.5">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="block rounded-lg px-3 py-2 font-medium text-ink-900 no-underline hover:bg-surface hover:no-underline">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="eyebrow mt-3 px-3">Betting sites by country</p>
            <ul className="mt-1 grid grid-cols-2 gap-0.5">
              {countries.map((c) => (
                <li key={c.code}>
                  <Link href={`/betting-sites/${c.slug}`} className="block rounded-lg px-3 py-1.5 text-sm text-ink-800 no-underline hover:bg-surface hover:no-underline">
                    {c.flag} {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </details>
      </div>
    </header>
  );
}
