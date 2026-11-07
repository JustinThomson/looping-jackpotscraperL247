/**
 * Odds maths: format conversion, implied probability, margins and bet returns.
 * All functions take/return decimal odds unless stated otherwise.
 */

export type OddsFormat = "decimal" | "fractional" | "american";

export function round(n: number, dp = 2): number {
  const f = 10 ** dp;
  return Math.round((n + Number.EPSILON) * f) / f;
}

/** Decimal -> American (moneyline). */
export function decimalToAmerican(d: number): number {
  if (!(d > 1)) throw new RangeError("Decimal odds must be greater than 1");
  return d >= 2 ? Math.round((d - 1) * 100) : Math.round(-100 / (d - 1));
}

export function americanToDecimal(a: number): number {
  if (!Number.isFinite(a) || (a > -100 && a < 100)) throw new RangeError("American odds must be <= -100 or >= +100");
  return a > 0 ? 1 + a / 100 : 1 + 100 / Math.abs(a);
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** Common bookmaker fractions, used to snap to familiar prices (e.g. 2.62 -> 13/8). */
const COMMON_FRACTIONS: [number, number][] = [
  [1, 10], [1, 8], [1, 7], [1, 6], [1, 5], [2, 9], [1, 4], [2, 7], [3, 10], [1, 3], [4, 11], [2, 5], [4, 9], [1, 2], [8, 15], [4, 7], [8, 13],
  [4, 6], [8, 11], [4, 5], [5, 6], [10, 11], [1, 1], [11, 10], [6, 5], [5, 4], [11, 8], [6, 4], [8, 5], [13, 8], [7, 4], [15, 8], [2, 1],
  [9, 4], [5, 2], [11, 4], [3, 1], [10, 3], [7, 2], [4, 1], [9, 2], [5, 1], [11, 2], [6, 1], [13, 2], [7, 1], [15, 2], [8, 1], [9, 1],
  [10, 1], [11, 1], [12, 1], [14, 1], [16, 1], [18, 1], [20, 1], [25, 1], [33, 1], [40, 1], [50, 1], [66, 1], [100, 1],
];

/** Decimal -> fractional string. Snaps to a common fraction when within 1.5%, otherwise reduces exactly. */
export function decimalToFractional(d: number): string {
  if (!(d > 1)) throw new RangeError("Decimal odds must be greater than 1");
  const target = d - 1;
  let best: [number, number] | null = null;
  let bestErr = Infinity;
  for (const [n, den] of COMMON_FRACTIONS) {
    const err = Math.abs(n / den - target) / target;
    if (err < bestErr) {
      bestErr = err;
      best = [n, den];
    }
  }
  if (best && bestErr <= 0.015) return `${best[0]}/${best[1]}`;
  const den = 100;
  const num = Math.round(target * den);
  const g = gcd(num, den);
  return `${num / g}/${den / g}`;
}

export function fractionalToDecimal(f: string): number {
  const m = f.trim().match(/^(\d+(?:\.\d+)?)\s*[/-]\s*(\d+(?:\.\d+)?)$/);
  if (!m) throw new RangeError("Fractional odds must look like 5/2");
  const n = parseFloat(m[1]);
  const den = parseFloat(m[2]);
  if (den === 0) throw new RangeError("Denominator cannot be zero");
  return 1 + n / den;
}

export function impliedProbability(d: number): number {
  return 1 / d;
}

export function formatOdds(d: number, format: OddsFormat): string {
  if (!Number.isFinite(d) || d <= 1) return "–";
  switch (format) {
    case "fractional":
      return decimalToFractional(d);
    case "american": {
      const a = decimalToAmerican(d);
      return a > 0 ? `+${a}` : `${a}`;
    }
    default:
      return d.toFixed(2);
  }
}

/** Parse odds typed in any format into decimal. Returns null if invalid. */
export function parseOdds(input: string, format: OddsFormat): number | null {
  try {
    const s = input.trim();
    if (!s) return null;
    if (format === "fractional") return fractionalToDecimal(s);
    if (format === "american") return americanToDecimal(parseFloat(s.replace(/^\+/, "")));
    const d = parseFloat(s);
    return d > 1 ? d : null;
  } catch {
    return null;
  }
}

/** Bookmaker margin (overround) for a complete market, e.g. 0.054 for 5.4%. */
export function marketMargin(odds: number[]): number {
  if (odds.length < 2 || odds.some((o) => !(o > 1))) return NaN;
  return odds.reduce((s, o) => s + 1 / o, 0) - 1;
}

/** Remove the margin proportionally to get "fair" odds. */
export function fairOdds(odds: number[]): number[] {
  const book = odds.reduce((s, o) => s + 1 / o, 0);
  return odds.map((o) => (1 / o / book > 0 ? 1 / (1 / o / book) : NaN));
}

/** Payout percentage (return to player), e.g. 0.95 for 95%. */
export function payoutPercentage(odds: number[]): number {
  return 1 / (1 + marketMargin(odds));
}

export function accumulatorOdds(legs: number[]): number {
  return legs.reduce((p, o) => p * o, 1);
}

export interface BetReturn {
  stake: number;
  odds: number;
  returns: number;
  profit: number;
}

export function accumulatorReturn(stake: number, legs: number[], bonusPct = 0): BetReturn {
  const odds = accumulatorOdds(legs);
  const gross = stake * odds;
  const profit = gross - stake;
  const bonus = profit * (bonusPct / 100);
  return { stake, odds, returns: gross + bonus, profit: profit + bonus };
}

/**
 * Arbitrage check: if the sum of inverse best odds across outcomes is < 1, a
 * guaranteed-margin split exists. Returns stake split for a total stake.
 */
export function arbitrage(bestOdds: number[], totalStake = 100) {
  const inv = bestOdds.reduce((s, o) => s + 1 / o, 0);
  const stakes = bestOdds.map((o) => (totalStake * (1 / o)) / inv);
  return { isArb: inv < 1, roi: 1 / inv - 1, stakes, payout: totalStake / inv };
}

/** Combinations "n choose k" — used by system bet calculations. */
export function combinations<T>(items: T[], k: number): T[][] {
  const out: T[][] = [];
  const rec = (start: number, combo: T[]) => {
    if (combo.length === k) {
      out.push([...combo]);
      return;
    }
    for (let i = start; i < items.length; i++) {
      combo.push(items[i]);
      rec(i + 1, combo);
      combo.pop();
    }
  };
  rec(0, []);
  return out;
}

/**
 * System bet returns (e.g. 2/4 = all doubles from 4 selections).
 * `results` marks each selection as won (true) or lost (false).
 */
export function systemBetReturn(stakePerLine: number, legs: number[], size: number, results: boolean[]) {
  const idx = legs.map((_, i) => i);
  const lines = combinations(idx, size);
  let returns = 0;
  for (const line of lines) {
    if (line.every((i) => results[i])) returns += stakePerLine * line.reduce((p, i) => p * legs[i], 1);
  }
  const totalStake = stakePerLine * lines.length;
  return { lines: lines.length, totalStake, returns, profit: returns - totalStake };
}
