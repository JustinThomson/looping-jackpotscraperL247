import { describe, expect, it } from "vitest";
import { base32Decode, base32Encode, CodeFormatError, decodeDemoCode, encodeDemoCode } from "@/lib/converter/codec";
import { canonicalTeam, diceSimilarity, findEvent, teamSimilarity, type CatalogueEvent } from "@/lib/converter/matching";
import { compareAcrossBookmakers, convertBookingCode, converterBookmakers, ConverterError } from "@/lib/converter";
import { codePrefix, createDemoAdapter, exampleCodes } from "@/lib/converter/adapters/demo";

const NOW = new Date("2026-11-07T08:00:00Z");

describe("codec", () => {
  it("round-trips base32", () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 255, 17, 42]);
    expect(Array.from(base32Decode(base32Encode(bytes)))).toEqual(Array.from(bytes));
  });

  it("round-trips demo codes", () => {
    const code = encodeDemoCode("SPB", [
      { fixtureId: "arsenal-vs-chelsea-2026-11-08", market: "1x2", pick: "home" },
      { fixtureId: "barcelona-vs-sevilla-2026-11-08", market: "btts", pick: "yes" },
    ]);
    expect(code).toMatch(/^DM-SPB-[0-9A-Z]+$/);
    const decoded = decodeDemoCode(code);
    expect(decoded.prefix).toBe("SPB");
    expect(decoded.selections.map((s) => [s.market, s.pick])).toEqual([
      ["1x2", "home"],
      ["btts", "yes"],
    ]);
  });

  it("rejects typos via checksum", () => {
    const code = encodeDemoCode("SPB", [{ fixtureId: "x-vs-y-2026-11-08", market: "1x2", pick: "draw" }]);
    const last = code.at(-1)!;
    const mid = Math.floor(code.length / 2) + 4;
    const typo = code.slice(0, mid) + (code[mid] === "A" ? "B" : "A") + code.slice(mid + 1);
    expect(() => decodeDemoCode(code.slice(0, -1) + (last === "A" ? "B" : "A"))).toThrow(CodeFormatError);
    expect(() => decodeDemoCode(typo)).toThrow(CodeFormatError);
    expect(() => decodeDemoCode("ABC123")).toThrow(CodeFormatError);
  });
});

describe("team matching", () => {
  it("resolves aliases", () => {
    expect(canonicalTeam("Man Utd")).toBe(canonicalTeam("Manchester United"));
    expect(canonicalTeam("Spurs")).toBe(canonicalTeam("Tottenham Hotspur"));
    expect(canonicalTeam("Atlético Madrid")).toBe(canonicalTeam("Atletico Madrid"));
    expect(teamSimilarity("Bayern München", "Bayern Munich")).toBe(1);
  });

  it("scores unknown variants with fuzzy similarity", () => {
    expect(teamSimilarity("Werder Bremen", "Bremen")).toBeGreaterThan(0.85);
    expect(teamSimilarity("Arsenal", "Chelsea")).toBeLessThan(0.5);
    expect(diceSimilarity("night", "nacht")).toBeCloseTo(0.25);
  });

  it("finds events with tolerant kickoff and rejects mismatches", () => {
    const cat: CatalogueEvent[] = [
      { id: "a", sport: "football", home: "Man Utd", away: "Spurs", kickoff: "2026-11-08T15:05:00Z", markets: [] },
      { id: "b", sport: "football", home: "Arsenal", away: "Chelsea", kickoff: "2026-11-08T17:30:00Z", markets: [] },
    ];
    expect(findEvent({ sport: "football", home: "Manchester United", away: "Tottenham", kickoff: "2026-11-08T15:00:00Z" }, cat)?.event.id).toBe("a");
    // Wrong day -> no match
    expect(findEvent({ sport: "football", home: "Arsenal", away: "Chelsea", kickoff: "2026-11-10T17:30:00Z" }, cat)).toBeNull();
    // Wrong sport -> no match
    expect(findEvent({ sport: "basketball", home: "Arsenal", away: "Chelsea", kickoff: "2026-11-08T17:30:00Z" }, cat)).toBeNull();
  });
});

describe("conversion", () => {
  it("lists booking-code bookmakers", () => {
    const slugs = converterBookmakers().map((b) => b.slug);
    expect(slugs).toEqual(expect.arrayContaining(["sportybet", "bet9ja", "betway", "betking"]));
    expect(slugs).not.toContain("draftkings");
  });

  it("generates distinct prefixes", () => {
    const prefixes = converterBookmakers().map((b) => codePrefix(b.slug));
    expect(new Set(prefixes).size).toBe(prefixes.length);
  });

  it("decodes example codes on the source bookmaker", async () => {
    const [ex] = await exampleCodes("sportybet", 1, NOW);
    expect(ex).toBeDefined();
    const slip = await createDemoAdapter("sportybet", { now: () => NOW }).decode(ex.code, "ng");
    expect(slip.selections.length).toBe(ex.legs);
    for (const s of slip.selections) expect(s.odds).toBeGreaterThan(1);
  });

  it("converts a SportyBet code to Bet9ja and back", async () => {
    const examples = await exampleCodes("sportybet", 3, NOW);
    for (const ex of examples) {
      const r = await convertBookingCode({ from: "sportybet", to: "bet9ja", code: ex.code, country: "ng" }, NOW);
      expect(r.demo).toBe(true);
      expect(r.selections.length).toBe(ex.legs);
      expect(r.matchedCount).toBeGreaterThan(0);
      expect(r.to.code).toMatch(/^DM-/);
      for (const s of r.selections.filter((x) => x.status === "matched")) {
        expect(s.target!.pick).toBe(s.source.pick);
        expect(s.target!.market).toBe(s.source.market);
      }
      // Converting back should recover the matched selections.
      const back = await convertBookingCode({ from: "bet9ja", to: "sportybet", code: r.to.code!, country: "ng" }, NOW);
      expect(back.matchedCount).toBe(r.matchedCount);
    }
  });

  it("rejects bad input", async () => {
    await expect(convertBookingCode({ from: "sportybet", to: "sportybet", code: "DM-SPB-XXXX" }, NOW)).rejects.toThrow(ConverterError);
    await expect(convertBookingCode({ from: "draftkings", to: "bet9ja", code: "DM-DRF-XXXX" }, NOW)).rejects.toThrow(ConverterError);
    await expect(convertBookingCode({ from: "sportybet", to: "bet9ja", code: "DM-B9J-0000" }, NOW)).rejects.toThrow();
  });

  it("compares a slip across all bookmakers", async () => {
    const [ex] = await exampleCodes("betway", 1, NOW);
    const rows = await compareAcrossBookmakers("betway", ex.code, "za", NOW);
    expect(rows.length).toBeGreaterThan(5);
    expect(rows[0].matched).toBeGreaterThanOrEqual(rows.at(-1)!.matched);
  });
});
