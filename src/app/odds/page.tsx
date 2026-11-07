import Link from "next/link";
import { leagues, SPORT_LABELS } from "@/data/leagues";
import { OddsBoard } from "@/components/odds/OddsBoard";
import { FaqSection, Notice, PageHero, SectionHeader } from "@/components/ui";
import { getAllFixtures } from "@/lib/odds-data";
import { bookMeta, toBoardRow } from "@/lib/odds-data/compact";
import { oddsApiEnabled } from "@/lib/odds-data/the-odds-api";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 900;

export const metadata = pageMetadata({
  title: "Odds Comparison — Best Football, NBA, NFL & Rugby Odds Today",
  description: "Compare betting odds across bookmakers in South Africa, Africa, the US and Europe. Best prices for the Premier League, Champions League, Betway Premiership, NBA, NFL and more.",
  path: "/odds",
});

export default async function OddsPage() {
  const fixtures = await getAllFixtures();
  const meta = bookMeta();
  const live = oddsApiEnabled();
  const sorted = [...leagues].sort((a, b) => a.priority - b.priority);
  return (
    <>
      <PageHero
        breadcrumbs={[{ name: "Odds", path: "/odds" }]}
        title="Odds comparison"
        intro="The best available price for every upcoming match, across every bookmaker we track. Choose your region to only see bookmakers you can use, switch between decimal, fractional and American odds, and add prices to your betslip to compare the full accumulator."
      >
        <nav aria-label="Leagues" className="mt-5 flex flex-wrap gap-2">
          <Link href="/odds/today" className="chip border-ink-900 bg-ink-900 text-white no-underline hover:no-underline">
            Today &amp; tomorrow
          </Link>
          {sorted.map((l) => (
            <Link key={l.slug} href={`/odds/${l.slug}`} className="chip no-underline hover:border-brand-500 hover:no-underline">
              {l.name}
            </Link>
          ))}
        </nav>
      </PageHero>
      <div className="container-page space-y-12 py-10">
        {!live && (
          <Notice tone="warn">
            Showing <strong>sample odds</strong> generated for demonstration. Connect a live odds feed (see README) to display real prices. Always confirm odds on the bookmaker&apos;s site.
          </Notice>
        )}
        {sorted.map((l) => {
          const rows = fixtures.filter((f) => f.league === l.slug).slice(0, 6).map(toBoardRow);
          if (!rows.length) return null;
          return (
            <section key={l.slug}>
              <SectionHeader title={`${l.name} odds`} sub={`${SPORT_LABELS[l.sport]} · ${l.country}`} href={`/odds/${l.slug}`} linkLabel={`All ${l.name} matches`} />
              <div className="mt-4">
                <OddsBoard rows={rows} meta={meta} />
              </div>
            </section>
          );
        })}
        <FaqSection
          faqs={[
            { q: "How does odds comparison work?", a: "We collect prices from many bookmakers for the same match and show you the best price for each outcome. Betting at the best price increases your potential return without changing your risk." },
            { q: "What does the margin percentage mean?", a: "The margin (or overround) is the bookmaker's built-in edge. It's calculated from the implied probabilities of all outcomes in a market. A lower margin means fairer odds for you." },
            { q: "Why can't I see some bookmakers?", a: "Bookmakers are licensed country by country. Use the region selector to show only bookmakers available where you live." },
          ]}
        />
      </div>
    </>
  );
}
