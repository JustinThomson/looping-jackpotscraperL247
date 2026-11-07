import Link from "next/link";
import { notFound } from "next/navigation";
import { marketFor, overallRating, RATING_WEIGHTS } from "@/data/bookmakers";
import { countryByCode } from "@/data/countries";
import { FEATURE_LABELS, VisitButton } from "@/components/bookmakers";
import { BookmakerBadge, Check, FaqSection, PageHero, ScoreBadge, SectionHeader, TermsNote } from "@/components/ui";
import { comparePairs, parseComparePair } from "@/lib/compare";
import { pageMetadata } from "@/lib/seo";
import type { Bookmaker, FeatureKey } from "@/lib/types";

/** Re-render daily so "updated" dates and years stay current. */
export const revalidate = 86400;

export function generateStaticParams() {
  return comparePairs().map((p) => ({ pair: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ pair: string }> }) {
  const { pair } = await params;
  const p = parseComparePair(pair);
  if (!p) return {};
  const c = countryByCode(p.shared[0])!;
  return pageMetadata({
    title: `${p.a.name} vs ${p.b.name} (${new Date().getFullYear()}): Which Is Better in ${c.name}?`,
    description: `${p.a.name} vs ${p.b.name} compared: ratings, odds margins, welcome bonuses, features${p.a.features.bookingCode || p.b.features.bookingCode ? ", booking codes" : ""} and payment methods side by side.`,
    path: `/compare/${pair}`,
  });
}

const LABELS: Record<keyof typeof RATING_WEIGHTS, string> = { odds: "Odds", markets: "Markets", bonuses: "Bonuses", app: "App", payments: "Payments", support: "Support" };
const FEATURES = Object.keys(FEATURE_LABELS) as FeatureKey[];

function winner(a: Bookmaker, b: Bookmaker, f: (x: Bookmaker) => number) {
  const fa = f(a);
  const fb = f(b);
  return fa === fb ? null : fa > fb ? a : b;
}

export default async function ComparePage({ params }: { params: Promise<{ pair: string }> }) {
  const { pair } = await params;
  const p = parseComparePair(pair);
  if (!p) notFound();
  const { a, b, shared } = p;
  const country = countryByCode(shared[0])!;
  const ra = overallRating(a);
  const rb = overallRating(b);
  const overall = ra === rb ? null : ra > rb ? a : b;
  const oddsWinner = winner(a, b, (x) => -x.typicalMargin);
  const keys = Object.keys(LABELS) as (keyof typeof LABELS)[];
  const wins = (x: Bookmaker, y: Bookmaker) => keys.filter((k) => x.ratings[k] > y.ratings[k]).length;

  return (
    <>
      <PageHero
        breadcrumbs={[
          { name: "Compare", path: "/compare" },
          { name: `${a.name} vs ${b.name}`, path: `/compare/${pair}` },
        ]}
        eyebrow={`Head to head · ${shared.map((c) => countryByCode(c)!.flag).join(" ")}`}
        title={`${a.name} vs ${b.name}`}
        intro={
          <p>
            {overall
              ? `${overall.name} edges it overall (${Math.max(ra, rb).toFixed(1)} vs ${Math.min(ra, rb).toFixed(1)}), winning ${wins(overall, overall === a ? b : a)} of our ${keys.length} rating categories.`
              : `It's a dead heat overall at ${ra.toFixed(1)}/10.`}{" "}
            {oddsWinner && `${oddsWinner.name} typically offers better odds.`} Both are licensed in {shared.map((c) => countryByCode(c)!.name).join(", ")}.
          </p>
        }
      />
      <div className="container-page space-y-12 py-10">
        <section className="grid gap-4 md:grid-cols-2">
          {[a, b].map((x) => {
            const m = marketFor(x, country.code)!;
            return (
              <div key={x.slug} className={`card p-6 ${overall?.slug === x.slug ? "ring-2 ring-brand-500" : ""}`}>
                <div className="flex items-center gap-3">
                  <BookmakerBadge name={x.name} size={56} />
                  <div className="flex-1">
                    <h2 className="text-xl font-bold">{x.name}</h2>
                    <p className="text-sm text-muted">{x.tagline}</p>
                  </div>
                  <ScoreBadge score={overallRating(x)} />
                </div>
                <p className="mt-4 text-xs font-semibold text-muted uppercase">
                  {country.flag} Welcome offer
                </p>
                <p className="font-bold">{m.welcome.headline}</p>
                <div className="mt-4 flex gap-2">
                  <VisitButton b={x} country={country.code} className="btn-primary flex-1" />
                  <Link href={`/bookmakers/${x.slug}`} className="btn-ghost">
                    Review
                  </Link>
                </div>
              </div>
            );
          })}
        </section>
        <TermsNote />

        <section>
          <SectionHeader title="Ratings compared" />
          <div className="card mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-line bg-surface text-left">
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 text-center font-semibold">{a.name}</th>
                  <th className="px-4 py-3 text-center font-semibold">{b.name}</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k} className="border-b border-line last:border-0">
                    <td className="px-4 py-2.5">{LABELS[k]}</td>
                    {[a, b].map((x) => {
                      const other = x === a ? b : a;
                      return (
                        <td key={x.slug} className={`tabular px-4 py-2.5 text-center ${x.ratings[k] > other.ratings[k] ? "font-bold text-brand-700" : ""}`}>
                          {x.ratings[k].toFixed(1)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr className="border-b border-line">
                  <td className="px-4 py-2.5">Typical football margin</td>
                  {[a, b].map((x) => (
                    <td key={x.slug} className={`tabular px-4 py-2.5 text-center ${oddsWinner?.slug === x.slug ? "font-bold text-brand-700" : ""}`}>
                      {(x.typicalMargin * 100).toFixed(1)}%
                    </td>
                  ))}
                </tr>
                <tr className="bg-surface font-bold">
                  <td className="px-4 py-3">Overall</td>
                  <td className="tabular px-4 py-3 text-center">{ra.toFixed(1)}</td>
                  <td className="tabular px-4 py-3 text-center">{rb.toFixed(1)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <SectionHeader title="Features compared" />
          <div className="card mt-4 overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b border-line bg-surface text-left">
                  <th className="px-4 py-3 font-semibold">Feature</th>
                  <th className="px-4 py-3 text-center font-semibold">{a.name}</th>
                  <th className="px-4 py-3 text-center font-semibold">{b.name}</th>
                </tr>
              </thead>
              <tbody>
                {FEATURES.filter((f) => a.features[f] || b.features[f]).map((f) => (
                  <tr key={f} className="border-b border-line last:border-0">
                    <td className="px-4 py-2.5">{FEATURE_LABELS[f]}</td>
                    <td className="px-4 py-2.5 text-center">
                      <Check ok={a.features[f]} />
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <Check ok={b.features[f]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {[a, b].map((x) => (
            <div key={x.slug} className="card p-5">
              <h3 className="font-bold">Why choose {x.name}</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {x.pros.map((pr) => (
                  <li key={pr} className="flex gap-2">
                    <span className="text-brand-600">✓</span>
                    {pr}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs font-semibold text-muted uppercase">Payments in {country.name}</p>
              <p className="text-sm text-ink-700">{marketFor(x, country.code)!.payments.join(" · ")}</p>
            </div>
          ))}
        </section>

        {a.features.bookingCode && b.features.bookingCode && (
          <section className="card bg-ink-900 p-6 text-white">
            <h2 className="text-xl font-bold">
              Switching between {a.name} and {b.name}?
            </h2>
            <p className="mt-1 text-white/80">Convert booking codes in either direction.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/booking-code-converter/${a.slug}-to-${b.slug}`} className="btn-primary">
                {a.name} → {b.name}
              </Link>
              <Link href={`/booking-code-converter/${b.slug}-to-${a.slug}`} className="btn border border-white/20 text-white hover:bg-white/10">
                {b.name} → {a.name}
              </Link>
            </div>
          </section>
        )}

        <FaqSection
          faqs={[
            { q: `Is ${a.name} or ${b.name} better?`, a: overall ? `In our ratings ${overall.name} scores higher overall (${Math.max(ra, rb).toFixed(1)}/10 vs ${Math.min(ra, rb).toFixed(1)}/10). The better choice depends on whether you prioritise odds, bonuses, app quality or payment options.` : `Both score ${ra.toFixed(1)}/10 overall in our ratings — compare individual categories to decide.` },
            { q: `Which has better odds, ${a.name} or ${b.name}?`, a: oddsWinner ? `${oddsWinner.name} typically has the lower margin on football (${(oddsWinner.typicalMargin * 100).toFixed(1)}%), which usually means better odds. Prices vary by match, so check our odds comparison.` : "Both have similar typical margins. Check our odds comparison for specific matches." },
            { q: `Can I have accounts with both ${a.name} and ${b.name}?`, a: "Yes. Having accounts at several licensed bookmakers lets you take the best price on each bet and claim each welcome offer, subject to their terms." },
          ]}
        />
      </div>
    </>
  );
}
