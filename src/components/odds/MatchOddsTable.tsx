"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Odds, OddsFormatToggle, RegionSelect, usePrefs } from "@/components/Preferences";
import type { BookMeta, MatchMarketData } from "@/lib/odds-data/compact";
import type { PickKey } from "@/lib/types";
import { allowedBooks } from "./OddsBoard";
import { isSelected, slip, useSlip } from "./slip-store";

const MARKET_LABELS: Record<string, string> = {
  "1x2": "1X2",
  moneyline: "Moneyline",
  double_chance: "Double chance",
  draw_no_bet: "Draw no bet",
  over_under: "Over/Under",
  btts: "BTTS",
};

function pickLabel(p: PickKey, home: string, away: string, line?: number) {
  const m: Record<PickKey, string> = { home, draw: "Draw", away, "1x": "1X", "12": "12", x2: "X2", over: `Over ${line ?? ""}`, under: `Under ${line ?? ""}`, yes: "Yes", no: "No" };
  return m[p];
}

type SortKey = "margin" | number;

export function MatchOddsTable({ id, home, away, kickoff, markets, meta }: { id: string; home: string; away: string; kickoff: string; markets: MatchMarketData[]; meta: BookMeta }) {
  const [active, setActive] = useState(0);
  const [sort, setSort] = useState<SortKey>("margin");
  const { region } = usePrefs();
  const items = useSlip();
  const filter = useMemo(() => allowedBooks(meta, region), [meta, region]);
  const m = markets[Math.min(active, markets.length - 1)];

  const rows = useMemo(() => {
    const list = Object.entries(m.books)
      .filter(([slug]) => filter(slug))
      .map(([slug, prices]) => {
        const complete = prices.every((p) => p > 1);
        const margin = complete ? prices.reduce((s, p) => s + 1 / p, 0) - 1 : NaN;
        return { slug, prices, margin };
      });
    return list.sort((a, b) => {
      if (sort === "margin") return (Number.isNaN(a.margin) ? 9 : a.margin) - (Number.isNaN(b.margin) ? 9 : b.margin);
      return b.prices[sort] - a.prices[sort];
    });
  }, [m, filter, sort]);

  const best = m.picks.map((_, i) => Math.max(0, ...rows.map((r) => r.prices[i])));
  const bestMargin = best.every((b) => b > 1) ? best.reduce((s, b) => s + 1 / b, 0) - 1 : NaN;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="tablist" aria-label="Markets" className="flex flex-wrap gap-1.5">
          {markets.map((mk, i) => (
            <button
              key={mk.market}
              role="tab"
              aria-selected={i === active}
              onClick={() => {
                setActive(i);
                setSort("margin");
              }}
              className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${i === active ? "border-ink-900 bg-ink-900 text-white" : "border-line bg-white text-ink-800 hover:bg-surface"}`}
            >
              {MARKET_LABELS[mk.market]}
              {mk.line !== undefined ? ` ${mk.line}` : ""}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <RegionSelect />
          <OddsFormatToggle />
        </div>
      </div>

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-line bg-surface text-left">
              <th className="px-4 py-3 font-semibold">Bookmaker</th>
              {m.picks.map((p, i) => (
                <th key={p} className="px-2 py-3 text-center font-semibold">
                  <button onClick={() => setSort(i)} className={`hover:underline ${sort === i ? "text-brand-700" : ""}`} title="Sort by best price">
                    {pickLabel(p, home, away, m.line)}
                  </button>
                </th>
              ))}
              <th className="px-3 py-3 text-center font-semibold">
                <button onClick={() => setSort("margin")} className={`hover:underline ${sort === "margin" ? "text-brand-700" : ""}`} title="Sort by lowest margin">
                  Margin
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-line bg-brand-50/60">
              <td className="px-4 py-2.5 font-bold text-brand-800">Best odds</td>
              {best.map((b, i) => (
                <td key={i} className="px-2 py-2.5 text-center font-bold text-brand-800">
                  {b > 1 ? <Odds value={b} /> : "–"}
                </td>
              ))}
              <td className="tabular px-3 py-2.5 text-center font-bold text-brand-800">{Number.isNaN(bestMargin) ? "–" : `${(bestMargin * 100).toFixed(1)}%`}</td>
            </tr>
            {rows.map((r) => (
              <tr key={r.slug} className="border-b border-line last:border-0 hover:bg-surface/60">
                <td className="px-4 py-2 font-semibold whitespace-nowrap">
                  <Link href={`/bookmakers/${r.slug}`} className="text-ink-900">
                    {meta.names[r.slug]}
                  </Link>
                </td>
                {r.prices.map((p, i) => {
                  const pick = m.picks[i];
                  const sel = isSelected(items, id, m.market, pick);
                  return (
                    <td key={i} className="px-1.5 py-1.5 text-center">
                      {p > 1 ? (
                        <button
                          onClick={() =>
                            slip.toggle({ fixtureId: id, market: m.market, pick, event: `${home} vs ${away}`, label: `${MARKET_LABELS[m.market]}: ${pickLabel(pick, home, away, m.line)}`, kickoff, bestOdds: best[i] })
                          }
                          aria-pressed={sel}
                          className={`odds-btn w-full py-1 ${p === best[i] ? "odds-best" : ""} ${sel ? "ring-2 ring-ink-900 ring-offset-1" : ""}`}
                        >
                          <Odds value={p} />
                        </button>
                      ) : (
                        <span className="text-muted">–</span>
                      )}
                    </td>
                  );
                })}
                <td className="tabular px-3 py-2 text-center text-ink-700">{Number.isNaN(r.margin) ? "–" : `${(r.margin * 100).toFixed(1)}%`}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={m.picks.length + 2} className="px-4 py-6 text-center text-ink-700">
                  No bookmakers in this region offer this market.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted">
        Highlighted prices are the best available. Margin is the bookmaker&apos;s built-in edge on this market — lower is better for you. Tap any price to add it to your betslip.
      </p>
    </div>
  );
}
