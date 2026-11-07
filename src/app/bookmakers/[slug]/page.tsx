import Link from "next/link";
import { notFound } from "next/navigation";
import { bookmakerBySlug, bookmakers, bookmakersInCountry, overallRating, RATING_WEIGHTS } from "@/data/bookmakers";
import { countryByCode } from "@/data/countries";
import { BookmakerCard, FEATURE_LABELS, VisitButton } from "@/components/bookmakers";
import { BookmakerBadge, Breadcrumbs, Check, FaqSection, Notice, RatingBar, ScoreBadge, SectionHeader, TermsNote } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { monthYear, pageMetadata, reviewLd } from "@/lib/seo";
import { converterBookmakers } from "@/lib/converter";
import type { FeatureKey, Faq } from "@/lib/types";

/** Re-render daily so "updated" dates and years stay current. */
export const revalidate = 86400;

export function generateStaticParams() {
  return bookmakers.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const b = bookmakerBySlug(slug);
  if (!b) return {};
  const where = b.markets.map((m) => countryByCode(m.country)!.name);
  return pageMetadata({
    title: `${b.name} Review ${new Date().getFullYear()}: Bonus, Odds, App & Features`,
    description: `${b.name} review: rated ${overallRating(b).toFixed(1)}/10. Welcome offer, odds margins, payment methods${b.features.bookingCode ? ", booking codes" : ""} and app — available in ${where.slice(0, 4).join(", ")}${where.length > 4 ? " and more" : ""}.`,
    path: `/bookmakers/${b.slug}`,
  });
}

const RATING_LABELS: Record<keyof typeof RATING_WEIGHTS, string> = {
  odds: "Odds value",
  markets: "Markets & coverage",
  bonuses: "Bonuses & promotions",
  app: "App & website",
  payments: "Payments & payouts",
  support: "Support & trust",
};

const ALL_FEATURES = Object.keys(FEATURE_LABELS) as FeatureKey[];

