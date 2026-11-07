# OddsBridge — betting comparison & booking code converter

OddsBridge is an SEO-focused content site that compares sports betting platforms in **South Africa**, the rest of **Africa** (Nigeria, Kenya, Ghana, Uganda, Tanzania), the **United States** and **Europe/UK**. It includes:

- **Odds comparison** for every upcoming match across many bookmakers, filterable by region, with margins, best prices and three odds formats.
- **Bookmaker reviews**, **country rankings**, **bonus comparisons** and **head-to-head comparisons**.
- A **booking code converter** that rebuilds a betslip from one bookmaker (SportyBet, Bet9ja, Betway, BetKing, …) on another, and ranks the same slip across every supported bookmaker.
- A site-wide **betslip** that prices an accumulator at every bookmaker and generates codes for code-supporting bookmakers.
- Free tools: odds converter, bet/accumulator/system calculator and margin/arbitrage calculator.
- Long-form **guides** (Markdown in `content/guides`).

Built with Next.js (App Router), React, TypeScript and Tailwind CSS v4.

## Getting started

```bash
npm install
cp .env.example .env.local   # optional
npm run dev                  # http://localhost:3000
npm test                     # unit tests (vitest)
npm run smoke                # fetch every sitemap URL on a running server (BASE_URL=...)
npm run typecheck
npm run build && npm start   # production
```

Node 20.9+ is required.

## Configuration

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL used for canonicals, sitemap and Open Graph. |
| `ODDS_API_KEY` | Optional [The Odds API](https://the-odds-api.com) key. When set, leagues the API covers (EPL, LaLiga, Serie A, Bundesliga, UCL, NBA, NFL) show live prices for mapped US/UK/EU bookmakers, cached for 15 minutes. |
| `ODDS_API_REGIONS` | Regions requested from The Odds API (default `uk,eu,us`). |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Optional: enables Plausible analytics for this domain (`NEXT_PUBLIC_PLAUSIBLE_SRC` overrides the script URL). |
| `AFFILIATE_<SLUG>_<COUNTRY>` | Optional outbound tracking URL per bookmaker and market, e.g. `AFFILIATE_BETWAY_ZA`. Used by the `/go/[slug]` redirect. |

Without an odds key the site runs on **deterministic sample odds**, which every odds page labels clearly.

## Project layout

```
content/guides/          Markdown guides (frontmatter + trailing "## FAQ" → FAQPage schema)
src/data/                Editorial data: countries, bookmakers, leagues & team aliases
src/lib/odds.ts          Odds maths (format conversion, margins, accas, system bets, arbitrage)
src/lib/odds-data/       Odds providers: sample generator, The Odds API mapper, unified access
src/lib/converter/       Booking code converter: matching engine, codec, adapters, service
src/lib/seo.ts           Metadata + JSON-LD builders
src/app/                 Routes (see below)
tests/                   Vitest unit tests
```

### Routes

| Route | Description |
| --- | --- |
| `/` | Home: converter, featured odds, rankings, guides |
| `/betting-sites`, `/betting-sites/[country]` | Country hubs: rankings, legal status, offers, local odds, FAQs |
| `/bookmakers`, `/bookmakers/[slug]` | Directory with filters, and full reviews (Review schema) |
| `/bonuses`, `/bonuses/[country]` | Welcome offers by country |
| `/odds`, `/odds/[league]`, `/odds/match/[id]` | Odds comparison (ISR, 10–15 min) |
| `/booking-code-converter`, `/booking-code-converter/[from]-to-[to]` | Converter + 90 programmatic pair pages |
| `/compare`, `/compare/[a]-vs-[b]` | Head-to-head pages for bookmakers sharing a country |
| `/guides`, `/guides/[slug]` | Articles (Article + FAQPage schema, TOC) |
| `/tools/*` | Calculators |
| `/api/convert`, `/api/convert/compare`, `/api/examples`, `/api/slip` | JSON APIs used by the UI |
| `/go/[slug]?c=xx` | Outbound redirect (noindex, `rel="sponsored"`) |
| `/sitemap.xml`, `/robots.txt`, OG images | Technical SEO |

## How the booking code converter works

1. **Decode** — the source bookmaker's adapter turns a code into normalised selections (`sport`, teams, kickoff, `market`, `line`, `pick`, odds).
2. **Match events** — `src/lib/converter/matching.ts` normalises team names, resolves aliases (`TEAM_ALIASES` in `src/data/leagues.ts`), falls back to bigram similarity and requires the kickoff within 3 hours and the same sport.
3. **Map markets** — 1X2, moneyline, double chance, draw no bet, over/under (same line only) and BTTS. Unavailable markets, missing events and started matches are reported per selection.
4. **Book** — the target adapter creates a booking from matched selections and returns its code.

### Demo mode vs real integrations

Bookmakers don't offer public booking APIs, so the site ships with a **demo adapter** (`adapters/demo.ts`). It simulates each bookmaker's catalogue (with that bookmaker's own team names and market labels) on top of the sample odds, and issues self-describing codes prefixed `DM-` (for example `DM-SPB-…`). These codes round-trip through the converter but **do not work on real bookmaker sites**, and the UI says so everywhere.

To add a real integration, implement `BookingAdapter` (`src/lib/converter/adapters/types.ts`) for the bookmaker — `decode`, `catalogue`, `book` and `label` — and return it from `getAdapter` in `src/lib/converter/index.ts`. Use official or partner APIs and respect each operator's terms.

## Editorial data — please verify before launch

`src/data/bookmakers.ts` and `src/data/countries.ts` contain bonuses, features, licensing and legal summaries compiled from public information. **Offers and regulations change frequently.** Re-verify every entry against operators' and regulators' current terms before publishing, and update `lastReviewed`. Ratings are editorial and use the weights in `RATING_WEIGHTS` (documented on `/methodology`).

## Responsible gambling

Every page carries 18+ messaging (21+ in most US states, 25+ in Uganda), helplines and a link to `/responsible-gambling`. Keep it that way.
