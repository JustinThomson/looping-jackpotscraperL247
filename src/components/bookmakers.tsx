import Link from "next/link";
import { marketFor, overallRating } from "@/data/bookmakers";
import { countryByCode } from "@/data/countries";
import type { Bookmaker, CountryCode, FeatureKey } from "@/lib/types";
import { BookmakerBadge, Check, ScoreBadge, TermsNote } from "./ui";

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  liveBetting: "Live betting",
  liveStreaming: "Live streaming",
  cashOut: "Cash out",
  betBuilder: "Bet builder",
  bookingCode: "Booking codes",
  editBet: "Edit bet",
  accaBoost: "Acca bonus / boost",
  earlyPayout: "Early payout",
  mobileMoney: "Mobile money",
  virtuals: "Virtual sports",
  iosApp: "iOS app",
  androidApp: "Android app",
  liteSite: "Data-light site",
  exchange: "Betting exchange",
  jackpots: "Jackpots",
};

export const KEY_FEATURES: FeatureKey[] = ["liveBetting", "liveStreaming", "cashOut", "betBuilder", "bookingCode", "accaBoost", "mobileMoney", "iosApp", "androidApp"];

export function outboundHref(slug: string, country?: CountryCode) {
  return `/go/${slug}${country ? `?c=${country}` : ""}`;
}

export function VisitButton({ b, country, className = "btn-primary" }: { b: Bookmaker; country?: CountryCode; className?: string }) {
  return (
    <a href={outboundHref(b.slug, country)} rel="sponsored nofollow noopener" target="_blank" className={className}>
      Visit {b.name}
    </a>
  );
}

export function FeaturePills({ b, limit = 4 }: { b: Bookmaker; limit?: number }) {
  const on = KEY_FEATURES.filter((f) => b.features[f]).slice(0, limit);
  return (
    <ul className="flex flex-wrap gap-1.5">
      {on.map((f) => (
        <li key={f} className="chip">
          {FEATURE_LABELS[f]}
        </li>
      ))}
    </ul>
  );
}

/** Ranked list of bookmakers for a country. */
export function RankingList({ items, country }: { items: Bookmaker[]; country: CountryCode }) {
  return (
    <ol className="space-y-3">
      {items.map((b, i) => {
        const m = marketFor(b, country);
        return (
          <li key={b.slug} className="card p-4 sm:p-5">
            <div className="grid items-center gap-4 sm:grid-cols-[auto_auto_1fr_auto]">
              <span className="tabular hidden h-8 w-8 items-center justify-center rounded-full bg-surface text-sm font-bold text-ink-700 sm:inline-flex">{i + 1}</span>
              <div className="flex items-center gap-3 sm:block">
                <BookmakerBadge name={b.name} size={52} />
                <div className="sm:hidden">
                  <p className="text-lg font-bold">
                    {i + 1}. {b.name}
                  </p>
                  <p className="text-sm text-muted">{b.tagline}</p>
                </div>
              </div>
              <div className="min-w-0">
                <div className="hidden items-baseline gap-2 sm:flex">
                  <h3 className="text-lg font-bold">{b.name}</h3>
                  <span className="text-sm text-muted">{b.tagline}</span>
                </div>
                {m && (
                  <p className="mt-1 text-sm">
                    <span className="mr-1.5 rounded bg-gold-100 px-1.5 py-0.5 text-xs font-bold text-gold-700 uppercase">Offer</span>
                    <span className="font-semibold">{m.welcome.headline}</span>
                  </p>
                )}
                <div className="mt-2">
                  <FeaturePills b={b} />
                </div>
              </div>
              <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                <ScoreBadge score={overallRating(b)} />
                <div className="flex flex-1 flex-col gap-1.5 sm:flex-none">
                  <VisitButton b={b} country={country} className="btn-primary w-full whitespace-nowrap" />
                  <Link href={`/bookmakers/${b.slug}`} className="text-center text-sm font-semibold">
                    Read review
                  </Link>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Compact grid card. */
export function BookmakerCard({ b, country }: { b: Bookmaker; country?: CountryCode }) {
  const m = country ? marketFor(b, country) : b.markets[0];
  const c = m && countryByCode(m.country);
  return (
    <article className="card flex flex-col p-5">
      <div className="flex items-start gap-3">
        <BookmakerBadge name={b.name} />
        <div className="min-w-0 flex-1">
          <h3 className="font-bold">
            <Link href={`/bookmakers/${b.slug}`} className="text-ink-900">
              {b.name}
            </Link>
          </h3>
          <p className="text-sm text-muted">{b.tagline}</p>
        </div>
        <ScoreBadge score={overallRating(b)} size="sm" />
      </div>
      {m && (
        <div className="mt-4 rounded-xl bg-surface p-3">
          <p className="text-xs font-semibold text-muted uppercase">
            Welcome offer {c ? `· ${c.flag} ${c.name}` : ""}
          </p>
          <p className="mt-0.5 font-semibold">{m.welcome.headline}</p>
        </div>
      )}
      <div className="mt-3 flex-1">
        <FeaturePills b={b} limit={3} />
      </div>
      <div className="mt-4 flex gap-2">
        <VisitButton b={b} country={m?.country} className="btn-primary flex-1" />
        <Link href={`/bookmakers/${b.slug}`} className="btn-ghost">
          Review
        </Link>
      </div>
    </article>
  );
}

/** Feature comparison table for several bookmakers. */
export function FeatureTable({ items, features = KEY_FEATURES }: { items: Bookmaker[]; features?: FeatureKey[] }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-line bg-surface text-left">
            <th className="px-4 py-3 font-semibold">Bookmaker</th>
            <th className="px-3 py-3 text-center font-semibold">Rating</th>
            {features.map((f) => (
              <th key={f} className="px-3 py-3 text-center text-xs font-semibold">
                {FEATURE_LABELS[f]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((b) => (
            <tr key={b.slug} className="border-b border-line last:border-0">
              <td className="px-4 py-3 font-semibold whitespace-nowrap">
                <Link href={`/bookmakers/${b.slug}`} className="text-ink-900">
                  {b.name}
                </Link>
              </td>
              <td className="tabular px-3 py-3 text-center font-bold">{overallRating(b).toFixed(1)}</td>
              {features.map((f) => (
                <td key={f} className="px-3 py-3 text-center">
                  <Check ok={b.features[f]} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function OfferCard({ b, country }: { b: Bookmaker; country: CountryCode }) {
  const m = marketFor(b, country);
  if (!m) return null;
  const c = countryByCode(country)!;
  return (
    <article className="card flex flex-col p-5">
      <div className="flex items-center gap-3">
        <BookmakerBadge name={b.name} size={40} />
        <div>
          <h3 className="font-bold">{b.name}</h3>
          <p className="text-xs text-muted">
            {c.flag} {c.name}
          </p>
        </div>
      </div>
      <p className="mt-4 text-lg leading-snug font-extrabold text-ink-900">{m.welcome.headline}</p>
      <p className="mt-1.5 flex-1 text-sm text-ink-700">{m.welcome.details}</p>
      {m.otherPromos?.length ? (
        <ul className="mt-3 space-y-1 text-sm">
          {m.otherPromos.map((p) => (
            <li key={p.headline}>
              <span className="font-semibold">+ {p.headline}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-4 flex gap-2">
        <VisitButton b={b} country={country} className="btn-primary flex-1" />
        <Link href={`/bookmakers/${b.slug}`} className="btn-ghost">
          Review
        </Link>
      </div>
      <TermsNote className="mt-3" />
    </article>
  );
}
