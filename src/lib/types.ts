/**
 * Core domain types shared across the site.
 */

export type CountryCode = "za" | "ng" | "ke" | "gh" | "ug" | "tz" | "us" | "gb" | "ie" | "de" | "es" | "it" | "nl" | "se";

export type RegionKey = "south-africa" | "africa" | "united-states" | "europe";

export interface Helpline {
  name: string;
  phone?: string;
  url: string;
}

export interface Country {
  code: CountryCode;
  slug: string;
  name: string;
  /** Adjective, e.g. "South African". */
  demonym: string;
  region: RegionKey;
  currency: { code: string; symbol: string };
  flag: string;
  /** Minimum legal betting age. */
  minAge: number | string;
  legalStatus: "regulated" | "regulated-by-state" | "partially-regulated";
  legalSummary: string;
  regulators: { name: string; url?: string }[];
  keyLaw?: string;
  taxNote: string;
  popularPayments: string[];
  popularSports: string[];
  helplines: Helpline[];
  /** Self-exclusion scheme name, if any. */
  selfExclusion?: string;
  intro: string[];
  tips: string[];
  faqs: Faq[];
}

export interface Faq {
  q: string;
  a: string;
}

export type FeatureKey =
  | "liveBetting"
  | "liveStreaming"
  | "cashOut"
  | "betBuilder"
  | "bookingCode"
  | "editBet"
  | "accaBoost"
  | "earlyPayout"
  | "mobileMoney"
  | "virtuals"
  | "iosApp"
  | "androidApp"
  | "liteSite"
  | "exchange"
  | "jackpots";

export interface Offer {
  /** Short headline e.g. "100% up to R1,000". */
  headline: string;
  type: "deposit-match" | "free-bet" | "bet-and-get" | "no-deposit" | "second-chance" | "odds-boost" | "acca-bonus" | "cashback" | "none";
  details: string;
  minDeposit?: number;
  wagering?: string;
  promoCode?: string;
  terms?: string;
}

export interface MarketOperation {
  country: CountryCode;
  url: string;
  licence: string;
  welcome: Offer;
  otherPromos?: Offer[];
  minDeposit?: number;
  payments: string[];
  /** Name the bookmaker uses for shareable bet slips in this market, if supported. */
  bookingCodeName?: string;
  /** US only: states where online betting is live for the brand. */
  states?: string[];
}

export interface RatingBreakdown {
  odds: number;
  markets: number;
  bonuses: number;
  app: number;
  payments: number;
  support: number;
}

export interface Bookmaker {
  slug: string;
  name: string;
  /** Parent or operating company (where widely known). */
  owner?: string;
  founded?: number;
  tagline: string;
  summary: string;
  ratings: RatingBreakdown;
  features: Partial<Record<FeatureKey, boolean>>;
  pros: string[];
  cons: string[];
  markets: MarketOperation[];
  sports: string[];
  /** Typical football 1X2 margin, used to generate sample odds and for editorial copy. */
  typicalMargin: number;
  /** The Odds API bookmaker keys that map to this brand (for live odds). */
  oddsApiKeys?: string[];
  /** How the share/booking feature works, used for the converter guides. */
  bookingCode?: {
    name: string;
    howToLoad: string[];
    howToCreate: string[];
    example?: string;
  };
  lastReviewed: string;
}

/* ---------- Sports & odds ---------- */

export type SportKey = "football" | "basketball" | "american-football" | "ice-hockey" | "rugby" | "tennis" | "cricket";

export interface League {
  slug: string;
  name: string;
  sport: SportKey;
  country: string;
  /** Which bookmaker countries typically list this league. "all" = global. */
  coverage: CountryCode[] | "all";
  /** The Odds API sport key. */
  oddsApiKey?: string;
  teams: { name: string; rating: number }[];
  /** True if a draw is a valid result (3-way market). */
  threeWay: boolean;
  /** Typical total for over/under market. */
  totalsLine?: number;
  priority: number;
}

export type MarketKey = "1x2" | "moneyline" | "double_chance" | "draw_no_bet" | "over_under" | "btts";

export type PickKey = "home" | "draw" | "away" | "1x" | "12" | "x2" | "over" | "under" | "yes" | "no";

export interface Price {
  pick: PickKey;
  odds: number;
}

export interface MarketPrices {
  market: MarketKey;
  line?: number;
  prices: Price[];
}

export interface BookmakerPrices {
  bookmaker: string;
  updatedAt: string;
  markets: MarketPrices[];
}

export interface Fixture {
  id: string;
  sport: SportKey;
  league: string;
  home: string;
  away: string;
  kickoff: string;
  books: BookmakerPrices[];
  source: "sample" | "the-odds-api";
}

/* ---------- Booking codes ---------- */

export interface Selection {
  sport: SportKey;
  league?: string;
  home: string;
  away: string;
  kickoff: string;
  market: MarketKey;
  line?: number;
  pick: PickKey;
  odds?: number;
  /** Labels as displayed by the bookmaker that produced the selection. */
  label?: { event: string; market: string; pick: string };
}

export interface Betslip {
  bookmaker: string;
  country: CountryCode;
  code?: string;
  selections: Selection[];
}

export type SelectionStatus = "matched" | "market-unavailable" | "event-not-found" | "started";

export interface ConvertedSelection {
  source: Selection;
  status: SelectionStatus;
  target?: Selection;
  confidence?: number;
  note?: string;
}

export interface ConversionResult {
  from: { bookmaker: string; country: CountryCode; code: string };
  to: { bookmaker: string; country: CountryCode; code?: string };
  selections: ConvertedSelection[];
  matchedCount: number;
  totalOdds: { source: number; target: number };
  demo: boolean;
  warnings: string[];
}
