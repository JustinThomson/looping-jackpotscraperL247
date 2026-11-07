import { bookmakerBySlug } from "@/data/bookmakers";
import { TEAM_ALIASES } from "@/data/leagues";
import { generateSampleFixtures } from "@/lib/odds-data/sample";
import { hashString, rng } from "@/lib/random";
import type { Betslip, CountryCode, Fixture, MarketKey, PickKey, Selection } from "@/lib/types";
import { CodeFormatError, decodeDemoCode, encodeDemoCode, fixtureHash } from "../codec";
import type { CatalogueEvent } from "../matching";
import type { BookingAdapter } from "./types";

/**
 * Demo adapter: simulates a bookmaker's booking-code system on top of the
 * sample odds. Each simulated bookmaker uses its own team naming and market
 * labels, so the converter's matching logic is exercised realistically.
 */

type LabelStyle = {
  markets: Record<MarketKey, string>;
  picks: (pick: PickKey, home: string, away: string, line?: number) => string;
};

const STYLES: LabelStyle[] = [
  {
    markets: { "1x2": "1X2", moneyline: "Winner", double_chance: "Double Chance", draw_no_bet: "Draw No Bet", over_under: "Over/Under", btts: "GG/NG" },
    picks: (p, _h, _a, line) =>
      ({ home: "Home", draw: "Draw", away: "Away", "1x": "Home or Draw", "12": "Home or Away", x2: "Draw or Away", over: `Over ${line}`, under: `Under ${line}`, yes: "GG", no: "NG" })[p],
  },
  {
    markets: { "1x2": "1X2", moneyline: "Home/Away", double_chance: "DC", draw_no_bet: "DNB", over_under: "Total Goals O/U", btts: "Both Teams To Score" },
    picks: (p, _h, _a, line) => ({ home: "1", draw: "X", away: "2", "1x": "1X", "12": "12", x2: "X2", over: `Over ${line}`, under: `Under ${line}`, yes: "Yes", no: "No" })[p],
  },
  {
    markets: { "1x2": "Match Result", moneyline: "Match Winner", double_chance: "Double Chance", draw_no_bet: "Draw No Bet", over_under: "Total Goals", btts: "Both Teams to Score" },
    picks: (p, h, a, line) =>
      ({ home: h, draw: "Draw", away: a, "1x": `${h} or Draw`, "12": `${h} or ${a}`, x2: `Draw or ${a}`, over: `Over ${line}`, under: `Under ${line}`, yes: "Yes", no: "No" })[p],
  },
];

function styleFor(bookmaker: string): LabelStyle {
  return STYLES[hashString(bookmaker) % STYLES.length];
}

/** Bookmaker-specific display name for a team (stable per bookmaker). */
export function teamNameFor(bookmaker: string, canonical: string): string {
  const aliases = TEAM_ALIASES[canonical];
  if (!aliases?.length) return canonical;
  const idx = hashString(`${bookmaker}:${canonical}`) % (aliases.length + 1);
  return idx === 0 ? canonical : aliases[idx - 1];
}

/** Demo code prefixes, e.g. SportyBet -> SPB. */
const PREFIXES: Record<string, string> = {
  sportybet: "SPB",
  bet9ja: "B9J",
  betway: "BWY",
  betking: "BKG",
  msport: "MSP",
  nairabet: "NRB",
  bangbet: "BNG",
  betika: "BTK",
  betpawa: "BPW",
  supabets: "SUP",
};

export function codePrefix(bookmaker: string): string {
  if (PREFIXES[bookmaker]) return PREFIXES[bookmaker];
  const name = (bookmakerBySlug(bookmaker)?.name ?? bookmaker).toUpperCase().replace(/[^A-Z0-9]/g, "");
  const consonants = name[0] + name.slice(1).replace(/[AEIOU]/g, "");
  return (consonants.length >= 3 ? consonants : name).slice(0, 3).padEnd(3, "X");
}

function toEvent(bookmaker: string, f: Fixture): CatalogueEvent | null {
  const book = f.books.find((b) => b.bookmaker === bookmaker);
  if (!book) return null;
  return {
    id: f.id,
    sport: f.sport,
    league: f.league,
    home: teamNameFor(bookmaker, f.home),
    away: teamNameFor(bookmaker, f.away),
    // Bookmakers occasionally list kickoffs a few minutes apart.
    kickoff: new Date(new Date(f.kickoff).getTime() + (hashString(`${bookmaker}:${f.id}:ko`) % 3) * 5 * 60_000).toISOString(),
    markets: book.markets,
  };
}

