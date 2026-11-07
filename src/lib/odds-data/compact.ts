import { bookmakers } from "@/data/bookmakers";
import { regions } from "@/data/countries";
import type { CountryCode, Fixture, MarketKey, PickKey, RegionKey } from "@/lib/types";
import { mainMarket, picksFor } from "./index";

/** Compact, serialisable odds payloads for client components. */

export interface BoardRow {
  id: string;
  home: string;
  away: string;
  kickoff: string;
  league: string;
  market: MarketKey;
  picks: PickKey[];
  /** bookmaker slug -> odds per pick (0 when missing) */
  books: Record<string, number[]>;
}

export interface BookMeta {
  names: Record<string, string>;
  countries: Record<string, CountryCode[]>;
  regions: Record<RegionKey, CountryCode[]>;
  bookingCode: string[];
}

export function toBoardRow(f: Fixture): BoardRow {
  const market = mainMarket(f);
  const picks = picksFor(market);
  const books: Record<string, number[]> = {};
  for (const b of f.books) {
    const m = b.markets.find((x) => x.market === market);
    if (!m) continue;
    books[b.bookmaker] = picks.map((p) => m.prices.find((x) => x.pick === p)?.odds ?? 0);
  }
  return { id: f.id, home: f.home, away: f.away, kickoff: f.kickoff, league: f.league, market, picks, books };
}

export interface MatchMarketData {
  market: MarketKey;
  line?: number;
  picks: PickKey[];
  books: Record<string, number[]>;
}

export function toMatchData(f: Fixture): MatchMarketData[] {
  const order: MarketKey[] = ["1x2", "moneyline", "double_chance", "draw_no_bet", "over_under", "btts"];
  const out: MatchMarketData[] = [];
  for (const market of order) {
    const picks = picksFor(market);
    const books: Record<string, number[]> = {};
    let line: number | undefined;
    for (const b of f.books) {
      const m = b.markets.find((x) => x.market === market);
      if (!m) continue;
      line ??= m.line;
      if (m.line !== line) continue;
      books[b.bookmaker] = picks.map((p) => m.prices.find((x) => x.pick === p)?.odds ?? 0);
    }
    if (Object.keys(books).length) out.push({ market, line, picks, books });
  }
  return out;
}

export function bookMeta(): BookMeta {
  return {
    names: Object.fromEntries(bookmakers.map((b) => [b.slug, b.name])),
    countries: Object.fromEntries(bookmakers.map((b) => [b.slug, b.markets.map((m) => m.country)])),
    regions: Object.fromEntries(regions.map((r) => [r.key, r.countries])) as Record<RegionKey, CountryCode[]>,
    bookingCode: bookmakers.filter((b) => b.features.bookingCode && b.markets.some((m) => m.bookingCodeName)).map((b) => b.slug),
  };
}
