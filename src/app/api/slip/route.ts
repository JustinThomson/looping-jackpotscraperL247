import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/server/rate-limit";
import { bookmakers } from "@/data/bookmakers";
import { getAllFixtures, bookmakersForScope } from "@/lib/odds-data";
import { getAdapter, converterBookmakers } from "@/lib/converter";
import type { MarketKey, PickKey, RegionKey } from "@/lib/types";
import { round } from "@/lib/odds";

export const dynamic = "force-dynamic";

const MARKETS = new Set<MarketKey>(["1x2", "moneyline", "double_chance", "draw_no_bet", "over_under", "btts"]);
const PICKS = new Set<PickKey>(["home", "draw", "away", "1x", "12", "x2", "over", "under", "yes", "no"]);
const REGIONS = new Set(["all", "south-africa", "africa", "united-states", "europe"]);

interface Body {
  selections: { fixtureId: string; market: MarketKey; pick: PickKey }[];
  region?: string;
}

/** Price a multi-selection slip at every bookmaker and generate booking codes where supported. */
export async function POST(req: Request) {
  const limited = rateLimit(req, "slip", 30);
  if (limited) return limited;
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const sels = Array.isArray(body.selections) ? body.selections.slice(0, 20) : [];
  if (!sels.length || sels.some((s) => typeof s.fixtureId !== "string" || !MARKETS.has(s.market) || !PICKS.has(s.pick))) {
    return NextResponse.json({ error: "Add at least one valid selection." }, { status: 400 });
  }
  const region = REGIONS.has(body.region ?? "all") ? ((body.region ?? "all") as RegionKey | "all") : "all";
  const allowed = bookmakersForScope(region);
  const fixtures = new Map((await getAllFixtures()).map((f) => [f.id, f]));
  const codeBooks = new Set(converterBookmakers().map((b) => b.slug));

  const rows = await Promise.all(
    bookmakers
      .filter((b) => allowed.has(b.slug))
      .map(async (b) => {
        let odds = 1;
        let matched = 0;
        const missing: string[] = [];
        const available: typeof sels = [];
        for (const s of sels) {
          const f = fixtures.get(s.fixtureId);
          const price = f?.books.find((x) => x.bookmaker === b.slug)?.markets.find((m) => m.market === s.market)?.prices.find((p) => p.pick === s.pick);
          if (price) {
            odds *= price.odds;
            matched++;
            available.push(s);
          } else missing.push(f ? `${f.home} vs ${f.away}` : s.fixtureId);
        }
        let code: string | undefined;
        if (codeBooks.has(b.slug) && available.length) {
          try {
            code = await getAdapter(b.slug).book(
              available.map((s) => ({ eventId: s.fixtureId, market: s.market, pick: s.pick })),
              b.markets[0].country,
            );
          } catch {
            code = undefined;
          }
        }
        return { bookmaker: b.slug, name: b.name, matched, total: sels.length, odds: round(odds, 2), missing, code };
      }),
  );
  const ranked = rows.filter((r) => r.matched > 0).sort((a, b) => b.matched - a.matched || b.odds - a.odds);
  return NextResponse.json({ rows: ranked, demoCodes: true });
}
