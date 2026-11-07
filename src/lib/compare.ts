import { bookmakerBySlug, bookmakers } from "@/data/bookmakers";
import type { Bookmaker, CountryCode } from "./types";

/** All head-to-head pairs for bookmakers that share at least one country (slugs sorted alphabetically). */
export function comparePairs(): { a: Bookmaker; b: Bookmaker; slug: string; shared: CountryCode[] }[] {
  const out: { a: Bookmaker; b: Bookmaker; slug: string; shared: CountryCode[] }[] = [];
  const sorted = [...bookmakers].sort((x, y) => x.slug.localeCompare(y.slug));
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i];
      const b = sorted[j];
      const shared = a.markets.map((m) => m.country).filter((c) => b.markets.some((m) => m.country === c));
      if (shared.length) out.push({ a, b, slug: `${a.slug}-vs-${b.slug}`, shared });
    }
  }
  return out;
}

export function parseComparePair(slug: string) {
  const p = comparePairs().find((x) => x.slug === slug);
  if (p) return p;
  return null;
}

export function compareSlug(x: string, y: string) {
  return [x, y].sort().join("-vs-");
}

export { bookmakerBySlug };
