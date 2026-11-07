import Link from "next/link";
import { notFound } from "next/navigation";
import { bookmakersInCountry, marketFor, overallRating } from "@/data/bookmakers";
import { countries, countryBySlug, regionByKey } from "@/data/countries";
import { leagues } from "@/data/leagues";
import { FeatureTable, OfferCard, RankingList } from "@/components/bookmakers";
import { OddsBoard } from "@/components/odds/OddsBoard";
import { FaqSection, Notice, PageHero, SectionHeader, TermsNote } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { getAllFixtures } from "@/lib/odds-data";
import { bookMeta, toBoardRow } from "@/lib/odds-data/compact";
import { guidesFor } from "@/lib/guides";
import { itemListLd, monthYear, pageMetadata } from "@/lib/seo";
import type { Faq } from "@/lib/types";

export const revalidate = 3600;

export function generateStaticParams() {
  return countries.map((c) => ({ country: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  const c = countryBySlug(country);
  if (!c) return {};
  const n = bookmakersInCountry(c.code).length;
  return pageMetadata({
    title: `Best Betting Sites in ${c.name} (${monthYear()}) — ${n} Licensed Bookmakers Compared`,
    description: `Compare the best ${c.demonym} betting sites: ${n} licensed bookmakers ranked on odds, bonuses, payments (${c.popularPayments.slice(0, 2).join(", ")}) and apps. Legal status, tips and FAQs.`,
    path: `/betting-sites/${c.slug}`,
  });
}

export default async function CountryPage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  const c = countryBySlug(country);
  if (!c) notFound();
  const books = bookmakersInCountry(c.code);
  const top = books[0];
  const codeBooks = books.filter((b) => marketFor(b, c.code)?.bookingCodeName);
  const region = regionByKey(c.region);

  // Odds for leagues local bookmakers cover, filtered to local bookmakers.
  const local = new Set(books.map((b) => b.slug));
  const localLeagues = leagues.filter((l) => l.coverage === "all" || l.coverage.includes(c.code)).sort((a, b) => a.priority - b.priority);
  const fixtures = (await getAllFixtures())
    .filter((f) => localLeagues.some((l) => l.slug === f.league))
    .map((f) => ({ ...f, books: f.books.filter((b) => local.has(b.bookmaker)) }))
    .filter((f) => f.books.length > 0)
    .slice(0, 8)
    .map(toBoardRow);
  const meta = bookMeta();

  const best = (key: "odds" | "bonuses" | "app" | "payments") => [...books].sort((a, b) => b.ratings[key] - a.ratings[key])[0];
  const awards = [
    { label: "Best overall", b: top },
    { label: "Best odds", b: best("odds") },
    { label: "Best bonuses", b: best("bonuses") },
    { label: "Best app", b: best("app") },
  ].filter((a) => a.b);

  const faqs: Faq[] = [
    ...c.faqs,
    { q: `What is the best betting site in ${c.name}?`, a: `Based on our ratings, ${top.name} is currently the top-rated bookmaker in ${c.name} with a score of ${overallRating(top).toFixed(1)}/10. The best choice depends on what you value — compare odds, bonuses and payment options in the table above.` },
    { q: `How many licensed bookmakers do you compare in ${c.name}?`, a: `We currently compare ${books.length} bookmakers operating in ${c.name}: ${books.map((b) => b.name).join(", ")}.` },
  ];
  if (codeBooks.length) {
    faqs.push({
      q: `Which ${c.demonym} bookmakers support booking codes?`,
      a: `${codeBooks.map((b) => `${b.name} (${marketFor(b, c.code)?.bookingCodeName})`).join(", ")} let you share and load betslips with a code. You can convert codes between them with our booking code converter.`,
    });
  }

  return (
    <>
      <PageHero
        breadcrumbs={[
          { name: "Betting sites", path: "/betting-sites" },
          { name: c.name, path: `/betting-sites/${c.slug}` },
        ]}
        eyebrow={`${c.flag} ${region.name} · Updated ${monthYear()}`}
        title={`Best betting sites in ${c.name}`}
        intro={<p>{c.intro[0]}</p>}
      >
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {awards.map((a) => (
            <Link key={a.label} href={`/bookmakers/${a.b.slug}`} className="rounded-2xl border border-line bg-surface p-4 text-ink-900 no-underline hover:border-brand-500 hover:no-underline">
              <p className="eyebrow">{a.label}</p>
              <p className="mt-1 text-lg font-bold">{a.b.name}</p>
              <p className="line-clamp-1 text-sm text-ink-700">{marketFor(a.b, c.code)?.welcome.headline}</p>
            </Link>
          ))}
        </div>
      </PageHero>

      <div className="container-page grid gap-10 py-10 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-12">
          <section>
            <SectionHeader title={`${c.name} bookmakers ranked`} sub={`${books.length} licensed bookmakers, ranked by our weighted rating.`} />
            <div className="mt-5">
              <RankingList items={books} country={c.code} />
            </div>
            <TermsNote className="mt-3" />
            <JsonLd data={itemListLd(`Best betting sites in ${c.name}`, books.map((b) => ({ name: b.name, path: `/bookmakers/${b.slug}` })))} />
          </section>

          <section className="prose-content">
            <h2>Sports betting in {c.name}: what you need to know</h2>
            {c.intro.slice(1).map((p) => (
              <p key={p.slice(0, 30)}>{p}</p>
            ))}
            <p>{c.legalSummary}</p>
          </section>

          <section>
            <SectionHeader title={`Welcome offers in ${c.name}`} href={`/bonuses/${c.slug}`} linkLabel="All bonuses" />
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {books.slice(0, 6).map((b) => (
                <OfferCard key={b.slug} b={b} country={c.code} />
              ))}
            </div>
          </section>

          {fixtures.length > 0 && (
            <section>
              <SectionHeader title={`Best odds at ${c.demonym} bookmakers`} href="/odds" linkLabel="Full odds comparison" sub={`Best price among bookmakers licensed in ${c.name}.`} />
              <div className="mt-5">
                <OddsBoard rows={fixtures} meta={meta} scoped showLeague leagueNames={Object.fromEntries(leagues.map((l) => [l.slug, l.name]))} />
              </div>
            </section>
          )}

          <section>
            <SectionHeader title="Features compared" />
            <div className="mt-5">
              <FeatureTable items={books} features={["liveBetting", "liveStreaming", "cashOut", "betBuilder", "bookingCode", "accaBoost", c.region === "europe" || c.region === "united-states" ? "earlyPayout" : "mobileMoney", "iosApp"]} />
            </div>
          </section>

          {codeBooks.length > 1 && (
            <section className="card bg-ink-900 p-6 text-white">
              <h2 className="text-2xl font-bold">Convert booking codes between {c.demonym} bookmakers</h2>
              <p className="mt-2 text-white/80">
                {codeBooks.map((b) => b.name).join(", ")} all support shareable betslip codes. Got a code for one but bet with another? Convert it in seconds.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {codeBooks.slice(0, 4).flatMap((a) =>
                  codeBooks
                    .filter((b) => b.slug !== a.slug)
                    .slice(0, 1)
                    .map((b) => (
                      <Link key={`${a.slug}-${b.slug}`} href={`/booking-code-converter/${a.slug}-to-${b.slug}`} className="btn border border-white/20 text-white hover:bg-white/10">
                        {a.name} → {b.name}
                      </Link>
                    )),
                )}
                <Link href="/booking-code-converter" className="btn-primary">
                  Open converter
                </Link>
              </div>
            </section>
          )}

          <section className="prose-content">
            <h2>Tips for betting in {c.name}</h2>
            <ul>
              {c.tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <h3>Popular payment methods</h3>
            <p>{c.popularPayments.join(", ")}.</p>
            <h3>Most popular sports</h3>
            <p>{c.popularSports.join(", ")}.</p>
          </section>

          {books.length > 1 && (
            <section>
              <SectionHeader title="Head-to-head comparisons" href="/compare" linkLabel="More comparisons" />
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {books.slice(0, 5).flatMap((a, i) =>
                  books.slice(i + 1, 5).map((b) => (
                    <li key={`${a.slug}-${b.slug}`}>
                      <Link href={`/compare/${a.slug}-vs-${b.slug}`} className="card block px-4 py-3 font-semibold text-ink-900 no-underline hover:border-brand-500 hover:no-underline">
                        {a.name} vs {b.name}
                      </Link>
                    </li>
                  )),
                )}
              </ul>
            </section>
          )}

          <FaqSection faqs={faqs} />
        </div>

        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          <div className="card p-5">
            <h2 className="font-bold">{c.name} at a glance</h2>
            <dl className="mt-3 space-y-2.5 text-sm">
              <div>
                <dt className="text-muted">Legal status</dt>
                <dd className="font-semibold">{c.legalStatus === "regulated-by-state" ? "Legal, regulated by state" : "Legal & regulated"}</dd>
              </div>
              <div>
                <dt className="text-muted">Minimum age</dt>
                <dd className="font-semibold">{c.minAge}+</dd>
              </div>
              <div>
                <dt className="text-muted">Regulator{c.regulators.length > 1 ? "s" : ""}</dt>
                <dd>
                  <ul className="space-y-0.5">
                    {c.regulators.map((r) => (
                      <li key={r.name} className="font-semibold">
                        {r.url ? (
                          <a href={r.url} rel="noopener" target="_blank">
                            {r.name}
                          </a>
                        ) : (
                          r.name
                        )}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
              {c.keyLaw && (
                <div>
                  <dt className="text-muted">Key law</dt>
                  <dd className="font-semibold">{c.keyLaw}</dd>
                </div>
              )}
              <div>
                <dt className="text-muted">Currency</dt>
                <dd className="font-semibold">
                  {c.currency.code} ({c.currency.symbol})
                </dd>
              </div>
              <div>
                <dt className="text-muted">Tax on winnings</dt>
                <dd>{c.taxNote}</dd>
              </div>
              {c.selfExclusion && (
                <div>
                  <dt className="text-muted">Self-exclusion</dt>
                  <dd className="font-semibold">{c.selfExclusion}</dd>
                </div>
              )}
            </dl>
          </div>
          <div className="card p-5">
            <h2 className="font-bold">Get help</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {c.helplines.map((h) => (
                <li key={h.name}>
                  <a href={h.url} rel="noopener" target="_blank" className="font-semibold">
                    {h.name}
                  </a>
                  {h.phone && <span className="block text-ink-700">{h.phone}</span>}
                </li>
              ))}
            </ul>
          </div>
          {guidesFor(c.region).length > 0 && (
            <div className="card p-5">
              <h2 className="font-bold">Guides for {c.name}</h2>
              <ul className="mt-2 space-y-1.5 text-sm">
                {guidesFor(c.region)
                  .slice(0, 6)
                  .map((g) => (
                    <li key={g.slug}>
                      <Link href={`/guides/${g.slug}`}>{g.title}</Link>
                    </li>
                  ))}
              </ul>
            </div>
          )}
          <Notice>Ratings and offers last reviewed {monthYear()}. We only list operators that hold a licence in {c.name}.</Notice>
        </aside>
      </div>
    </>
  );
}
