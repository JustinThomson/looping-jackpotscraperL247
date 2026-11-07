import { TEAM_ALIASES } from "@/data/leagues";
import type { MarketPrices, Selection, SportKey } from "@/lib/types";

/**
 * Event matching for the booking code converter.
 *
 * Different bookmakers name the same team differently ("Man Utd",
 * "Manchester United", "Manchester Utd"). We normalise names, resolve known
 * aliases to a canonical form, then fall back to fuzzy similarity. Kickoff
 * times must agree within a tolerance, and sports must match.
 */

const STOPWORDS = new Set(["fc", "cf", "afc", "sc", "ssc", "cd", "club", "the", "sk", "fk", "bk", "calcio"]);

export function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’.]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((w) => w && !STOPWORDS.has(w))
    .join(" ")
    .trim();
}

const ALIAS_INDEX: Map<string, string> = (() => {
  const m = new Map<string, string>();
  for (const [canonical, aliases] of Object.entries(TEAM_ALIASES)) {
    const c = normalizeName(canonical);
    m.set(c, c);
    for (const a of aliases) m.set(normalizeName(a), c);
  }
  return m;
})();

export function canonicalTeam(name: string): string {
  const n = normalizeName(name);
  return ALIAS_INDEX.get(n) ?? n;
}

function bigrams(s: string): string[] {
  const t = s.replace(/\s+/g, " ");
  const out: string[] = [];
  for (let i = 0; i < t.length - 1; i++) out.push(t.slice(i, i + 2));
  return out;
}

/** Sørensen–Dice coefficient on character bigrams (0..1). */
export function diceSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const A = bigrams(a);
  const counts = new Map<string, number>();
  for (const g of A) counts.set(g, (counts.get(g) ?? 0) + 1);
  let overlap = 0;
  const B = bigrams(b);
  for (const g of B) {
    const c = counts.get(g) ?? 0;
    if (c > 0) {
      overlap++;
      counts.set(g, c - 1);
    }
  }
  return (2 * overlap) / (A.length + B.length);
}

/** Similarity between two team names (0..1). */
export function teamSimilarity(a: string, b: string): number {
  const ca = canonicalTeam(a);
  const cb = canonicalTeam(b);
  if (ca === cb) return 1;
  const ta = ca.split(" ");
  const tb = cb.split(" ");
  // One name's significant tokens fully contained in the other's (e.g. "Bremen" vs "Werder Bremen").
  const [short, long] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  const contained = short.every((w) => w.length >= 3 && long.includes(w));
  const dice = diceSimilarity(ca, cb);
  return contained ? Math.max(0.88, dice) : dice;
}

export interface CatalogueEvent {
  id: string;
  sport: SportKey;
  league?: string;
  home: string;
  away: string;
  kickoff: string;
  markets: MarketPrices[];
}

export interface EventMatch {
  event: CatalogueEvent;
  score: number;
}

const MAX_KICKOFF_DIFF_MS = 3 * 3_600_000;
export const MATCH_THRESHOLD = 0.8;

export function scoreEvent(sel: Pick<Selection, "home" | "away" | "kickoff" | "sport">, ev: CatalogueEvent): number {
  if (sel.sport !== ev.sport) return 0;
  const dt = Math.abs(new Date(sel.kickoff).getTime() - new Date(ev.kickoff).getTime());
  if (!Number.isFinite(dt) || dt > MAX_KICKOFF_DIFF_MS) return 0;
  const h = teamSimilarity(sel.home, ev.home);
  const a = teamSimilarity(sel.away, ev.away);
  if (Math.min(h, a) < 0.55) return 0;
  const timePenalty = dt === 0 ? 0 : Math.min(0.05, dt / MAX_KICKOFF_DIFF_MS / 20);
  return (h + a) / 2 - timePenalty;
}

export function findEvent(sel: Pick<Selection, "home" | "away" | "kickoff" | "sport">, catalogue: CatalogueEvent[]): EventMatch | null {
  let best: EventMatch | null = null;
  for (const ev of catalogue) {
    const score = scoreEvent(sel, ev);
    if (score > 0 && (!best || score > best.score)) best = { event: ev, score };
  }
  return best && best.score >= MATCH_THRESHOLD ? best : null;
}
