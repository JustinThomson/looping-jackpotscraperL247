import { bookmakers, overallRating } from "@/data/bookmakers";
import { countries } from "@/data/countries";
import { leagues } from "@/data/leagues";
import { getGuides } from "./guides";
import { converterBookmakers } from "./converter";

export interface SearchDoc {
  title: string;
  url: string;
  type: "Bookmaker" | "Country" | "Bonuses" | "Guide" | "Odds" | "Tool" | "Booking code";
  text: string;
}

/** Small static index of the site's main pages for client-side search. */
export function buildSearchIndex(): SearchDoc[] {
  const docs: SearchDoc[] = [];
  for (const b of bookmakers) {
    docs.push({ title: `${b.name} review`, url: `/bookmakers/${b.slug}`, type: "Bookmaker", text: `${b.tagline}. Rated ${overallRating(b).toFixed(1)}/10.` });
  }
  for (const c of countries) {
    docs.push({ title: `Betting sites in ${c.name}`, url: `/betting-sites/${c.slug}`, type: "Country", text: `${c.demonym} bookmakers, legal status, payments: ${c.popularPayments.slice(0, 3).join(", ")}` });
    docs.push({ title: `${c.demonym} betting bonuses`, url: `/bonuses/${c.slug}`, type: "Bonuses", text: `Welcome offers and free bets in ${c.name}` });
  }
  for (const g of getGuides()) docs.push({ title: g.title, url: `/guides/${g.slug}`, type: "Guide", text: g.description });
  for (const l of leagues) docs.push({ title: `${l.name} odds`, url: `/odds/${l.slug}`, type: "Odds", text: `Compare ${l.name} betting odds (${l.country})` });
  for (const b of converterBookmakers()) {
    docs.push({ title: `${b.name} ${b.bookingCode?.name.toLowerCase() ?? "booking code"}`, url: `/booking-codes/${b.slug}`, type: "Booking code", text: `Create, load and convert ${b.name} booking codes` });
  }
  docs.push(
    { title: "Booking code converter", url: "/booking-code-converter", type: "Tool", text: "Convert SportyBet, Bet9ja, Betway, BetKing codes between bookmakers" },
    { title: "Odds converter", url: "/tools/odds-converter", type: "Tool", text: "Decimal, fractional, American odds and implied probability" },
    { title: "Bet calculator", url: "/tools/bet-calculator", type: "Tool", text: "Accumulator, parlay and system bet returns" },
    { title: "Margin calculator", url: "/tools/margin-calculator", type: "Tool", text: "Bookmaker overround, fair odds and arbitrage" },
    { title: "Odds today", url: "/odds/today", type: "Odds", text: "Best odds for matches in the next 48 hours" },
  );
  return docs;
}
