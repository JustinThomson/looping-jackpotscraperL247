import { bookmakers } from "@/data/bookmakers";
import { leagues } from "@/data/leagues";
import type { Bookmaker, BookmakerPrices, Fixture, League, MarketPrices, PickKey } from "@/lib/types";
import { hashString, rng, shuffle, slugify } from "@/lib/random";
import { round } from "@/lib/odds";

/**
 * Deterministic sample odds.
 *
 * Fixtures for a given league and date are always identical (seeded by
 * league + date), so URLs stay stable while the window rolls forward each day.
 * Prices come from a simple Poisson goals model (football) or logistic model
 * (two-way sports) plus each bookmaker's typical margin and a little noise.
 * This data is for demonstration only — it is NOT a prediction or a real price feed.
 */

const DAY = 86_400_000;

type Schedule = { days: number[]; perDay: [number, number]; times: string[] };

const SCHEDULES: Record<string, Schedule> = {
  football: { days: [6, 0, 2, 3, 5], perDay: [2, 4], times: ["12:30", "15:00", "17:30", "19:45"] },
  "champions-league": { days: [2, 3], perDay: [3, 4], times: ["17:45", "20:00"] },
  african: { days: [6, 0, 3], perDay: [2, 3], times: ["13:00", "15:30", "17:30"] },
  basketball: { days: [0, 1, 2, 3, 4, 5, 6], perDay: [3, 5], times: ["00:00", "00:30", "01:00", "02:30", "03:00"] },
  "american-football": { days: [0, 1, 4], perDay: [1, 5], times: ["18:00", "21:05", "21:25", "01:20"] },
  rugby: { days: [5, 6], perDay: [2, 3], times: ["14:00", "16:30", "19:35"] },
};

function scheduleFor(league: League): Schedule {
  if (league.slug === "champions-league") return SCHEDULES["champions-league"];
  if (["betway-premiership", "npfl", "kenya-premier-league", "ghana-premier-league"].includes(league.slug)) return SCHEDULES.african;
  return SCHEDULES[league.sport] ?? SCHEDULES.football;
}

/* ---------- probability models ---------- */

function poisson(k: number, lambda: number): number {
  let f = 1;
  for (let i = 2; i <= k; i++) f *= i;
  return (Math.exp(-lambda) * lambda ** k) / f;
}

export interface FootballProbs {
  home: number;
  draw: number;
  away: number;
  over: number;
  under: number;
  bttsYes: number;
}

export function footballProbabilities(homeRating: number, awayRating: number, line = 2.5): FootballProbs {
  const diff = homeRating - awayRating + 4; // home advantage
  const lh = 1.4 * Math.exp(0.035 * diff);
  const la = 1.15 * Math.exp(-0.035 * diff);
  let home = 0,
    draw = 0,
    away = 0,
    over = 0,
    btts = 0;
  for (let h = 0; h <= 10; h++) {
    for (let a = 0; a <= 10; a++) {
      const p = poisson(h, lh) * poisson(a, la);
      if (h > a) home += p;
      else if (h === a) draw += p;
      else away += p;
      if (h + a > line) over += p;
      if (h > 0 && a > 0) btts += p;
    }
  }
  const total = home + draw + away;
  return { home: home / total, draw: draw / total, away: away / total, over: over / total, under: 1 - over / total, bttsYes: btts / total };
}

function twoWayProbability(homeRating: number, awayRating: number, scale = 6, homeAdv = 2): number {
  return 1 / (1 + Math.exp(-(homeRating - awayRating + homeAdv) / scale));
}

/* ---------- pricing ---------- */

function price(p: number, margin: number, rand: () => number): number {
  const noise = 0.975 + rand() * 0.05;
  const o = (1 / (p * (1 + margin))) * noise;
  return Math.max(1.01, round(o, 2));
}

function bookmakersForLeague(league: League): Bookmaker[] {
  if (league.coverage === "all") return bookmakers;
  const cov = league.coverage;
  return bookmakers.filter((b) => b.markets.some((m) => cov.includes(m.country)));
}

