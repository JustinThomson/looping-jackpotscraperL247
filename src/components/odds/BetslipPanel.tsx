"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Odds, usePrefs } from "@/components/Preferences";
import { slip, useSlip } from "./slip-store";

interface Row {
  bookmaker: string;
  name: string;
  matched: number;
  total: number;
  odds: number;
  missing: string[];
  code?: string;
}

export function BetslipPanel() {
  const items = useSlip();
  const { region } = usePrefs();
  const [open, setOpen] = useState(false);
  const [stake, setStake] = useState("100");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const requestId = useRef(0);
  // Results are stale once the slip or region changes; also invalidate in-flight requests.
  useEffect(() => {
    requestId.current++;
    setRows(null);
    setLoading(false);
  }, [items, region]);

  if (!items.length) return null;

  const stakeNum = Math.max(0, parseFloat(stake) || 0);

  async function compare() {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/slip", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ selections: items.map(({ fixtureId, market, pick }) => ({ fixtureId, market, pick })), region }),
      });
      const data = await res.json();
      if (id !== requestId.current) return;
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setRows(data.rows);
    } catch (e) {
      if (id === requestId.current) setError((e as Error).message);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-4 z-40 inline-flex items-center gap-2 rounded-full bg-ink-900 px-5 py-3 text-sm font-bold text-white shadow-xl hover:bg-ink-800"
        aria-haspopup="dialog"
      >
        Betslip
        <span className="tabular inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-500 px-1.5 text-xs text-ink-950">{items.length}</span>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink-950/40" onClick={() => setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="Betslip" className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="text-lg font-bold">Betslip ({items.length})</h2>
              <button onClick={() => setOpen(false)} className="rounded-lg px-2 py-1 text-2xl leading-none text-muted hover:bg-surface" aria-label="Close betslip">
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <ul className="space-y-2">
                {items.map((i) => (
                  <li key={i.fixtureId} className="flex items-start justify-between gap-3 rounded-xl border border-line p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{i.label}</p>
                      <p className="truncate text-xs text-muted">{i.event}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">
                        <Odds value={i.bestOdds} />
                      </span>
                      <button onClick={() => slip.remove(i.fixtureId)} className="text-lg leading-none text-muted hover:text-ink-900" aria-label={`Remove ${i.event}`}>
                        ×
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-end gap-3">
                <label className="flex-1">
                  <span className="label">Stake</span>
                  <input className="input" inputMode="decimal" value={stake} onChange={(e) => setStake(e.target.value)} />
                </label>
                <button onClick={compare} disabled={loading} className="btn-primary">
                  {loading ? "Comparing…" : "Compare bookmakers"}
                </button>
              </div>
              <button onClick={() => slip.clear()} className="mt-2 text-xs font-semibold text-muted hover:text-ink-900">
                Clear slip
              </button>
              {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
              {rows && (
                <div className="mt-5">
                  <h3 className="font-bold">Where this slip pays most</h3>
                  {rows.length === 0 && <p className="mt-2 text-sm text-ink-700">No bookmaker in this region offers these selections.</p>}
                  <ol className="mt-2 space-y-2">
                    {rows.map((r, idx) => (
                      <li key={r.bookmaker} className={`rounded-xl border p-3 ${idx === 0 && r.matched === r.total ? "border-brand-500 bg-brand-50" : "border-line"}`}>
                        <div className="flex items-center justify-between gap-2">
                          <Link href={`/bookmakers/${r.bookmaker}`} className="font-semibold text-ink-900">
                            {r.name}
                          </Link>
                          <span className="text-right text-sm">
                            <span className="font-bold">
                              <Odds value={r.odds} />
                            </span>
                            <span className="block text-xs text-muted tabular">returns {(stakeNum * r.odds).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                          </span>
                        </div>
                        {r.matched < r.total && <p className="mt-1 text-xs text-gold-700">Only {r.matched} of {r.total} selections available</p>}
                        {r.code && (
                          <div className="mt-2 flex items-center gap-2">
                            <code className="truncate rounded bg-surface px-2 py-1 font-mono text-xs">{r.code}</code>
                            <button onClick={() => copy(r.code!)} className="text-xs font-semibold text-brand-700">
                              {copied === r.code ? "Copied" : "Copy code"}
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                  <p className="mt-3 text-xs text-muted">Codes beginning “DM-” are demo codes generated from sample data — they won&apos;t load on real bookmaker sites. Accumulator bonuses aren&apos;t included.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