export function createDemoAdapter(bookmaker: string, opts: { now?: () => Date } = {}): BookingAdapter {
  const now = opts.now ?? (() => new Date());
  const b = bookmakerBySlug(bookmaker);
  if (!b) throw new Error(`Unknown bookmaker ${bookmaker}`);
  const prefix = codePrefix(bookmaker);
  const style = styleFor(bookmaker);

  const catalogue = async (_country?: CountryCode, at?: Date): Promise<CatalogueEvent[]> =>
    generateSampleFixtures(at ?? now())
      .map((f) => toEvent(bookmaker, f))
      .filter((e): e is CatalogueEvent => e !== null);

  const label = (ev: CatalogueEvent, market: MarketKey, pick: PickKey, line?: number) => ({
    event: `${ev.home} vs ${ev.away}`,
    market: line !== undefined ? `${style.markets[market]} ${line}` : style.markets[market],
    pick: style.picks(pick, ev.home, ev.away, line),
  });

  return {
    bookmaker,
    mode: "demo",
    countries: b.markets.map((m) => m.country),
    codeName: b.bookingCode?.name ?? "Booking Code",
    catalogue,
    label,
    async decode(code: string, country: CountryCode, at?: Date): Promise<Betslip> {
      const decoded = decodeDemoCode(code);
      if (decoded.prefix !== prefix) {
        throw new CodeFormatError(`That code belongs to a different bookmaker (prefix ${decoded.prefix}). ${b.name} demo codes start with DM-${prefix}-.`);
      }
      const events = await catalogue(country, at);
      const byHash = new Map(events.map((e) => [fixtureHash(e.id), e]));
      const selections: Selection[] = [];
      let expired = 0;
      for (const s of decoded.selections) {
        const ev = byHash.get(s.fixtureHash);
        const m = ev?.markets.find((x) => x.market === s.market);
        const p = m?.prices.find((x) => x.pick === s.pick);
        if (!ev || !m || !p) {
          expired++;
          continue;
        }
        selections.push({
          sport: ev.sport,
          league: ev.league,
          home: ev.home,
          away: ev.away,
          kickoff: ev.kickoff,
          market: s.market,
          line: m.line,
          pick: s.pick,
          odds: p.odds,
          label: label(ev, s.market, s.pick, m.line),
        });
      }
      if (!selections.length) {
        throw new CodeFormatError(expired ? "This booking code has expired — its matches have already started or finished." : "No selections found for this code.");
      }
      return { bookmaker, country, code: code.trim().toUpperCase(), selections };
    },
    async book(selections: { eventId: string; market: MarketKey; pick: PickKey }[]): Promise<string> {
      return encodeDemoCode(
        prefix,
        selections.map((s) => ({ fixtureId: s.eventId, market: s.market, pick: s.pick })),
      );
    },
  };
}

/** Build a few deterministic example codes for a bookmaker (shown in the UI). */
export async function exampleCodes(bookmaker: string, count = 3, now = new Date()): Promise<{ code: string; legs: number }[]> {
  const adapter = createDemoAdapter(bookmaker, { now: () => now });
  const events = (await adapter.catalogue(adapter.countries[0], now)).filter((e) => e.sport === "football" && new Date(e.kickoff).getTime() - now.getTime() > 2 * 3_600_000);
  if (events.length < 3) return [];
  const day = now.toISOString().slice(0, 10);
  const out: { code: string; legs: number }[] = [];
  for (let i = 0; i < count; i++) {
    const r = rng(`${bookmaker}:${day}:example:${i}`);
    const legs = 2 + Math.floor(r() * 4);
    const picked = new Set<number>();
    while (picked.size < Math.min(legs, events.length)) picked.add(Math.floor(r() * events.length));
    const sels = [...picked].map((idx) => {
      const ev = events[idx];
      const options = ev.markets.flatMap((m) => m.prices.map((p) => ({ market: m.market, pick: p.pick })));
      const choice = options[Math.floor(r() * options.length)];
      return { eventId: ev.id, market: choice.market, pick: choice.pick };
    });
    out.push({ code: (await adapter.book(sels, adapter.countries[0]))!, legs: sels.length });
  }
  return out;
}
