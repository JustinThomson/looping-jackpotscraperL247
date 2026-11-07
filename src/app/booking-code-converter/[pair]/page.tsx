import Link from "next/link";
import { notFound } from "next/navigation";
import { bookmakerBySlug } from "@/data/bookmakers";
import { countryByCode } from "@/data/countries";
import { Converter } from "@/components/converter/Converter";
import { HowConversionWorks, SupportedMarkets } from "@/components/converter/ConverterExplainer";
import { FaqSection, Notice, PageHero, SectionHeader } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { converterBookOptions, converterPairs } from "@/lib/converter/books";
import { pageMetadata, softwareAppLd } from "@/lib/seo";

export function generateStaticParams() {
  return converterPairs().map((p) => ({ pair: p.slug }));
}

function parse(pair: string) {
  const p = converterPairs().find((x) => x.slug === pair);
  if (!p) return null;
  return { from: bookmakerBySlug(p.from)!, to: bookmakerBySlug(p.to)! };
}

export async function generateMetadata({ params }: { params: Promise<{ pair: string }> }) {
  const { pair } = await params;
  const p = parse(pair);
  if (!p) return {};
  const fc = p.from.bookingCode?.name ?? "booking code";
  return pageMetadata({
    title: `Convert ${p.from.name} ${fc} to ${p.to.name} — Free Converter`,
    description: `Convert a ${p.from.name} ${fc.toLowerCase()} to ${p.to.name} in seconds. We match every game, map the markets and show which bookmaker pays higher odds for your slip.`,
    path: `/booking-code-converter/${pair}`,
  });
}

export default async function PairPage({ params }: { params: Promise<{ pair: string }> }) {
  const { pair } = await params;
  const p = parse(pair);
  if (!p) notFound();
  const { from, to } = p;
  const fromName = from.bookingCode?.name ?? "Booking Code";
  const toName = to.bookingCode?.name ?? "Booking Code";
  const shared = from.markets.filter((m) => m.bookingCodeName && to.markets.some((t) => t.country === m.country && t.bookingCodeName)).map((m) => countryByCode(m.country)!);
  const reverse = `${to.slug}-to-${from.slug}`;
  const others = converterPairs().filter((x) => x.from === from.slug && x.to !== to.slug);

  return (
    <>
      <PageHero
        breadcrumbs={[
          { name: "Booking code converter", path: "/booking-code-converter" },
          { name: `${from.name} to ${to.name}`, path: `/booking-code-converter/${pair}` },
        ]}
        eyebrow="Free booking code converter"
        title={`Convert ${from.name} ${fromName.toLowerCase()} to ${to.name}`}
        intro={
          <p>
            Paste a {from.name} {fromName.toLowerCase()} and get the same selections as a {to.name} {toName.toLowerCase()}.{" "}
            {shared.length ? `Both bookmakers operate in ${shared.map((c) => c.name).join(", ")}.` : `Note: ${from.name} and ${to.name} don't share a country in our database, so fewer matches may convert.`}
          </p>
        }
      />
      <div className="container-page space-y-14 py-10">
        <div className="space-y-3">
          <Converter books={converterBookOptions()} defaultFrom={from.slug} defaultTo={to.slug} />
          <Notice tone="warn">Demo mode: conversions use sample matches and generate demo codes (starting “DM-”), which only work in this converter.</Notice>
        </div>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="card p-6">
            <h2 className="text-xl font-bold">
              Step 1: get your {from.name} {fromName.toLowerCase()}
            </h2>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-ink-800">
              {(from.bookingCode?.howToCreate ?? ["Build your betslip and tap 'Book bet' to get a code."]).map((s) => (
                <li key={s}>{s}</li>
              ))}
              <li>Copy the code (or use one a friend or tipster shared).</li>
            </ol>
          </div>
          <div className="card p-6">
            <h2 className="text-xl font-bold">Step 2: load it on {to.name}</h2>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-ink-800">
              <li>Convert the code above and copy the new {to.name} code.</li>
              {(to.bookingCode?.howToLoad ?? ["Enter the code on the betslip."]).map((s) => (
                <li key={s}>{s}</li>
              ))}
              <li>Check every selection and the odds, then place your bet.</li>
            </ol>
          </div>
        </section>

        <section>
          <SectionHeader title="How it works" />
          <div className="mt-5">
            <HowConversionWorks />
          </div>
        </section>

        <section className="prose-content">
          <h2>
            {from.name} vs {to.name} for accumulators
          </h2>
          <p>
            {from.name}&apos;s typical football margin is around {(from.typicalMargin * 100).toFixed(1)}%, while {to.name}&apos;s is about {(to.typicalMargin * 100).toFixed(1)}%.{" "}
            {to.typicalMargin < from.typicalMargin
              ? `That means a slip converted to ${to.name} will often show slightly higher total odds — and the difference compounds with every extra leg.`
              : `So converting to ${to.name} won't always improve the price — use "Compare across all bookmakers" to see where your slip pays the most.`}
          </p>
          <p>
            Read our full reviews of <Link href={`/bookmakers/${from.slug}`}>{from.name}</Link> and <Link href={`/bookmakers/${to.slug}`}>{to.name}</Link>, or see them{" "}
            <Link href={`/compare/${[from.slug, to.slug].sort().join("-vs-")}`}>compared head to head</Link>.
          </p>
        </section>

        <section>
          <SectionHeader title="Which markets convert?" />
          <div className="mt-5">
            <SupportedMarkets />
          </div>
        </section>

        <section>
          <SectionHeader title="Other conversions" />
          <ul className="mt-4 flex flex-wrap gap-2">
            <li>
              <Link href={`/booking-code-converter/${reverse}`} className="chip no-underline hover:border-brand-500 hover:no-underline">
                {to.name} → {from.name}
              </Link>
            </li>
            {others.map((o) => (
              <li key={o.slug}>
                <Link href={`/booking-code-converter/${o.slug}`} className="chip no-underline hover:border-brand-500 hover:no-underline">
                  {from.name} → {bookmakerBySlug(o.to)!.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <FaqSection
          faqs={[
            { q: `Can I use a ${from.name} code on ${to.name}?`, a: `Not directly — booking codes only work on the bookmaker that created them. Convert the ${from.name} code with the tool above to get an equivalent ${to.name} ${toName.toLowerCase()}.` },
            { q: `Why are the ${to.name} odds different?`, a: `${from.name} and ${to.name} set their own prices, so each selection can have slightly different odds. We show the total odds at both bookmakers after converting.` },
            { q: "What if a game is missing?", a: `If ${to.name} doesn't list a match or market from your ${from.name} slip, we mark it as not converted and leave it out of the new code. You can add a replacement manually.` },
            { q: "Do converted codes expire?", a: "Yes. A code stops working once its matches start, so convert and place your bet before the first kickoff." },
          ]}
        />
      </div>
      <JsonLd data={softwareAppLd({ name: `${from.name} to ${to.name} booking code converter`, description: `Convert ${from.name} booking codes to ${to.name}.`, path: `/booking-code-converter/${pair}` })} />
    </>
  );
}
