import Link from "next/link";
import { site, YEAR } from "@/lib/site";
import { countries } from "@/data/countries";
import { leagues } from "@/data/leagues";

const COLS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Compare",
    links: [
      { href: "/odds", label: "Odds comparison" },
      { href: "/bookmakers", label: "All bookmakers" },
      { href: "/bonuses", label: "Betting bonuses" },
      { href: "/compare", label: "Head-to-head comparisons" },
      { href: "/booking-code-converter", label: "Booking code converter" },
      { href: "/booking-codes", label: "Booking codes by bookmaker" },
      { href: "/odds/today", label: "Odds today" },
    ],
  },
  {
    title: "Tools & guides",
    links: [
      { href: "/tools/odds-converter", label: "Odds converter" },
      { href: "/tools/bet-calculator", label: "Bet calculator" },
      { href: "/tools/margin-calculator", label: "Margin calculator" },
      { href: "/guides", label: "Betting guides" },
      { href: "/guides/what-is-a-booking-code", label: "What is a booking code?" },
    ],
  },
  {
    title: "About",
    links: [
      { href: "/about", label: "About us" },
      { href: "/methodology", label: "How we rate bookmakers" },
      { href: "/responsible-gambling", label: "Responsible gambling" },
      { href: "/affiliate-disclosure", label: "Affiliate disclosure" },
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of use" },
      { href: "/contact", label: "Contact" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-ink-950 text-white/75">
      <div className="container-page py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <p className="text-lg font-extrabold text-white">
              Odds<span className="text-brand-400">Bridge</span>
            </p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed">{site.description}</p>
            <p className="mt-4 text-xs font-semibold tracking-wide text-white uppercase">Betting sites by country</p>
            <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm">
              {countries.map((c) => (
                <li key={c.code}>
                  <Link href={`/betting-sites/${c.slug}`} className="text-white/75 hover:text-white">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {COLS.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold tracking-wide text-white uppercase">{col.title}</p>
              <ul className="mt-3 space-y-2 text-sm">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-white/75 hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 border-t border-white/10 pt-6">
          <p className="text-xs font-semibold tracking-wide text-white uppercase">Odds by league</p>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {leagues.map((l) => (
              <li key={l.slug}>
                <Link href={`/odds/${l.slug}`} className="text-white/75 hover:text-white">
                  {l.name} odds
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-8 grid gap-4 border-t border-white/10 pt-6 text-xs leading-relaxed md:grid-cols-[auto_1fr]">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/60 text-sm font-bold text-white">18+</span>
          <div className="space-y-2">
            <p>
              Gambling can be addictive. Please play responsibly. Betting is only for adults of legal age in your jurisdiction (18+, 21+ in most US states, 25+ in Uganda). Help is available:
              South Africa NRGP 0800 006 008 · US 1-800-GAMBLER · UK National Gambling Helpline 0808 8020 133 · worldwide{" "}
              <a href="https://www.gamblingtherapy.org" className="text-white underline" rel="noopener">
                Gambling Therapy
              </a>
              .
            </p>
            <p>
              {site.name} is an independent comparison and information service. We are not a bookmaker and do not accept bets. We may earn a commission when you sign up through some links, which never affects our ratings — see our{" "}
              <Link href="/affiliate-disclosure" className="text-white underline">
                affiliate disclosure
              </Link>
              . Booking code conversions are provided for convenience; always check your betslip before placing a bet. Odds shown may be sample data where noted.
            </p>
            <p>© {YEAR} {site.name}. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