export default async function BookmakerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const b = bookmakerBySlug(slug);
  if (!b) notFound();
  const rating = overallRating(b);
  const primary = b.markets[0];
  const primaryCountry = countryByCode(primary.country)!;
  const rivals = bookmakersInCountry(primary.country).filter((x) => x.slug !== b.slug);
  const convertible = converterBookmakers().some((x) => x.slug === b.slug);
  const codePartners = convertible ? converterBookmakers().filter((x) => x.slug !== b.slug && x.markets.some((m) => b.markets.some((bm) => bm.country === m.country))) : [];
  const marginPct = (b.typicalMargin * 100).toFixed(1);
  const avgMargin = rivals.length ? (rivals.reduce((s, r) => s + r.typicalMargin, 0) / rivals.length) * 100 : b.typicalMargin * 100;
  const countryNames = b.markets.map((m) => countryByCode(m.country)!.name);

  const faqs: Faq[] = [
    { q: `Is ${b.name} legit and licensed?`, a: `${b.name} holds licences in the markets we list: ${b.markets.map((m) => `${countryByCode(m.country)!.name} (${m.licence.replace(/^Licensed by /, "")})`).join("; ")}. Only bet with ${b.name} where it is licensed for your country.` },
    { q: `What is the ${b.name} welcome bonus?`, a: `In ${primaryCountry.name}, the current offer is: ${primary.welcome.headline}. ${primary.welcome.details} Offers differ by country and change regularly, so check the terms on the ${b.name} website before you sign up.` },
    { q: `Does ${b.name} have an app?`, a: b.features.iosApp || b.features.androidApp ? `Yes. ${b.name} offers ${[b.features.androidApp && "an Android app", b.features.iosApp && "an iOS app"].filter(Boolean).join(" and ")}${b.features.liteSite ? ", plus a data-light mobile site" : ""}.` : `${b.name} is mainly used through its mobile website.` },
    { q: `How good are ${b.name}'s odds?`, a: `On major football 1X2 markets ${b.name}'s margin is typically around ${marginPct}%, compared with an average of about ${avgMargin.toFixed(1)}% among its competitors in ${primaryCountry.name}. Lower margins mean better odds — compare live prices on our odds pages.` },
  ];
  if (b.bookingCode) {
    faqs.push({ q: `How do I load a ${b.name} ${b.bookingCode.name.toLowerCase()}?`, a: b.bookingCode.howToLoad.join(" ") });
    faqs.push({ q: `Can I convert a ${b.name} code to another bookmaker?`, a: `Yes. Use our booking code converter: choose ${b.name} as the source, pick the target bookmaker, paste the code and we'll rebuild the slip with matching selections where available.` });
  }

  return (
    <>
      <section className="border-b border-line bg-white">
        <div className="container-page py-8">
          <Breadcrumbs
            items={[
              { name: "Bookmakers", path: "/bookmakers" },
              { name: b.name, path: `/bookmakers/${b.slug}` },
            ]}
          />
          <div className="mt-5 grid grid-cols-[auto_1fr] items-center gap-4 md:grid-cols-[auto_1fr_auto] md:gap-6">
            <div className="self-start pt-6 md:self-center md:pt-0">
              <span className="md:hidden">
                <BookmakerBadge name={b.name} size={48} />
              </span>
              <span className="hidden md:block">
                <BookmakerBadge name={b.name} size={80} />
              </span>
            </div>
            <div>
              <p className="eyebrow">Review · Updated {monthYear()}</p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{b.name} review</h1>
              <p className="mt-1 text-lg text-ink-700">{b.tagline}</p>
              <p className="mt-2 flex flex-wrap gap-1.5">
                {b.markets.map((m) => {
                  const c = countryByCode(m.country)!;
                  return (
                    <Link key={m.country} href={`/betting-sites/${c.slug}`} className="chip no-underline hover:border-brand-500 hover:no-underline">
                      {c.flag} {c.name}
                    </Link>
                  );
                })}
              </p>
            </div>
            <div className="col-span-2 flex items-center gap-4 md:col-span-1 md:flex-col md:items-end">
              <ScoreBadge score={rating} size="lg" />
              <VisitButton b={b} country={primary.country} />
            </div>
          </div>
        </div>
      </section>

      <div className="container-page grid gap-10 py-10 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-12">
          <section className="prose-content">
            <h2>Our verdict</h2>
            <p>{b.summary}</p>
            <p>
              {b.name} {b.owner ? `is operated by ${b.owner}${b.founded ? ` and has been around since ${b.founded}` : ""}. It ` : b.founded ? `launched in ${b.founded} and ` : ""}
              is available in {countryNames.length === 1 ? countryNames[0] : `${countryNames.slice(0, -1).join(", ")} and ${countryNames.at(-1)}`}. We rate it <strong>{rating.toFixed(1)}/10</strong> overall, with its strongest scores for{" "}
              {(Object.keys(b.ratings) as (keyof typeof b.ratings)[])
                .sort((x, y) => b.ratings[y] - b.ratings[x])
                .slice(0, 2)
                .map((k) => RATING_LABELS[k].toLowerCase())
                .join(" and ")}
              .
            </p>
            <p>
              Odds-wise, {b.name}&apos;s typical margin on top-flight football match result markets is around <strong>{marginPct}%</strong>
              {rivals.length ? `, ${b.typicalMargin * 100 < avgMargin ? "better than" : b.typicalMargin * 100 > avgMargin + 0.3 ? "a little higher than" : "in line with"} the ${avgMargin.toFixed(1)}% average among the ${rivals.length} other bookmakers we track in ${primaryCountry.name}` : ""}. Popular sports include {b.sports.slice(0, 5).join(", ")}.
            </p>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="card p-5">
              <h2 className="font-bold text-brand-700">Pros</h2>
              <ul className="mt-2 space-y-1.5 text-sm">
                {b.pros.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span className="text-brand-600">✓</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card p-5">
              <h2 className="font-bold text-red-700">Cons</h2>
              <ul className="mt-2 space-y-1.5 text-sm">
                {b.cons.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span className="text-red-600">✕</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <SectionHeader title={`${b.name} welcome offers by country`} />
            <div className="card mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface text-left">
                    <th className="px-4 py-3 font-semibold">Country</th>
                    <th className="px-4 py-3 font-semibold">Offer</th>
                    <th className="px-4 py-3 font-semibold">Licence</th>
                    <th className="px-4 py-3">
                      <span className="sr-only">Visit</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {b.markets.map((m) => {
                    const c = countryByCode(m.country)!;
                    return (
                      <tr key={m.country} className="border-b border-line align-top last:border-0">
                        <td className="px-4 py-3 font-semibold whitespace-nowrap">
                          {c.flag} {c.name}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold">{m.welcome.headline}</p>
                          <p className="text-ink-700">{m.welcome.details}</p>
                          {m.otherPromos?.map((p) => (
                            <p key={p.headline} className="mt-1 text-ink-700">
                              + {p.headline}
                            </p>
                          ))}
                        </td>
                        <td className="px-4 py-3 text-ink-700">{m.licence}</td>
                        <td className="px-4 py-3">
                          <VisitButton b={b} country={m.country} className="btn-ghost py-1.5 whitespace-nowrap" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <TermsNote className="mt-2" />
          </section>

          <section>
            <SectionHeader title="Features" />
            <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {ALL_FEATURES.map((f) => (
                <li key={f} className={`flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm ${b.features[f] ? "border-brand-200 bg-white" : "border-line bg-surface text-muted"}`}>
                  {FEATURE_LABELS[f]}
                  <Check ok={b.features[f]} />
                </li>
              ))}
            </ul>
          </section>

          {b.bookingCode && (
            <section className="prose-content">
              <h2>
                How to use {b.name} {b.bookingCode.name.toLowerCase()}s
              </h2>
              <p>
                {b.name} lets you save a betslip as a {b.bookingCode.name.toLowerCase()} that anyone can load. It&apos;s the easiest way to share a tip or copy an accumulator from a friend. See our full{" "}
                <Link href={`/booking-codes/${b.slug}`}>
                  {b.name} {b.bookingCode.name.toLowerCase()} guide
                </Link>
                .
              </p>
              <h3>Create a {b.bookingCode.name.toLowerCase()}</h3>
              <ol>
                {b.bookingCode.howToCreate.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
              <h3>Load a {b.bookingCode.name.toLowerCase()}</h3>
              <ol>
                {b.bookingCode.howToLoad.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
              {codePartners.length > 0 && (
                <>
                  <h3>Convert {b.name} codes</h3>
                  <p>Have a code from another bookmaker? Convert it to {b.name}, or move a {b.name} code elsewhere:</p>
                  <ul>
                    {codePartners.slice(0, 6).map((p) => (
                      <li key={p.slug}>
                        <Link href={`/booking-code-converter/${p.slug}-to-${b.slug}`}>
                          {p.name} to {b.name}
                        </Link>{" "}
                        ·{" "}
                        <Link href={`/booking-code-converter/${b.slug}-to-${p.slug}`}>
                          {b.name} to {p.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          )}

          <section>
            <SectionHeader title="Popular payment methods" sub="Typical options — check the cashier for the full, current list." />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {b.markets.map((m) => {
                const c = countryByCode(m.country)!;
                return (
                  <div key={m.country} className="card p-4">
                    <p className="font-semibold">
                      {c.flag} {c.name}
                    </p>
                    <p className="mt-1 text-sm text-ink-700">{m.payments.join(" · ")}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {rivals.length > 0 && (
            <section>
              <SectionHeader title={`${b.name} alternatives in ${primaryCountry.name}`} href={`/betting-sites/${primaryCountry.slug}`} linkLabel={`All ${primaryCountry.name} sites`} />
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {rivals.slice(0, 3).map((r) => (
                  <BookmakerCard key={r.slug} b={r} country={primary.country} />
                ))}
              </div>
              <ul className="mt-4 flex flex-wrap gap-2">
                {rivals.slice(0, 6).map((r) => (
                  <li key={r.slug}>
                    <Link href={`/compare/${[b.slug, r.slug].sort().join("-vs-")}`} className="chip no-underline hover:border-brand-500 hover:no-underline">
                      {b.name} vs {r.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <FaqSection faqs={faqs} />
        </div>

        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Rating breakdown</h2>
              <ScoreBadge score={rating} size="sm" />
            </div>
            <div className="mt-4 space-y-3">
              {(Object.keys(RATING_LABELS) as (keyof typeof RATING_LABELS)[]).map((k) => (
                <RatingBar key={k} label={RATING_LABELS[k]} value={b.ratings[k]} />
              ))}
            </div>
            <p className="mt-4 text-xs text-muted">
              Weighted score. <Link href="/methodology">How we rate bookmakers</Link>
            </p>
          </div>
          <div className="card p-5">
            <p className="text-xs font-semibold text-muted uppercase">
              {primaryCountry.flag} {primaryCountry.name} offer
            </p>
            <p className="mt-1 text-lg font-extrabold">{primary.welcome.headline}</p>
            <VisitButton b={b} country={primary.country} className="btn-primary mt-3 w-full" />
            <TermsNote className="mt-2" />
          </div>
          <Notice>Last reviewed {b.lastReviewed}. Spotted something out of date? <Link href="/contact">Let us know</Link>.</Notice>
        </aside>
      </div>
      <JsonLd data={reviewLd({ name: b.name, url: primary.url, rating, summary: b.summary, path: `/bookmakers/${b.slug}`, dateModified: `${b.lastReviewed}-01` })} />
    </>
  );
}
