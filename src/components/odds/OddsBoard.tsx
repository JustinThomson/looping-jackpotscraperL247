"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Odds, OddsFormatToggle, RegionSelect, usePrefs, type RegionPref } from "@/components/Preferences";
import type { BoardRow, BookMeta } from "@/lib/odds-data/compact";
import type { PickKey } from "@/lib/types";
import { isSelected, slip, useSlip } from "./slip-store";

const SHORT: Record<PickKey, string> = { home: "1", draw: "X", away: "2", "1x": "1X", "12": "12", x2: "X2", over: "O", under: "U", yes: "Y", no: "N" };

export function allowedBooks(meta: BookMeta, region: RegionPref): (slug: string) => boolean {
  if (region === "all") return () => true;
  const codes = new Set(meta.regions[region]);
  return (slug) => (meta.countries[slug] ?? []).some((c) => codes.has(c));
}

/** Deterministic (UTC, en-GB) when `local` is false so server and first client render match. */
export function formatKickoff(iso: string, local = false) {
  const d = new Date(iso);
  const opts: Intl.DateTimeFormatOptions = local ? {} : { timeZone: "UTC" };
  const locale = local ? undefined : "en-GB";
  return {
    day: d.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short", ...opts }),
    time: d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", ...opts }) + (local ? "" : " UTC"),
  };
}

export function KickoffTime({ iso }: { iso: string }) {
  // Server and hydration render show UTC; switch to the visitor's timezone after mount.
  const [local, setLocal] = useState(false);
  useEffect(() => setLocal(true), []);
  const { day, time } = formatKickoff(iso, local);
  return (
    <span className="tabular block text-xs leading-tight text-muted">
      <span className="block font-semibold text-ink-700">{day}</span>
      {time}
    </span>
  );
}

export function OddsBoard({
  rows,
  meta,
  showLeague = false,
  leagueNames = {},
  scoped = false,
}: {
  rows: BoardRow[];
  meta: BookMeta;
  showLeague?: boolean;
  leagueNames?: Record<string, string>;
  /** Rows are already limited to a country's bookmakers: ignore the region preference. */
  scoped?: boolean;
}) {
  const { region } = usePrefs();
  const items = useSlip();
  const filter = useMemo(() => (scoped ? () => true : allowedBooks(meta, region)), [meta, region, scoped]);

  const computed = useMemo(
    () =>
      rows
        .map((r) => {
          const books = Object.entries(r.books).filter(([slug]) => filter(slug));
          const best = r.picks.map((_, i) => {
            let odds = 0;
            let book = "";
            for (const [slug, prices] of books) if (prices[i] > odds) [odds, book] = [prices[i], slug];
            return { odds, book };
          });
          return { r, count: books.length, best };
        })
        .filter((x) => x.count > 0),
    [rows, filter],
  );

  const hidden = rows.length - computed.length;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        {scoped ? <span /> : <RegionSelect />}
        <OddsFormatToggle />
      </div>
      {computed.length === 0 ? (
        <p className="card p-6 text-center text-ink-700">No bookmakers in this region list these matches. Try another region.</p>
      ) : (
        <div className="card divide-y divide-line">
          {computed.map(({ r, count, best }) => (
            <div key={r.id} className="grid grid-cols-[3.5rem_1fr] items-center gap-x-3 gap-y-2 px-3 py-3 sm:grid-cols-[4.5rem_1fr_auto] sm:px-4">
              <KickoffTime iso={r.kickoff} />
              <div className="min-w-0">
                {showLeague && <p className="truncate text-xs text-muted">{leagueNames[r.league] ?? r.league}</p>}
                <Link href={`/odds/match/${r.id}`} className="block font-semibold text-ink-900">
                  <span className="block truncate">{r.home}</span>
                  <span className="block truncate">{r.away}</span>
                </Link>
                <Link href={`/odds/match/${r.id}`} className="text-xs font-medium">
                  Compare {count} bookmakers →
                </Link>
              </div>
              <div className="col-span-2 flex gap-1.5 sm:col-span-1">
                {r.picks.map((pick, i) => {
                  const b = best[i];
                  const selected = isSelected(items, r.id, r.market, pick);
                  return (
                    <button
                      key={pick}
                      type="button"
                      disabled={!b.odds}
                      onClick={() =>
                        slip.toggle({
                          fixtureId: r.id,
                          market: r.market,
                          pick,
                          event: `${r.home} vs ${r.away}`,
                          label: pick === "home" ? r.home : pick === "away" ? r.away : "Draw",
                          kickoff: r.kickoff,
                          bestOdds: b.odds,
                        })
                      }
                      aria-pressed={selected}
                      title={b.book ? `Best price at ${meta.names[b.book]} — click to add to your betslip` : undefined}
                      className={`odds-btn flex-1 sm:w-24 sm:flex-none ${selected ? "border-ink-900 bg-ink-900 text-white hover:bg-ink-800" : ""}`}
                    >
                      <span className={`text-[10px] font-semibold ${selected ? "text-white/70" : "text-muted"}`}>{SHORT[pick]}</span>
                      {b.odds ? <Odds value={b.odds} /> : "–"}
                      <span className={`max-w-full truncate text-[10px] font-medium ${selected ? "text-white/70" : "text-brand-700"}`}>{b.book ? meta.names[b.book] : ""}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      {hidden > 0 && <p className="mt-2 text-xs text-muted">{hidden} match(es) hidden because no bookmaker in this region lists them.</p>}
      <p className="mt-2 text-xs text-muted">Best available price shown. Tap a price to add it to your betslip and compare the whole slip across bookmakers.</p>
    </div>
  );
}
