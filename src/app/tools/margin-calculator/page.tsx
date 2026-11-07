import Link from "next/link";
import { MarginCalculatorTool } from "@/components/tools/MarginCalculatorTool";
import { FaqSection, PageHero } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { pageMetadata, softwareAppLd } from "@/lib/seo";

const TITLE = 'Bookmaker Margin Calculator — Overround, Fair Odds & Arbitrage';
const DESC = "Calculate a bookmaker's margin (overround) from 2-way or 3-way odds, see fair odds without the margin, and check for arbitrage opportunities.";

export const metadata = pageMetadata({ title: TITLE, description: DESC, path: "/tools/margin-calculator" });

export default function Page() {
  return (
    <>
      <PageHero
        breadcrumbs={[
          { name: "Tools", path: "/tools" },
          { name: 'Margin calculator', path: "/tools/margin-calculator" },
        ]}
        eyebrow="Free tool"
        title={'Margin calculator'}
        intro={"Enter the odds for every outcome in a market to see the bookmaker's margin, the fair odds without it, and whether combining bookmakers creates an arbitrage."}
      />
      <div className="container-page py-10">
        <MarginCalculatorTool />
        <p className="mt-6 text-sm text-ink-700">
          Want the background? Read our guide: <Link href="/guides/bookmaker-margin-explained">bookmaker margin explained</Link>.
        </p>
        <FaqSection
          faqs={[
            { q: 'How is bookmaker margin calculated?', a: 'Add up 1 ÷ odds for every outcome and subtract 1. For odds of 2.10, 3.40 and 3.50: 0.476 + 0.294 + 0.286 = 1.056, so the margin is 5.6%.' },
            { q: 'What is a good margin?', a: 'On major football 1X2 markets, sharp bookmakers run margins of 2–5%, while many retail bookmakers sit between 5% and 9%. Lower is better for you.' },
            { q: 'What is an arbitrage bet?', a: 'If the best odds from different bookmakers sum to an implied total below 100%, staking on every outcome guarantees a small profit. These opportunities are rare and short-lived, and bookmakers may restrict arbitrage players.' },
          ]}
        />
      </div>
      <JsonLd data={softwareAppLd({ name: 'Margin calculator', description: DESC, path: "/tools/margin-calculator" })} />
    </>
  );
}
