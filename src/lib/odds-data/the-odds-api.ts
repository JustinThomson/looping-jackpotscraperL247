import { bookmakers } from "@/data/bookmakers";
import type { BookmakerPrices, Fixture, League, MarketPrices, Price } from "@/lib/types";
import { fixtureId } from "./sample";

/**
 * Live odds from The Odds API (https://the-odds-api.com, v4).
 * Only used when ODDS_API_KEY is set. Responses are cached by Next's fetch cache.
 */

interface OddsApiOutcome {
  name: string;
  price: number;
  point?: number;
}
interface OddsApiMarket {
  key: string;
  last_update?: string;
  outcomes: OddsApiOutcome[];
}
interface OddsApiBookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: OddsApiMarket[];
}
export interface OddsApiEvent {
  id: string;
  sport_key: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: OddsApiBookmaker[];
}

const KEY_TO_SLUG = new Map<string, string>();
for (const b of bookmakers) for (const k of b.oddsApiKeys ?? []) KEY_TO_SLUG.set(k, b.slug);

export function oddsApiEnabled(): boolean {
  return Boolean(process.env.ODDS_API_KEY);
}

/** Map one Odds API event into our Fixture shape. Exported for tests. */
export function mapOddsApiEvent(e: OddsApiEvent, league: League): Fixture {
  const books = new Map<string, BookmakerPrices>();
  for (const bk of e.bookmakers) {
    const slug = KEY_TO_SLUG.get(bk.key);
    if (!slug || books.has(slug)) continue; // first matching key wins (e.g. Betfair sportsbook before exchange)
    const markets: MarketPrices[] = [];
    for (const m of bk.markets) {
      if (m.key === "h2h") {
        const prices: Price[] = [];
        for (const o of m.outcomes) {
          if (o.name === e.home_team) prices.push({ pick: "home", odds: o.price });
          else if (o.name === e.away_team) prices.push({ pick: "away", odds: o.price });
          else if (o.name.toLowerCase() === "draw") prices.push({ pick: "draw", odds: o.price });
        }
        const threeWay = prices.some((p) => p.pick === "draw");
        markets.push({ market: threeWay ? "1x2" : "moneyline", prices });
      } else if (m.key === "totals") {
        const over = m.outcomes.find((o) => o.name.toLowerCase() === "over");
        const under = m.outcomes.find((o) => o.name.toLowerCase() === "under");
        if (over && under && over.point === under.point) {
          markets.push({ market: "over_under", line: over.point, prices: [{ pick: "over", odds: over.price }, { pick: "under", odds: under.price }] });
        }
      } else if (m.key === "btts") {
        const yes = m.outcomes.find((o) => o.name.toLowerCase() === "yes");
        const no = m.outcomes.find((o) => o.name.toLowerCase() === "no");
        if (yes && no) markets.push({ market: "btts", prices: [{ pick: "yes", odds: yes.price }, { pick: "no", odds: no.price }] });
      }
    }
    if (markets.length) books.set(slug, { bookmaker: slug, updatedAt: bk.last_update, markets });
  }
  return {
    id: fixtureId(e.home_team, e.away_team, e.commence_time),
    sport: league.sport,
    league: league.slug,
    home: e.home_team,
    away: e.away_team,
    kickoff: e.commence_time,
    books: [...books.values()],
    source: "the-odds-api",
  };
}

export async function fetchLeagueOdds(league: League): Promise<Fixture[] | null> {
  const key = process.env.ODDS_API_KEY;
  if (!key || !league.oddsApiKey) return null;
  const regions = process.env.ODDS_API_REGIONS || "uk,eu,us";
  const url = new URL(`https://api.the-odds-api.com/v4/sports/${league.oddsApiKey}/odds`);
  url.searchParams.set("apiKey", key);
  url.searchParams.set("regions", regions);
  url.searchParams.set("markets", "h2h,totals");
  url.searchParams.set("oddsFormat", "decimal");
  url.searchParams.set("dateFormat", "iso");
  try {
    const res = await fetch(url, { next: { revalidate: 900, tags: ["odds"] } });
    if (!res.ok) {
      console.warn(`[odds-api] ${league.oddsApiKey}: HTTP ${res.status}`);
      return null;
    }
    const events = (await res.json()) as OddsApiEvent[];
    const now = Date.now();
    return events
      .filter((e) => new Date(e.commence_time).getTime() > now)
      .map((e) => mapOddsApiEvent(e, league))
      .filter((f) => f.books.length > 0);
  } catch (err) {
    console.warn(`[odds-api] ${league.oddsApiKey}: ${(err as Error).message}`);
    return null;
  }
}
