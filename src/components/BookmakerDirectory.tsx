"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CountryCode, FeatureKey } from "@/lib/types";
import { BookmakerBadge, ScoreBadge } from "./ui";

const COUNTRY_NAMES: Record<CountryCode, string> = {
  za: "🇿🇦 South Africa", ng: "🇳🇬 Nigeria", ke: "🇰🇪 Kenya", gh: "🇬🇭 Ghana", ug: "🇺🇬 Uganda", tz: "🇹🇿 Tanzania", us: "🇺🇸 United States",
  gb: "🇬🇧 United Kingdom", ie: "🇮🇪 Ireland", de: "🇩🇪 Germany", es: "🇪🇸 Spain", it: "🇮🇹 Italy", nl: "🇳🇱 Netherlands", se: "🇸🇪 Sweden",
};

const FEATURE_FILTERS: [FeatureKey, string][] = [
  ["bookingCode", "Booking codes"],
  ["liveStreaming", "Live streaming"],
  ["mobileMoney", "Mobile money"],
  ["betBuilder", "Bet builder"],
  ["cashOut", "Cash out"],
  ["accaBoost", "Acca boosts"],
];

export interface DirectoryItem {
  slug: string;
  name: string;
  tagline: string;
  rating: number;
  countries: CountryCode[];
  features: FeatureKey[];
  offer: string;
}

export function BookmakerDirectory({ items }: { items: DirectoryItem[] }) {
  const [country, setCountry] = useState<CountryCode | "">("");
  const [features, setFeatures] = useState<FeatureKey[]>([]);
  const [q, setQ] = useState("");

  const shown = useMemo(
    () =>
      items.filter(
        (b) =>
          (!country || b.countries.includes(country)) &&
          features.every((f) => b.features.includes(f)) &&
          (!q || b.name.toLowerCase().includes(q.toLowerCase())),
      ),
    [items, country, features, q],
  );

  return (
    <div>
      <div className="card flex flex-wrap items-end gap-4 p-4">
        <label className="min-w-48 flex-1">
          <span className="label">Search</span>
          <input className="input" placeholder="Bookmaker name" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <label className="min-w-48">
          <span className="label">Country</span>
          <select className="input" value={country} onChange={(e) => setCountry(e.target.value as CountryCode)}>
            <option value="">All countries</option>
            {Object.entries(COUNTRY_NAMES).map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="flex flex-wrap gap-1.5">
          <legend className="label">Features</legend>
          {FEATURE_FILTERS.map(([f, label]) => {
            const on = features.includes(f);
            return (
              <button
                key={f}
                type="button"
                aria-pressed={on}
                onClick={() => setFeatures(on ? features.filter((x) => x !== f) : [...features, f])}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${on ? "border-ink-900 bg-ink-900 text-white" : "border-line bg-white text-ink-800 hover:bg-surface"}`}
              >
                {label}
              </button>
            );
          })}
        </fieldset>
      </div>
      <p className="mt-4 text-sm text-muted">{shown.length} bookmakers</p>
      <ul className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {shown.map((b) => (
          <li key={b.slug}>
            <Link href={`/bookmakers/${b.slug}`} className="card flex h-full items-start gap-3 p-4 text-ink-900 no-underline hover:border-brand-500 hover:no-underline">
              <BookmakerBadge name={b.name} />
              <div className="min-w-0 flex-1">
                <p className="font-bold">{b.name}</p>
                <p className="line-clamp-1 text-sm text-muted">{b.tagline}</p>
                <p className="mt-1.5 text-xs text-ink-700">{b.countries.map((c) => COUNTRY_NAMES[c].split(" ")[0]).join(" ")}</p>
              </div>
              <ScoreBadge score={b.rating} size="sm" />
            </Link>
          </li>
        ))}
      </ul>
      {shown.length === 0 && <p className="card mt-2 p-6 text-center text-ink-700">No bookmakers match those filters.</p>}
    </div>
  );
}
