import { describe, expect, it } from "vitest";
import {
  accumulatorReturn,
  americanToDecimal,
  arbitrage,
  decimalToAmerican,
  decimalToFractional,
  fairOdds,
  formatOdds,
  fractionalToDecimal,
  marketMargin,
  parseOdds,
  systemBetReturn,
} from "@/lib/odds";

describe("odds format conversion", () => {
  it("converts decimal to American", () => {
    expect(decimalToAmerican(2.5)).toBe(150);
    expect(decimalToAmerican(2)).toBe(100);
    expect(decimalToAmerican(1.5)).toBe(-200);
    expect(decimalToAmerican(1.909)).toBe(-110);
  });

  it("converts American to decimal", () => {
    expect(americanToDecimal(150)).toBeCloseTo(2.5);
    expect(americanToDecimal(-110)).toBeCloseTo(1.909, 3);
    expect(() => americanToDecimal(50)).toThrow();
  });

  it("converts decimal to familiar fractions", () => {
    expect(decimalToFractional(2.5)).toBe("6/4");
    expect(decimalToFractional(3)).toBe("2/1");
    expect(decimalToFractional(2.62)).toBe("13/8");
    expect(decimalToFractional(1.91)).toBe("10/11");
    expect(fractionalToDecimal("5/2")).toBeCloseTo(3.5);
    expect(fractionalToDecimal("10/11")).toBeCloseTo(1.909, 3);
  });

  it("formats and parses all formats", () => {
    expect(formatOdds(2.5, "decimal")).toBe("2.50");
    expect(formatOdds(2.5, "american")).toBe("+150");
    expect(formatOdds(1.5, "american")).toBe("-200");
    expect(parseOdds("+150", "american")).toBeCloseTo(2.5);
    expect(parseOdds("5/2", "fractional")).toBeCloseTo(3.5);
    expect(parseOdds("abc", "decimal")).toBeNull();
    expect(parseOdds("0.9", "decimal")).toBeNull();
  });
});

describe("margins and returns", () => {
  it("calculates bookmaker margin", () => {
    expect(marketMargin([2, 2])).toBeCloseTo(0);
    expect(marketMargin([1.91, 1.91])).toBeCloseTo(0.0471, 3);
    expect(marketMargin([2.1, 3.4, 3.5])).toBeCloseTo(0.0558, 3);
  });

  it("removes margin to fair odds", () => {
    const fair = fairOdds([1.91, 1.91]);
    expect(fair[0]).toBeCloseTo(2);
  });

  it("calculates accumulator returns with bonus", () => {
    const r = accumulatorReturn(100, [2, 1.5, 3]);
    expect(r.odds).toBeCloseTo(9);
    expect(r.returns).toBeCloseTo(900);
    const withBonus = accumulatorReturn(100, [2, 1.5, 3], 10);
    expect(withBonus.profit).toBeCloseTo(880);
  });

  it("detects arbitrage", () => {
    expect(arbitrage([2.1, 2.1]).isArb).toBe(true);
    expect(arbitrage([1.9, 1.9]).isArb).toBe(false);
    const a = arbitrage([2.2, 2.0], 100);
    expect(a.stakes[0] * 2.2).toBeCloseTo(a.stakes[1] * 2.0);
  });

  it("calculates system bets", () => {
    const r = systemBetReturn(10, [2, 2, 2], 2, [true, true, false]);
    expect(r.lines).toBe(3);
    expect(r.totalStake).toBe(30);
    expect(r.returns).toBeCloseTo(40);
  });
});
