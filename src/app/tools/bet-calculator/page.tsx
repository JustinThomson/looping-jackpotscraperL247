import Link from "next/link";
import { BetCalculatorTool } from "@/components/tools/BetCalculatorTool";
import { FaqSection, PageHero } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { pageMetadata, softwareAppLd } from "@/lib/seo";

const TITLE = 'Bet Calculator — Accumulator, Parlay & System Bet Returns';
const DESC = 'Free bet calculator for accumulators, parlays and system bets. Enter odds in any format, add an acca bonus and see your returns and profit.';

export const metadata = pageMetadata({ title: TITLE, description: DESC, path: "/tools/bet-calculator" });

export default function Page() {
  return (
    <>
      <PageHero
        breadcrumbs={[
          { name: "Tools", path: "/tools" },
          { name: 'Bet calculator', path: "/tools/bet-calculator" },
        ]}
        eyebrow="Free tool"
        title={'Bet calculator'}
        intro={'Work out returns for accumulators (multis, parlays) and system bets. Mark selections as won or lost and add an accumulator bonus percentage.'}
      />
      <div className="container-page py-10">
        <BetCalculatorTool />
        <p className="mt-6 text-sm text-ink-700">
          Want the background? Read our guide: <Link href="/guides/accumulator-betting-guide">accumulator betting guide</Link>.
        </p>
        <FaqSection
          faqs={[
            { q: 'How are accumulator odds calculated?', a: 'Multiply the decimal odds of every selection. Three selections at 1.85, 2.10 and 1.60 give total odds of 6.22, so a 100 stake returns 622 if all win.' },
            { q: 'What is a system bet?', a: 'A system bet places every combination of a given size from your selections — for example a 2/3 system is three doubles. You can win something even if not every selection wins.' },
            { q: 'Does the calculator include acca bonuses?', a: 'Yes. Enter the bonus percentage your bookmaker adds to winning accumulators and we add it to the profit, as most bookmakers do.' },
          ]}
        />
      </div>
      <JsonLd data={softwareAppLd({ name: 'Bet calculator', description: DESC, path: "/tools/bet-calculator" })} />
    </>
  );
}
