import { bookmakerBySlug, bookmakers } from "@/data/bookmakers";
import { accumulatorOdds, round } from "@/lib/odds";
import type { Betslip, ConversionResult, ConvertedSelection, CountryCode, MarketPrices, Selection } from "@/lib/types";
import { createDemoAdapter } from "./adapters/demo";
import type { BookingAdapter } from "./adapters/types";
import { CodeFormatError } from "./codec";
import { findEvent, type CatalogueEvent } from "./matching";

export { CodeFormatError };

/** Bookmakers that support shareable booking codes (and so appear in the converter). */
export function converterBookmakers() {
  return bookmakers.filter((b) => b.features.bookingCode && b.markets.some((m) => m.bookingCodeName));
}

export function converterCountries(slug: string): CountryCode[] {
  const b = bookmakerBySlug(slug);
  return b ? b.markets.filter((m) => m.bookingCodeName).map((m) => m.country) : [];
}

const adapterCache = new Map<string, BookingAdapter>();

export function getAdapter(slug: string): BookingAdapter {
  if (!converterBookmakers().some((b) => b.slug === slug)) throw new ConverterError(`Booking codes aren't supported for "${slug}".`);
  let a = adapterCache.get(slug);
  if (!a) {
    // Live adapters would be selected here when configured; demo is the default.
    a = createDemoAdapter(slug);
    adapterCache.set(slug, a);
  }
  return a;
}

export class ConverterError extends Error {}

/** Map a source selection onto a target event's markets. */
export function mapSelection(sel: Selection, ev: CatalogueEvent, now: Date): { status: ConvertedSelection["status"]; market?: MarketPrices; odds?: number; note?: string } {
  if (new Date(ev.kickoff).getTime() <= now.getTime()) return { status: "started", note: "This match has already started on the target bookmaker." };
  let market = ev.markets.find((m) => m.market === sel.market);
  // A football "1X2 home" can't be swapped for a two-way market, but a moneyline selection can map to a 2-way market of the same sport.
  if (!market && sel.market === "moneyline") market = ev.markets.find((m) => m.market === "moneyline");
  if (!market) return { status: "market-unavailable", note: "The target bookmaker doesn't offer this market for this match." };
  if (sel.market === "over_under" && sel.line !== undefined && market.line !== sel.line) {
    return { status: "market-unavailable", note: `Line differs: source ${sel.line}, target ${market.line ?? "n/a"}.` };
  }
  const price = market.prices.find((p) => p.pick === sel.pick);
  if (!price) return { status: "market-unavailable", note: "This outcome isn't available on the target bookmaker." };
  return { status: "matched", market, odds: price.odds };
}

export function convertSlip(slip: Betslip, target: BookingAdapter, catalogue: CatalogueEvent[], now: Date): { selections: ConvertedSelection[]; events: (CatalogueEvent | undefined)[] } {
  const events: (CatalogueEvent | undefined)[] = [];
  const selections = slip.selections.map((sel): ConvertedSelection => {
    const found = findEvent(sel, catalogue);
    if (!found) {
      events.push(undefined);
      return { source: sel, status: "event-not-found", note: "We couldn't find this match on the target bookmaker." };
    }
    const mapped = mapSelection(sel, found.event, now);
    events.push(mapped.status === "matched" ? found.event : undefined);
    if (mapped.status !== "matched") return { source: sel, status: mapped.status, confidence: found.score, note: mapped.note };
    const ev = found.event;
    return {
      source: sel,
      status: "matched",
      confidence: round(found.score, 3),
      target: {
        sport: ev.sport,
        league: ev.league,
        home: ev.home,
        away: ev.away,
        kickoff: ev.kickoff,
        market: sel.market,
        line: mapped.market?.line,
        pick: sel.pick,
        odds: mapped.odds,
        label: target.label(ev, sel.market, sel.pick, mapped.market?.line),
      },
    };
  });
  return { selections, events };
}

export interface ConvertRequest {
  from: string;
  to: string;
  code: string;
  country?: CountryCode;
  toCountry?: CountryCode;
}

export async function convertBookingCode(req: ConvertRequest, now = new Date()): Promise<ConversionResult> {
  if (req.from === req.to) throw new ConverterError("Choose two different bookmakers.");
  const code = (req.code ?? "").trim();
  if (code.length < 4 || code.length > 200) throw new ConverterError("Please enter a valid booking code.");
  const source = getAdapter(req.from);
  const target = getAdapter(req.to);
  const fromCountry = req.country && source.countries.includes(req.country) ? req.country : converterCountries(req.from)[0];
  const toCountries = converterCountries(req.to);
  const toCountry = req.toCountry && toCountries.includes(req.toCountry) ? req.toCountry : toCountries.includes(fromCountry) ? fromCountry : toCountries[0];

  const slip = await source.decode(code, fromCountry, now);
  const catalogue = await target.catalogue(toCountry, now);
  const { selections, events } = convertSlip(slip, target, catalogue, now);

  const matched = selections.map((s, i) => ({ s, ev: events[i] })).filter((x) => x.s.status === "matched" && x.ev);
  const targetCode = matched.length
    ? await target.book(
        matched.map(({ s, ev }) => ({ eventId: ev!.id, market: s.target!.market, pick: s.target!.pick })),
        toCountry,
      )
    : undefined;

  const warnings: string[] = [];
  const unmatched = selections.length - matched.length;
  if (unmatched) warnings.push(`${unmatched} of ${selections.length} selection${selections.length > 1 ? "s" : ""} couldn't be converted and ${unmatched > 1 ? "were" : "was"} left out of the new code.`);
  if (selections.some((s) => s.status === "matched" && (s.confidence ?? 1) < 0.95)) warnings.push("Some matches were paired using fuzzy team-name matching. Double-check them before placing your bet.");

  const srcOdds = matched.map(({ s }) => s.source.odds ?? 1);
  const tgtOdds = matched.map(({ s }) => s.target?.odds ?? 1);
  return {
    from: { bookmaker: req.from, country: fromCountry, code: slip.code ?? code },
    to: { bookmaker: req.to, country: toCountry, code: targetCode },
    selections,
    matchedCount: matched.length,
    totalOdds: { source: round(accumulatorOdds(srcOdds), 2), target: round(accumulatorOdds(tgtOdds), 2) },
    demo: source.mode === "demo" || target.mode === "demo",
    warnings,
  };
}

/**
 * Convert one code to every other supported bookmaker and rank by total odds.
 * Useful for "where should I place this slip?" comparisons.
 */
export async function compareAcrossBookmakers(from: string, code: string, country?: CountryCode, now = new Date()) {
  const all = converterBookmakers().filter((b) => b.slug !== from);
  const srcCountry = country ?? converterCountries(from)[0];
  const local = all.filter((b) => b.markets.some((m) => m.country === srcCountry && m.bookingCodeName));
  // Prefer bookmakers in the same country as the source code; fall back to everyone.
  const targets = local.length >= 2 ? local : all;
  const results = await Promise.all(
    targets.map(async (b) => {
      try {
        const r = await convertBookingCode({ from, to: b.slug, code, country: srcCountry, toCountry: srcCountry }, now);
        return { bookmaker: b.slug, matched: r.matchedCount, total: r.selections.length, odds: r.totalOdds.target, code: r.to.code };
      } catch {
        return null;
      }
    }),
  );
  return results.filter((r): r is NonNullable<typeof r> => r !== null).sort((a, b) => b.matched - a.matched || b.odds - a.odds);
}
