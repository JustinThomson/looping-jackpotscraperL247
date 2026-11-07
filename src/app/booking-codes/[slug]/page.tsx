import Link from "next/link";
import { notFound } from "next/navigation";
import { bookmakerBySlug } from "@/data/bookmakers";
import { countryByCode } from "@/data/countries";
import { Converter } from "@/components/converter/Converter";
import { VisitButton } from "@/components/bookmakers";
import { FaqSection, Notice, PageHero, SectionHeader } from "@/components/ui";
import { converterBookOptions } from "@/lib/converter/books";
import { converterBookmakers } from "@/lib/converter";
import { pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return converterBookmakers().map((b) => ({ slug: b.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const b = bookmakerBySlug(slug);
  if (!b?.bookingCode) return {};
  const name = b.bookingCode.name;
  return pageMetadata({
    title: `${b.name} ${name}: Create, Load & Convert (${new Date().getFullYear()})`,
    description: `Step-by-step guide to ${b.name} ${name.toLowerCase()}s: how to book a bet, load a code, fix "invalid code" errors and convert ${b.name} codes to other bookmakers for free.`,
    path: `/booking-codes/${b.slug}`,
  });
}

export default async function BookingCodePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const b = bookmakerBySlug(slug);
  if (!b?.bookingCode) notFound();
  const code = b.bookingCode;
  const lower = code.name.toLowerCase();
  const markets = b.markets.filter((m) => m.bookingCodeName);
  const others = converterBookmakers().filter((x) => x.slug !== b.slug && x.markets.some((m) => markets.some((bm) => bm.country === m.country)));
  const primary = markets[0];

  return (
    <>
      <PageHero
        breadcrumbs={[
          { name: "Booking codes", path: "/booking-codes" },
          { name: b.name, path: `/booking-codes/${b.slug}` },
        ]}
        eyebrow={markets.map((m) => `${countryByCode(m.country)!.flag} ${countryByCode(m.country)!.name}`).join(" · ")}
        title={`${b.name} ${lower}: create, load & convert`}
        intro={
          <p>
            A {b.name} {lower} stores a whole betslip — every match, market and pick — in one short code. Share it with friends, load a tipster&apos;s slip in seconds, or convert it to another bookmaker with our free tool.
          </p>
        }
      />
      <div className="container-page space-y-12 py-10">
        <section className="grid gap-6 md:grid-cols-2">
          <div className="card p-6">
            <h2 className="text-xl font-bold">How to create a {b.name} {lower}</h2>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5">
              {code.howToCreate.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </div>
          <div className="card p-6">
            <h2 className="text-xl font-bold">How to load a {b.name} {lower}</h2>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5">
              {code.howToLoad.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </div>
        </section>

        <section>
          <SectionHeader title={`Convert a ${b.name} ${lower}`} sub={`Move a ${b.name} slip to another bookmaker, or bring another bookmaker's code to ${b.name}.`} />
          <div className="mt-5 space-y-3">
            <Converter books={converterBookOptions()} defaultFrom={b.slug} defaultTo={others[0]?.slug ?? "bet9ja"} compact />
            <Notice tone="warn">Demo mode: conversions use sample matches and demo codes (starting “DM-”), which only work in this converter.</Notice>
          </div>
          {others.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {others.map((o) => (
                <li key={o.slug} className="flex gap-2">
                  <Link href={`/booking-code-converter/${b.slug}-to-${o.slug}`} className="chip no-underline hover:border-brand-500 hover:no-underline">
                    {b.name} → {o.name}
                  </Link>
                  <Link href={`/booking-code-converter/${o.slug}-to-${b.slug}`} className="chip no-underline hover:border-brand-500 hover:no-underline">
                    {o.name} → {b.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="prose-content">
          <h2>
            {b.name} {lower} not working? Common fixes
          </h2>
          <ul>
            <li>
              <strong>The code has expired.</strong> Codes stop working once the first match on the slip kicks off, or after the bookmaker&apos;s expiry period. Ask for a fresh code.
            </li>
            <li>
              <strong>Wrong country site.</strong> {b.name} runs separate sites per country{markets.length > 1 ? ` (${markets.map((m) => countryByCode(m.country)!.name).join(", ")})` : ""}. A code created on one country&apos;s site
              usually won&apos;t load on another.
            </li>
            <li>
              <strong>Typo in the code.</strong> Codes are case-insensitive but easy to mistype — check for 0/O and 1/I mix-ups.
            </li>
            <li>
              <strong>Some selections are missing.</strong> If a match has started or a market has been suspended, it can drop out of the loaded slip. Check the number of selections before you bet.
            </li>
            <li>
              <strong>It&apos;s a code for a different bookmaker.</strong> Use our <Link href="/booking-code-converter">converter</Link> to rebuild it on {b.name}.
            </li>
          </ul>
          <h2>Are paid {b.name} booking codes worth it?</h2>
          <p>
            No code can guarantee a win. Sellers of &ldquo;sure&rdquo; or &ldquo;fixed&rdquo; codes are running scams — see our guide to <Link href="/guides/betting-scams-to-avoid">betting scams to avoid</Link>. Treat any shared code as
            someone else&apos;s opinion and only stake what you can afford to lose.
          </p>
          <p>
            Want the full picture on {b.name}? Read our <Link href={`/bookmakers/${b.slug}`}>{b.name} review</Link> or learn <Link href="/guides/what-is-a-booking-code">how booking codes work</Link>.
          </p>
        </section>

        <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="font-bold">Don&apos;t have a {b.name} account?</p>
            <p className="text-sm text-ink-700">
              {countryByCode(primary.country)!.flag} {primary.welcome.headline}. 18+ T&amp;Cs apply.
            </p>
          </div>
          <VisitButton b={b} country={primary.country} />
        </div>

        <FaqSection
          faqs={[
            { q: `What is a ${b.name} ${lower}?`, a: `It's a short code that saves a ${b.name} betslip. Anyone who enters it on ${b.name} gets the same selections loaded into their betslip, ready to stake.` },
            { q: `How long does a ${b.name} ${lower} last?`, a: "Until the first match on the slip starts, or until the bookmaker's expiry period ends — whichever comes first." },
            { q: `Can I edit a ${b.name} slip after loading a code?`, a: "Yes. Once loaded, the selections are a normal betslip — you can remove legs, add games or change your stake before placing the bet." },
            { q: `Can I use a ${b.name} code on another bookmaker?`, a: `Not directly, but you can convert it. Our booking code converter matches each game and market on the other bookmaker and creates an equivalent slip.` },
          ]}
        />
      </div>
    </>
  );
}
