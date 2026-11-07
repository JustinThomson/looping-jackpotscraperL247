import { describe, expect, it } from "vitest";
import { footballProbabilities, generateSampleFixtures } from "@/lib/odds-data/sample";
import { mapOddsApiEvent } from "@/lib/odds-data/the-odds-api";
import { leagueBySlug } from "@/data/leagues";
import { bestPrices, bookMargin } from "@/lib/odds-data";
import { bookmakers, overallRating } from "@/data/bookmakers";
import { countries } from "@/data/countries";

const NOW = new Date("2026-11-07T08:00:00Z");

describe("sample odds", () => {
  it("is deterministic and future-only", () => {
    const a = generateSampleFixtures(NOW);
    const b = generateSampleFixtures(new Date(NOW.getTime() + 120_000));
    expect(a.length).toBeGreaterThan(30);
    expect(a.map((f) => f.id)).toEqual(b.map((f) => f.id));
    expect(a.every((f) => new Date(f.kickoff) > NOW)).toBe(true);
    expect(new Set(a.map((f) => f.id)).size).toBe(a.length);
  });

  it("produces sensible probabilities", () => {
    const p = footballProbabilities(90, 70);
    expect(p.home + p.draw + p.away).toBeCloseTo(1);
    expect(p.home).toBeGreaterThan(p.away);
    expect(p.over + p.under).toBeCloseTo(1);
  });

  it("applies realistic margins", () => {
    const fixtures = generateSampleFixtures(NOW).filter((f) => f.sport === "football");
    const margins = fixtures.flatMap((f) => f.books.map((b) => bookMargin(f, b.bookmaker, "1x2"))).filter(Number.isFinite);
    const avg = margins.reduce((s, m) => s + m, 0) / margins.length;
    expect(avg).toBeGreaterThan(0.03);
    expect(avg).toBeLessThan(0.1);
    const best = bestPrices(fixtures[0], "1x2");
    expect(best).toHaveLength(3);
  });

  it("only lists African leagues at bookmakers covering them", () => {
    const npfl = generateSampleFixtures(NOW).filter((f) => f.league === "npfl");
    for (const f of npfl) expect(f.books.some((b) => b.bookmaker === "draftkings")).toBe(false);
  });
});

describe("The Odds API mapping", () => {
  it("maps h2h and totals", () => {
    const f = mapOddsApiEvent(
      {
        id: "x",
        sport_key: "soccer_epl",
        commence_time: "2026-11-08T15:00:00Z",
        home_team: "Arsenal",
        away_team: "Chelsea",
        bookmakers: [
          {
            key: "williamhill",
            title: "William Hill",
            last_update: "2026-11-07T08:00:00Z",
            markets: [
              { key: "h2h", outcomes: [{ name: "Arsenal", price: 1.9 }, { name: "Chelsea", price: 4 }, { name: "Draw", price: 3.6 }] },
              { key: "totals", outcomes: [{ name: "Over", price: 1.8, point: 2.5 }, { name: "Under", price: 2, point: 2.5 }] },
            ],
          },
          { key: "unknown_book", title: "?", last_update: "", markets: [] },
        ],
      },
      leagueBySlug("premier-league")!,
    );
    expect(f.id).toBe("arsenal-vs-chelsea-2026-11-08");
    expect(f.books).toHaveLength(1);
    expect(f.books[0].bookmaker).toBe("william-hill");
    expect(f.books[0].markets[0]).toMatchObject({ market: "1x2" });
    expect(f.books[0].markets[1]).toMatchObject({ market: "over_under", line: 2.5 });
  });
});

describe("editorial data integrity", () => {
  it("has unique slugs and valid ratings", () => {
    const slugs = bookmakers.map((b) => b.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const b of bookmakers) {
      expect(b.markets.length).toBeGreaterThan(0);
      const r = overallRating(b);
      expect(r).toBeGreaterThan(5);
      expect(r).toBeLessThanOrEqual(10);
    }
  });

  it("every country has at least three bookmakers", () => {
    for (const c of countries) {
      const n = bookmakers.filter((b) => b.markets.some((m) => m.country === c.code)).length;
      expect(n, c.name).toBeGreaterThanOrEqual(3);
    }
  });
});
