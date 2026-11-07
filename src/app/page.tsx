import Link from "next/link";
import { bookmakers, bookmakersInCountry, overallRating } from "@/data/bookmakers";
import { countries, countryByCode, regions } from "@/data/countries";
import { leagues } from "@/data/leagues";
import { BookmakerCard } from "@/components/bookmakers";
import { Converter } from "@/components/converter/Converter";
import { OddsBoard } from "@/components/odds/OddsBoard";
import { FaqSection, SectionHeader, TermsNote } from "@/components/ui";
import { converterBookOptions } from "@/lib/converter/books";
import { getAllFixtures } from "@/lib/odds-data";
import { bookMeta, toBoardRow } from "@/lib/odds-data/compact";
import { getGuides } from "@/lib/guides";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const revalidate = 1800;

export const metadata = pageMetadata({
  title: `${site.name}: Compare Betting Sites, Odds & Convert Booking Codes`,
  description: site.description,
  path: "/",
});

export default async function HomePage() {
  const fixtures = await getAllFixtures();
  const featured = fixtures
    .filter((f) => ["premier-league", "champions-league", "betway-premiership", "la-liga"].includes(f.league))
    .slice(0, 8)
    .map(toBoardRow);
  const leagueNames = Object.fromEntries(leagues.map((l) => [l.slug, l.name]));
  const guides = getGuides().slice(0, 6);
  const topZa = bookmakersInCountry("za").slice(0, 3);

  return (
    <>
      <section className="relative overflow-hidden bg-ink-900 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-30" style={{ background: "radial-gradient(60% 80% at 80% 0%, #10b981 0%, transparent 60%)" }} />
        <div className="container-page relative grid gap-10 py-12 lg:grid-cols-[1.05fr_1fr] lg:py-16">
          <div>
            <p className="eyebrow text-brand-400">South Africa · Africa · USA · Europe</p>
            <h1 className="mt-3 text-4xl leading-[1.1] font-extrabold tracking-tight sm:text-5xl">
              Compare betting sites, find the best odds &amp; <span className="text-brand-400">convert booking codes</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-white/80">
              Independent reviews of {bookmakers.length} licensed bookmakers in {countries.length} countries, side-by-side odds comparison and a free tool to move your betslip from one bookmaker to another.
            </p>
            <ul className="mt-6 grid max-w-xl grid-cols-3 gap-3 text-center">
              {[
                [bookmakers.length, "bookmakers reviewed"],
                [countries.length, "countries covered"],
                [fixtures.length, "matches compared"],
              ].map(([n, l]) => (
                <li key={String(l)} className="rounded-2xl bg-white/5 px-3 py-4 ring-1 ring-white/10">
                  <span className="tabular block text-2xl font-extrabold">{n}</span>
                  <span className="text-xs text-white/70">{l}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/odds" className="btn-primary">
                Compare today&apos;s odds
              </Link>
              <Link href="/bonuses" className="btn border border-white/20 text-white hover:bg-white/10">
                See latest bonuses
              </Link>
            </div>
          </div>
          <div className="text-ink-900">
            <p className="mb-2 text-sm font-semibold text-white/80">Booking code converter</p>
            <Converter books={converterBookOptions()} compact />
          </div>
        </div>
      </section>

      <div className="container-page space-y-16 py-12">
        <section>
          <SectionHeader title="Find the best betting sites in your country" sub="Licensed bookmakers ranked by odds, bonuses, payments and app quality." />
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {regions.map((r) => (
              <div key={r.key} className="card p-5">
                <h3 className="font-bold">{r.name}</h3>
                <p className="mt-1 text-sm text-ink-700">{r.description}</p>
                <ul className="mt-3 space-y-1">
                  {r.countries.map((code) => {
                    const c = countryByCode(code)!;
                    return (
                      <li key={code}>
                        <Link href={`/betting-sites/${c.slug}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm font-medium text-ink-900 no-underline hover:bg-surface hover:no-underline">
                          <span>
                            {c.flag} Betting sites {c.name}
                          </span>
                          <span className="text-xs text-muted">{bookmakersInCountry(code).length}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionHeader title="Odds comparison: upcoming matches" href="/odds" linkLabel="All leagues" sub="Best available price across bookmakers. Choose your region to see bookmakers you can actually use." />
          <div className="mt-6">
            <OddsBoard rows={featured} meta={bookMeta()} showLeague leagueNames={leagueNames} />
          </div>
        </section>

        <section>
          <SectionHeader title="Top-rated in South Africa" href="/betting-sites/south-africa" linkLabel="Full SA rankings" />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {topZa.map((b) => (
              <BookmakerCard key={b.slug} b={b} country="za" />
            ))}
          </div>
          <TermsNote className="mt-3" />
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          {[
            { title: "Odds comparison", href: "/odds", text: "Compare 1X2, double chance, over/under and BTTS prices across bookmakers, with margins calculated for every market." },
            { title: "Booking code converter", href: "/booking-code-converter", text: "Paste a SportyBet, Bet9ja, Betway or BetKing code and rebuild the slip on another bookmaker — then see which pays most." },
            { title: "Bonuses & promotions", href: "/bonuses", text: "Welcome offers, free bets and accumulator boosts by country, with plain-English notes on terms and wagering." },
          ].map((f) => (
            <Link key={f.href} href={f.href} className="card group p-6 text-ink-900 no-underline hover:border-brand-500 hover:no-underline">
              <h3 className="text-lg font-bold group-hover:text-brand-700">{f.title} →</h3>
              <p className="mt-2 text-ink-700">{f.text}</p>
            </Link>
          ))}
        </section>

        <section>
          <SectionHeader title="Highest-rated bookmakers overall" href="/bookmakers" linkLabel="All bookmakers" />
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...bookmakers]
              .sort((a, b) => overallRating(b) - overallRating(a))
              .slice(0, 8)
              .map((b) => (
                <BookmakerCard key={b.slug} b={b} />
              ))}
          </div>
        </section>

        <section>
          <SectionHeader title="Betting guides" href="/guides" linkLabel="All guides" />
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {guides.map((g) => (
              <Link key={g.slug} href={`/guides/${g.slug}`} className="card p-5 text-ink-900 no-underline hover:border-brand-500 hover:no-underline">
                <p className="eyebrow">{g.readingMinutes} min read</p>
                <h3 className="mt-1 font-bold">{g.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-ink-700">{g.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <FaqSection
          faqs={[
            { q: "What is OddsBridge?", a: "OddsBridge is an independent comparison site for sports betting. We review licensed bookmakers in South Africa, Nigeria, Kenya, Ghana, Uganda, Tanzania, the United States and Europe, compare their odds and bonuses, and provide free tools such as a booking code converter and odds calculators." },
            { q: "How does the booking code converter work?", a: "Enter a booking code from one bookmaker and choose a target bookmaker. We read the selections in the code, find the same matches at the target bookmaker using team-name and kickoff matching, map each market and outcome, and generate an equivalent slip. Selections that can't be matched are clearly flagged." },
            { q: "Are the odds on OddsBridge live?", a: "Where a live odds feed is connected, prices are refreshed regularly. Otherwise pages clearly show sample odds for demonstration. Always confirm the price on the bookmaker's site before placing a bet." },
            { q: "Is OddsBridge a bookmaker?", a: "No. We don't take bets. We compare licensed bookmakers and may earn a commission when you join one through our links, which never changes our ratings." },
          ]}
        />
      </div>
    </>
  );
}
