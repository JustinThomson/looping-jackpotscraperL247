import Link from "next/link";
import { notFound } from "next/navigation";
import { leagueBySlug, leagues, SPORT_LABELS } from "@/data/leagues";
import { OddsBoard } from "@/components/odds/OddsBoard";
import { FaqSection, Notice, PageHero } from "@/components/ui";
import { getLeagueFixtures } from "@/lib/odds-data";
import { bookMeta, toBoardRow } from "@/lib/odds-data/compact";
import { oddsApiEnabled } from "@/lib/odds-data/the-odds-api";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 900;

export function generateStaticParams() {
  return leagues.map((l) => ({ league: l.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ league: string }> }) {
  const { league } = await params;
  const l = leagueBySlug(league);
  if (!l) return {};
  return pageMetadata({
    title: `${l.name} Odds — Compare Best Betting Odds Today`,
    description: `Compare ${l.name} betting odds across bookmakers. Best ${l.threeWay ? "1X2" : "moneyline"}, over/under${l.sport === "football" ? ", double chance and BTTS" : ""} prices for every upcoming ${l.name} match, with margins.`,
    path: `/odds/${l.slug}`,
  });
}

export default async function LeagueOddsPage({ params }: { params: Promise<{ league: string }> }) {
  const { league } = await params;
  const l = leagueBySlug(league);
  if (!l) notFound();
  const fixtures = await getLeagueFixtures(l.slug);
  const rows = fixtures.map(toBoardRow);
  const others = leagues.filter((x) => x.slug !== l.slug && x.sport === l.sport).slice(0, 6);
  return (
    <>
      <PageHero
        breadcrumbs={[
          { name: "Odds", path: "/odds" },
          { name: l.name, path: `/odds/${l.slug}` },
        ]}
        eyebrow={`${SPORT_LABELS[l.sport]} · ${l.country}`}
        title={`${l.name} odds comparison`}
        intro={`Best available prices for upcoming ${l.name} ${l.sport === "football" ? "fixtures" : "games"} across ${new Set(fixtures.flatMap((f) => f.books.map((b) => b.bookmaker))).size} bookmakers. Open a match for every market and each bookmaker's margin.`}
      />
      <div className="container-page grid gap-10 py-10 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0 space-y-6">
          {fixtures[0]?.source !== "the-odds-api" && !oddsApiEnabled() && <Notice tone="warn">Sample odds for demonstration. Confirm prices with the bookmaker before betting.</Notice>}
          {rows.length ? <OddsBoard rows={rows} meta={bookMeta()} /> : <p className="card p-6 text-ink-700">No upcoming {l.name} matches in the next week. Check back soon.</p>}
          <FaqSection
            faqs={[
              { q: `Where can I find the best ${l.name} odds?`, a: `The best ${l.name} odds change from match to match. Our table shows the highest price for each outcome across all bookmakers in your region, so you can see at a glance who's paying most.` },
              { q: `How often are ${l.name} odds updated?`, a: "Odds pages are refreshed every 15 minutes when a live feed is connected. Prices move quickly before kickoff, so always check the final price on the betslip." },
            ]}
          />
        </div>
        <aside className="space-y-5">
          <div className="card p-5">
            <h2 className="font-bold">More {SPORT_LABELS[l.sport].toLowerCase()} odds</h2>
            <ul className="mt-2 space-y-1.5 text-sm">
              {others.map((o) => (
                <li key={o.slug}>
                  <Link href={`/odds/${o.slug}`}>{o.name} odds</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-5">
            <h2 className="font-bold">Useful tools</h2>
            <ul className="mt-2 space-y-1.5 text-sm">
              <li><Link href="/tools/bet-calculator">Accumulator & bet calculator</Link></li>
              <li><Link href="/tools/margin-calculator">Bookmaker margin calculator</Link></li>
              <li><Link href="/tools/odds-converter">Odds converter</Link></li>
              <li><Link href="/booking-code-converter">Booking code converter</Link></li>
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}
