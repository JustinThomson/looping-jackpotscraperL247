import Link from "next/link";
import { Converter } from "@/components/converter/Converter";
import { HowConversionWorks, SupportedMarkets } from "@/components/converter/ConverterExplainer";
import { FaqSection, Notice, PageHero, SectionHeader } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { converterBookOptions, converterPairs } from "@/lib/converter/books";
import { converterBookmakers } from "@/lib/converter";
import { pageMetadata, softwareAppLd } from "@/lib/seo";

const TITLE = "Booking Code Converter — Convert SportyBet, Bet9ja, Betway & BetKing Codes";
const DESC = "Free booking code converter: convert betslip codes between SportyBet, Bet9ja, Betway, BetKing, MSport, Betika and more. See which bookmaker pays the highest odds for your slip.";

export const metadata = pageMetadata({ title: TITLE, description: DESC, path: "/booking-code-converter" });

export default function ConverterPage() {
  const books = converterBookmakers();
  const popular = converterPairs().filter((p) => ["sportybet", "bet9ja", "betway", "betking"].includes(p.from) && ["sportybet", "bet9ja", "betway", "betking", "msport"].includes(p.to));
  return (
    <>
      <PageHero
        breadcrumbs={[{ name: "Booking code converter", path: "/booking-code-converter" }]}
        eyebrow="Free tool"
        title="Booking code converter"
        intro={
          <p>
            Got a booking code for one bookmaker but bet with another? Paste it below and we&apos;ll rebuild the slip on your bookmaker — matching every game, mapping each market and showing you which bookmaker pays more. Works with {books.map((b) => b.name).join(", ")}.
          </p>
        }
      />
      <div className="container-page space-y-14 py-10">
        <div>
          <Converter books={converterBookOptions()} />
          <Notice tone="warn">
            <span className="mt-3 block">
              <strong>Demo mode.</strong> This site is running without bookmaker API access, so conversions use sample matches and generate demo codes (starting “DM-”). Use the demo codes above to try it. To connect real bookmaker
              integrations, see the adapter interface described in the README.
            </span>
          </Notice>
        </div>
        <section>
          <SectionHeader title="How booking code conversion works" />
          <div className="mt-5">
            <HowConversionWorks />
          </div>
        </section>
        <section>
          <SectionHeader title="Which markets convert?" />
          <div className="mt-5">
            <SupportedMarkets />
          </div>
        </section>
        <section>
          <SectionHeader title="Popular conversions" />
          <ul className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {popular.map((p) => {
              const a = books.find((b) => b.slug === p.from)!;
              const b = books.find((x) => x.slug === p.to)!;
              return (
                <li key={p.slug}>
                  <Link href={`/booking-code-converter/${p.slug}`} className="card block px-4 py-3 font-semibold text-ink-900 no-underline hover:border-brand-500 hover:no-underline">
                    {a.name} → {b.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
        <section className="prose-content">
          <h2>Why convert booking codes?</h2>
          <p>
            Booking codes only work at the bookmaker that created them. Tipsters and friends often share codes for SportyBet or Bet9ja, but you might have your account — and your money — at Betway or BetKing. Rebuilding a 10-leg accumulator by
            hand is slow and it&apos;s easy to pick the wrong market. A converter does it in seconds and flags anything it couldn&apos;t match.
          </p>
          <p>
            Converting also lets you <strong>compare the same slip across bookmakers</strong>. Because each bookmaker prices matches differently, the total odds on a long accumulator can differ by 20% or more. Use “Compare across all
            bookmakers” to see where your slip pays the most, then check <Link href="/bonuses">accumulator bonuses</Link> on top.
          </p>
          <p>
            New to codes? Start with <Link href="/guides/what-is-a-booking-code">what is a booking code</Link> and our step-by-step guide on <Link href="/guides/how-to-convert-booking-codes">how to convert booking codes</Link>.
          </p>
        </section>
        <FaqSection
          faqs={[
            { q: "Is the booking code converter free?", a: "Yes. The converter is free to use and you don't need an account." },
            { q: "Why didn't every selection convert?", a: "A selection can't convert if the target bookmaker doesn't list the match, doesn't offer that market (or that over/under line), or the match has already started. We show the reason next to each selection and leave it out of the new code." },
            { q: "Will the odds be the same after converting?", a: "Usually not exactly. Each bookmaker sets its own prices, so the converted slip may have higher or lower total odds. We show both totals so you can choose." },
            { q: "Can I convert codes between countries?", a: "Bookmakers run separate sites per country, and matches or markets can differ. For the best results, convert between bookmakers in the same country." },
            { q: "Is it safe to bet on codes from tipsters?", a: "Treat paid 'sure odds' and 'fixed match' codes as scams. A booking code is just a list of selections — it carries no guarantee. Read our guide to betting scams to avoid." },
          ]}
        />
      </div>
      <JsonLd data={softwareAppLd({ name: "Booking code converter", description: DESC, path: "/booking-code-converter" })} />
    </>
  );
}
