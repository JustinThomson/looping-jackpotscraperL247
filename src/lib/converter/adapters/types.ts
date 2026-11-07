import type { Betslip, CountryCode, MarketKey, PickKey } from "@/lib/types";
import type { CatalogueEvent } from "../matching";

/**
 * A bookmaker integration for the booking code converter.
 *
 * To add a real integration, implement this interface for the bookmaker
 * (decode a code into selections, expose the bookmaker's event catalogue and
 * create a booking from selections) and register it in ../registry.ts.
 * Always use official/partner APIs and respect the bookmaker's terms.
 */
export interface BookingAdapter {
  bookmaker: string;
  mode: "demo" | "live";
  countries: CountryCode[];
  /** What the bookmaker calls its code, e.g. "Booking Number". */
  codeName: string;
  decode(code: string, country: CountryCode, now?: Date): Promise<Betslip>;
  /** Upcoming events (with markets & prices) offered by the bookmaker. */
  catalogue(country: CountryCode, now?: Date): Promise<CatalogueEvent[]>;
  /** Create a booking and return its code. Return undefined if unsupported. */
  book(selections: { eventId: string; market: MarketKey; pick: PickKey }[], country: CountryCode): Promise<string | undefined>;
  /** Bookmaker-style labels for a selection. */
  label(ev: CatalogueEvent, market: MarketKey, pick: PickKey, line?: number): { event: string; market: string; pick: string };
}