function buildPrices(league: League, fixtureId: string, home: { rating: number }, away: { rating: number }, b: Bookmaker): MarketPrices[] {
  const r = rng(`${fixtureId}:${b.slug}`);
  const m = b.typicalMargin;
  const markets: MarketPrices[] = [];
  const isUS = b.markets.every((x) => x.country === "us");

  if (league.sport === "football") {
    const p = footballProbabilities(home.rating, away.rating, league.totalsLine ?? 2.5);
    markets.push({
      market: "1x2",
      prices: [
        { pick: "home", odds: price(p.home, m, r) },
        { pick: "draw", odds: price(p.draw, m, r) },
        { pick: "away", odds: price(p.away, m, r) },
      ],
    });
    const dcMargin = m * 1.3;
    markets.push({
      market: "double_chance",
      prices: [
        { pick: "1x", odds: price(p.home + p.draw, dcMargin, r) },
        { pick: "12", odds: price(p.home + p.away, dcMargin, r) },
        { pick: "x2", odds: price(p.draw + p.away, dcMargin, r) },
      ],
    });
    const dnbHome = p.home / (p.home + p.away);
    markets.push({
      market: "draw_no_bet",
      prices: [
        { pick: "home", odds: price(dnbHome, m * 1.1, r) },
        { pick: "away", odds: price(1 - dnbHome, m * 1.1, r) },
      ],
    });
    markets.push({
      market: "over_under",
      line: league.totalsLine ?? 2.5,
      prices: [
        { pick: "over", odds: price(p.over, m * 1.1, r) },
        { pick: "under", odds: price(p.under, m * 1.1, r) },
      ],
    });
    // Some bookmakers don't list BTTS on every match (and US books rarely do on smaller leagues).
    if (r() > (isUS ? 0.5 : 0.12)) {
      markets.push({
        market: "btts",
        prices: [
          { pick: "yes", odds: price(p.bttsYes, m * 1.15, r) },
          { pick: "no", odds: price(1 - p.bttsYes, m * 1.15, r) },
        ],
      });
    }
  } else if (league.sport === "rugby") {
    const ph = twoWayProbability(home.rating, away.rating, 7, 4);
    const pd = 0.03;
    markets.push({
      market: "1x2",
      prices: [
        { pick: "home", odds: price(ph * (1 - pd), m, r) },
        { pick: "draw", odds: price(pd, m * 2, r) },
        { pick: "away", odds: price((1 - ph) * (1 - pd), m, r) },
      ],
    });
    markets.push({ market: "over_under", line: league.totalsLine, prices: [{ pick: "over", odds: price(0.5, m, r) }, { pick: "under", odds: price(0.5, m, r) }] });
  } else {
    const ph = twoWayProbability(home.rating, away.rating, league.sport === "basketball" ? 5 : 6, league.sport === "basketball" ? 2.5 : 2);
    // Two-way markets on US sports carry lower margins (standard -110 pricing on totals).
    const mm = Math.min(m, 0.05);
    markets.push({ market: "moneyline", prices: [{ pick: "home", odds: price(ph, mm, r) }, { pick: "away", odds: price(1 - ph, mm, r) }] });
    markets.push({ market: "over_under", line: league.totalsLine, prices: [{ pick: "over", odds: price(0.5, mm, r) }, { pick: "under", odds: price(0.5, mm, r) }] });
  }
  return markets;
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function fixtureId(home: string, away: string, kickoff: string): string {
  return slugify(`${home}-vs-${away}-${kickoff.slice(0, 10)}`);
}

function fixturesForDay(league: League, day: Date, updatedAt: string): Fixture[] {
  const sched = scheduleFor(league);
  if (!sched.days.includes(day.getUTCDay())) return [];
  const key = dateKey(day);
  const r = rng(`${league.slug}:${key}`);
  const [min, max] = sched.perDay;
  const count = Math.min(Math.floor(league.teams.length / 2), min + Math.floor(r() * (max - min + 1)));
  // Use a weekly shuffle so a team plays at most once across the week's match days.
  const weekStart = new Date(day.getTime() - day.getUTCDay() * DAY);
  const weekTeams = shuffle(league.teams, rng(`${league.slug}:week:${dateKey(weekStart)}`));
  const dayIndex = sched.days.indexOf(day.getUTCDay());
  const offset = (dayIndex * count * 2) % weekTeams.length;
  const fixtures: Fixture[] = [];
  for (let i = 0; i < count; i++) {
    const home = weekTeams[(offset + i * 2) % weekTeams.length];
    const away = weekTeams[(offset + i * 2 + 1) % weekTeams.length];
    if (!home || !away || home.name === away.name) continue;
    const time = sched.times[Math.floor(r() * sched.times.length)];
    const kickoff = `${key}T${time}:00.000Z`;
    const id = fixtureId(home.name, away.name, kickoff);
    const books: BookmakerPrices[] = bookmakersForLeague(league)
      // ~4% of bookmakers don't list any given fixture.
      .filter((b) => rng(`${id}:${b.slug}:listed`)() > 0.04)
      .map((b) => ({ bookmaker: b.slug, updatedAt, markets: buildPrices(league, id, home, away, b) }));
    fixtures.push({ id, sport: league.sport, league: league.slug, home: home.name, away: away.name, kickoff, books, source: "sample" });
  }
  return fixtures;
}

/**
 * Generate sample fixtures from `now` for the next `days` days.
 * Fixtures that already kicked off are excluded.
 */
const memo = new Map<string, Fixture[]>();

export function generateSampleFixtures(now: Date = new Date(), days = 7, only?: (l: League) => boolean): Fixture[] {
  const key = `${Math.floor(now.getTime() / 60_000)}:${days}`;
  if (!only) {
    const hit = memo.get(key);
    if (hit) return hit;
  }
  const result = buildSampleFixtures(now, days, only);
  if (!only) {
    if (memo.size > 4) memo.clear();
    memo.set(key, result);
  }
  return result;
}

function buildSampleFixtures(now: Date, days: number, only?: (l: League) => boolean): Fixture[] {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const updatedAt = new Date(Math.floor(now.getTime() / 600_000) * 600_000).toISOString();
  const out: Fixture[] = [];
  for (const league of leagues) {
    if (only && !only(league)) continue;
    for (let d = 0; d <= days; d++) {
      const day = new Date(start.getTime() + d * DAY);
      for (const f of fixturesForDay(league, day, updatedAt)) {
        if (new Date(f.kickoff).getTime() > now.getTime()) out.push(f);
      }
    }
  }
  return out.sort((a, b) => a.kickoff.localeCompare(b.kickoff) || a.id.localeCompare(b.id));
}

/** Deterministic pick used by tests and the demo adapter. */
export function pickHash(s: string): number {
  return hashString(s);
}

export const ALL_PICKS: PickKey[] = ["home", "draw", "away", "1x", "12", "x2", "over", "under", "yes", "no"];
