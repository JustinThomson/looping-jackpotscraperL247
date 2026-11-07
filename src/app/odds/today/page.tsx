import Link from "next/link";
import { leagues } from "@/data/leagues";
import { OddsBoard } from "@/components/odds/OddsBoard";
import { Notice, PageHero } from "@/components/ui";
import { getAllFixtures } from "@/lib/odds-data";
import { bookMeta, toBoardRow } from "@/lib/odds-data/compact";
import { oddsApiEnabled } from "@/lib/odds-data/the-odds-api";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 600;

export const metadata = pageMetadata({
  title: "Odds Today — Best Betting Odds for Today's & Tomorrow's Matches",
  description: "Today's best betting odds compared across bookmakers: football, NBA, NFL and rugby matches in the next 48 hours, with the top price for every outcome.",
  path: "/odds/today",
});

export default async function OddsToday() {
  const now = Date.now();
  const soon = (await getAllFixtures()).filter((f) => new Date(f.kickoff).getTime() - now < 48 * 3_600_000);
  const leagueNames = Object.fromEntries(leagues.map((l) => [l.slug, l.name]));
  return (
    <>
      <PageHero
        breadcrumbs={[
          { name: "Odds", path: "/odds" },
          { name: "Today", path: "/odds/today" },
        ]}
        title="Odds today"
        intro={`${soon.length} matches kicking off in the next 48 hours, with the best price across every bookmaker in your region.`}
      />
      <div className="container-page space-y-6 py-10">
        {!oddsApiEnabled() && <Notice tone="warn">Sample odds for demonstration. Confirm prices with the bookmaker before betting.</Notice>}
        {soon.length ? (
          <OddsBoard rows={soon.map(toBoardRow)} meta={bookMeta()} showLeague leagueNames={leagueNames} />
        ) : (
          <p className="card p-6 text-ink-700">
            No matches in the next 48 hours. See <Link href="/odds">all upcoming odds</Link>.
          </p>
        )}
      </div>
    </>
  );
}
