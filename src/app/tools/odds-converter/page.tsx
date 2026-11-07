import Link from "next/link";
import { OddsConverterTool } from "@/components/tools/OddsConverterTool";
import { FaqSection, PageHero } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { pageMetadata, softwareAppLd } from "@/lib/seo";

const TITLE = 'Odds Converter — Decimal, Fractional & American Odds';
const DESC = 'Convert betting odds between decimal, fractional and American formats instantly, with implied probability and a full conversion chart.';

export const metadata = pageMetadata({ title: TITLE, description: DESC, path: "/tools/odds-converter" });

export default function Page() {
  return (
    <>
      <PageHero
        breadcrumbs={[
          { name: "Tools", path: "/tools" },
          { name: 'Odds converter', path: "/tools/odds-converter" },
        ]}
        eyebrow="Free tool"
        title={'Odds converter'}
        intro={'Convert any price between decimal (2.50), fractional (6/4) and American (+150) odds, and see the implied probability.'}
      />
      <div className="container-page py-10">
        <OddsConverterTool />
        <p className="mt-6 text-sm text-ink-700">
          Want the background? Read our guide: <Link href="/guides/betting-odds-explained">betting odds explained</Link>.
        </p>
        <FaqSection
          faqs={[
            { q: 'How do I convert decimal odds to American?', a: 'If decimal odds are 2.00 or more, American odds = (decimal − 1) × 100, shown with a plus sign. Below 2.00, American odds = −100 ÷ (decimal − 1). So 2.50 is +150 and 1.50 is −200.' },
            { q: 'How do I convert fractional odds to decimal?', a: 'Divide the first number by the second and add 1. For example 6/4 = 1.5 + 1 = 2.50.' },
            { q: 'What is implied probability?', a: "Implied probability is the chance of an outcome suggested by the odds: 1 ÷ decimal odds. Odds of 2.50 imply a 40% chance, before removing the bookmaker's margin." },
          ]}
        />
      </div>
      <JsonLd data={softwareAppLd({ name: 'Odds converter', description: DESC, path: "/tools/odds-converter" })} />
    </>
  );
}
