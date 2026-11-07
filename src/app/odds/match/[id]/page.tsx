import Link from "next/link";
import { notFound } from "next/navigation";
import { leagueBySlug } from "@/data/leagues";
import { MatchOddsTable } from "@/components/odds/MatchOddsTable";
import { KickoffTime } from "@/components/odds/OddsBoard";
import { Notice, PageHero, SectionHeader } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { bestMarketMargin, bestPrices, bookmakerName, getFixture, getLeagueFixtures, mainMarket, pickLabel } from "@/lib/odds-data";
import { bookMeta, toMatchData } from "@/lib/odds-data/compact";
import { impliedProbability } from "@/lib/odds";
import { pageMetadata, sportsEventLd } from "@/lib/seo";

export const revalidate = 600;
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const f = await getFixture(id);
  if (!f) return { title: "Match not found", robots: { index: false } };
  const l = leagueBySlug(f.league);
  const date = new Date(f.kickoff).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  return pageMetadata({
    title: `${f.home} vs ${f.away} Odds — ${date}`,
    description: `${f.home} vs ${f.away} betting odds compared across ${f.books.length} bookmakers. Best ${l?.threeWay ? "1X2" : "moneyline"}, over/under and more for this ${l?.name ?? ""} match, with bookmaker margins.`,
    path: `/odds/match/${f.id}`,
  });
}

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const f = await getFixture(id);
  if (!f) notFound();
  const l = leagueBySlug(f.league);
  const market = mainMarket(f);
  const best = bestPrices(f, market);
  const margin = bestMarketMargin(f, market);
  const favourite = [...best].sort((a, b) => a.odds - b.odds)[0];
  const more = (await getLeagueFixtures(f.league)).filter((x) => x.id !== f.id).slice(0, 6);

  return (
    <>
      <PageHero
        breadcrumbs={[
          { name: "Odds", path: "/odds" },
          { name: l?.name ?? f.league, path: `/odds/${f.league}` },
          { name: `${f.home} vs ${f.away}`, path: `/odds/match/${f.id}` },
        ]}
        eyebrow={l?.name}
        title={`${f.home} vs ${f.away} odds`}
      >
        <div className="mt-4 flex flex-wrap items-center gap-6">
          <div className="rounded-xl bg-surface px-4 py-2">
            <KickoffTime iso={f.kickoff} />
          </div>
          <dl className="flex flex-wrap gap-6 text-sm">
            {best.map((b) => (
              <div key={b.pick}>
                <dt className="text-muted">Best {pickLabel(b.pick, f)}</dt>
                <dd className="tabular text-lg font-bold">
                  {b.odds.toFixed(2)} <span className="text-xs font-medium text-brand-700">{bookmakerName(b.bookmaker)}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </PageHero>
      <div className="container-page space-y-10 py-10">
        {f.source === "sample" && <Notice tone="warn">Sample odds for demonstration — not real prices. Confirm odds with the bookmaker before betting.</Notice>}
        <MatchOddsTable id={f.id} home={f.home} away={f.away} kickoff={f.kickoff} markets={toMatchData(f)} meta={bookMeta()} />

        <section className="prose-content">
          <h2>
            {f.home} vs {f.away}: what the odds say
          </h2>
          <p>
            {favourite && (
              <>
                Bookmakers make <strong>{pickLabel(favourite.pick, f)}</strong> the favourite, with a best price of {favourite.odds.toFixed(2)} — an implied probability of about {(impliedProbability(favourite.odds) * 100).toFixed(0)}%.{" "}
              </>
            )}
            {Number.isFinite(margin) && (
              <>
                Taking the best price on each outcome gives a combined margin of {(margin * 100).toFixed(1)}%
                {margin < 0 ? ", which means there is an arbitrage opportunity across bookmakers right now" : ", far lower than the margin of any single bookmaker"}. That&apos;s why it pays to shop around.
              </>
            )}
          </p>
          <p>
            Compared across {f.books.length} bookmakers. Prices change quickly, especially in the hour before kick-off. Learn more in <Link href="/guides/bookmaker-margin-explained">bookmaker margins explained</Link> or work out your returns with the{" "}
            <Link href="/tools/bet-calculator">bet calculator</Link>.
          </p>
        </section>

        {more.length > 0 && (
          <section>
            <SectionHeader title={`More ${l?.name} odds`} href={`/odds/${f.league}`} linkLabel="All matches" />
            <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((m) => (
                <li key={m.id}>
                  <Link href={`/odds/match/${m.id}`} className="card block px-4 py-3 font-semibold text-ink-900 no-underline hover:border-brand-500 hover:no-underline">
                    {m.home} vs {m.away}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <JsonLd data={sportsEventLd({ name: `${f.home} vs ${f.away}`, home: f.home, away: f.away, startDate: f.kickoff, path: `/odds/match/${f.id}`, league: l?.name ?? f.league })} />
    </>
  );
}
