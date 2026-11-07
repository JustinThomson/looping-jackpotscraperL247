import { cache } from "react";
import { leagues, leagueBySlug } from "@/data/leagues";
import { bookmakers, bookmakerBySlug } from "@/data/bookmakers";
import { regions } from "@/data/countries";
import type { CountryCode, Fixture, MarketKey, PickKey, RegionKey } from "@/lib/types";
import { generateSampleFixtures } from "./sample";
import { fetchLeagueOdds, oddsApiEnabled } from "./the-odds-api";
import { marketMargin } from "@/lib/odds";

/**
 * Unified odds access. Live data from The Odds API is used for leagues it
 * covers when a key is configured; everything else falls back to sample data.
 */
export const getAllFixtures = cache(async (): Promise<Fixture[]> => {
  const sample = generateSampleFixtures(new Date());
  if (!oddsApiEnabled()) return sample;
  const live = await Promise.all(leagues.map(async (l) => [l.slug, await fetchLeagueOdds(l)] as const));
  const liveBy = new Map(live.filter(([, f]) => f && f.length).map(([k, f]) => [k, f!]));
  const merged = [...sample.filter((f) => !liveBy.has(f.league)), ...[...liveBy.values()].flat()];
  return merged.sort((a, b) => a.kickoff.localeCompare(b.kickoff));
});

export async function getLeagueFixtures(slug: string): Promise<Fixture[]> {
  return (await getAllFixtures()).filter((f) => f.league === slug);
}

export async function getFixture(id: string): Promise<Fixture | undefined> {
  return (await getAllFixtures()).find((f) => f.id === id);
}

export function regionCountries(region: RegionKey): CountryCode[] {
  return regions.find((r) => r.key === region)?.countries ?? [];
}

/** Bookmaker slugs operating in a region or single country. */
export function bookmakersForScope(scope: RegionKey | CountryCode | "all"): Set<string> {
  if (scope === "all") return new Set(bookmakers.map((b) => b.slug));
  const codes: CountryCode[] = regions.some((r) => r.key === scope) ? regionCountries(scope as RegionKey) : [scope as CountryCode];
  return new Set(bookmakers.filter((b) => b.markets.some((m) => codes.includes(m.country))).map((b) => b.slug));
}

export function filterFixtureBooks(f: Fixture, allowed: Set<string>): Fixture {
  return { ...f, books: f.books.filter((b) => allowed.has(b.bookmaker)) };
}

export interface BestPrice {
  pick: PickKey;
  odds: number;
  bookmaker: string;
}

export function mainMarket(f: Fixture): MarketKey {
  return f.books.some((b) => b.markets.some((m) => m.market === "1x2")) ? "1x2" : "moneyline";
}

export function picksFor(market: MarketKey): PickKey[] {
  switch (market) {
    case "1x2":
      return ["home", "draw", "away"];
    case "moneyline":
    case "draw_no_bet":
      return ["home", "away"];
    case "double_chance":
      return ["1x", "12", "x2"];
    case "over_under":
      return ["over", "under"];
    case "btts":
      return ["yes", "no"];
  }
}

export function bestPrices(f: Fixture, market: MarketKey): BestPrice[] {
  return picksFor(market)
    .map((pick) => {
      let best: BestPrice | null = null;
      for (const b of f.books) {
        const m = b.markets.find((x) => x.market === market);
        const p = m?.prices.find((x) => x.pick === pick);
        if (p && (!best || p.odds > best.odds)) best = { pick, odds: p.odds, bookmaker: b.bookmaker };
      }
      return best;
    })
    .filter((x): x is BestPrice => x !== null);
}

/** Margin of the "best odds" synthetic book across bookmakers. */
export function bestMarketMargin(f: Fixture, market: MarketKey): number {
  const best = bestPrices(f, market);
  return best.length === picksFor(market).length ? marketMargin(best.map((b) => b.odds)) : NaN;
}

export function bookMargin(f: Fixture, bookmaker: string, market: MarketKey): number {
  const m = f.books.find((b) => b.bookmaker === bookmaker)?.markets.find((x) => x.market === market);
  if (!m || m.prices.length !== picksFor(market).length) return NaN;
  return marketMargin(m.prices.map((p) => p.odds));
}

export function oddsSourceLabel(f: Fixture): string {
  return f.source === "the-odds-api" ? "Live odds via The Odds API" : "Sample odds (demo data)";
}

export function leagueName(slug: string): string {
  return leagueBySlug(slug)?.name ?? slug;
}

export function bookmakerName(slug: string): string {
  return bookmakerBySlug(slug)?.name ?? slug;
}

export const MARKET_LABELS: Record<MarketKey, string> = {
  "1x2": "Match result (1X2)",
  moneyline: "Moneyline",
  double_chance: "Double chance",
  draw_no_bet: "Draw no bet",
  over_under: "Over/Under",
  btts: "Both teams to score",
};

export function pickLabel(pick: PickKey, f?: { home: string; away: string }, line?: number): string {
  switch (pick) {
    case "home":
      return f ? f.home : "Home";
    case "away":
      return f ? f.away : "Away";
    case "draw":
      return "Draw";
    case "1x":
      return "Home or draw (1X)";
    case "12":
      return "Home or away (12)";
    case "x2":
      return "Draw or away (X2)";
    case "over":
      return line !== undefined ? `Over ${line}` : "Over";
    case "under":
      return line !== undefined ? `Under ${line}` : "Under";
    case "yes":
      return "Yes";
    case "no":
      return "No";
  }
}

export const PICK_SHORT: Record<PickKey, string> = {
  home: "1",
  draw: "X",
  away: "2",
  "1x": "1X",
  "12": "12",
  x2: "X2",
  over: "Over",
  under: "Under",
  yes: "Yes",
  no: "No",
};
