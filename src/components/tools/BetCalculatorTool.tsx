"use client";

import { useState } from "react";
import { accumulatorReturn, combinations, parseOdds, systemBetReturn, type OddsFormat } from "@/lib/odds";

// Fixed locale so server-rendered and hydrated output match.
const MONEY = new Intl.NumberFormat("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Leg {
  odds: string;
  result: "win" | "lose";
}

export function BetCalculatorTool() {
  const [format, setFormat] = useState<OddsFormat>("decimal");
  const [stake, setStake] = useState("100");
  const [bonus, setBonus] = useState("0");
  const [legs, setLegs] = useState<Leg[]>([
    { odds: "1.85", result: "win" },
    { odds: "2.10", result: "win" },
    { odds: "1.60", result: "win" },
  ]);
  const [system, setSystem] = useState(0);

  const parsed = legs.map((l) => parseOdds(l.odds, format));
  const valid = parsed.every((p) => p !== null) && parsed.length > 0;
  const s = Math.max(0, parseFloat(stake) || 0);
  const odds = parsed.map((p) => p ?? 1);
  const results = legs.map((l) => l.result === "win");
  const allWin = results.every(Boolean);
  const acca = accumulatorReturn(s, odds, Math.max(0, parseFloat(bonus) || 0));
  const sys = system > 0 && system < legs.length ? systemBetReturn(s, odds, system, results) : null;

  const update = (i: number, patch: Partial<Leg>) => setLegs(legs.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const money = (n: number) => MONEY.format(n);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="card p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <label>
            <span className="label">Stake{system ? " per line" : ""}</span>
            <input className="input" value={stake} onChange={(e) => setStake(e.target.value)} inputMode="decimal" />
          </label>
          <label>
            <span className="label">Odds format</span>
            <select className="input" value={format} onChange={(e) => setFormat(e.target.value as OddsFormat)}>
              <option value="decimal">Decimal</option>
              <option value="fractional">Fractional</option>
              <option value="american">American</option>
            </select>
          </label>
          <label>
            <span className="label">Bet type</span>
            <select className="input" value={system} onChange={(e) => setSystem(parseInt(e.target.value))}>
              <option value={0}>Accumulator / parlay</option>
              {legs.length > 2 &&
                Array.from({ length: legs.length - 2 }, (_, i) => i + 2).map((k) => (
                  <option key={k} value={k}>
                    System {k}/{legs.length} ({combinations(legs, k).length} lines)
                  </option>
                ))}
            </select>
          </label>
        </div>
        <ol className="mt-5 space-y-2">
          {legs.map((l, i) => (
            <li key={i} className="grid grid-cols-[2rem_1fr_auto_auto] items-center gap-2">
              <span className="tabular text-sm font-semibold text-muted">#{i + 1}</span>
              <input className="input" value={l.odds} onChange={(e) => update(i, { odds: e.target.value })} aria-label={`Odds for selection ${i + 1}`} aria-invalid={parsed[i] === null} />
              <select className="input w-auto" value={l.result} onChange={(e) => update(i, { result: e.target.value as Leg["result"] })} aria-label={`Result for selection ${i + 1}`}>
                <option value="win">Win</option>
                <option value="lose">Lose</option>
              </select>
              <button onClick={() => setLegs(legs.filter((_, j) => j !== i))} disabled={legs.length === 1} className="btn-ghost px-3" aria-label={`Remove selection ${i + 1}`}>
                ×
              </button>
            </li>
          ))}
        </ol>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <button onClick={() => setLegs([...legs, { odds: "2.00", result: "win" }])} disabled={legs.length >= 20} className="btn-ghost">
            + Add selection
          </button>
          {system === 0 && (
            <label className="w-40">
              <span className="label">Acca bonus %</span>
              <input className="input" value={bonus} onChange={(e) => setBonus(e.target.value)} inputMode="decimal" />
            </label>
          )}
        </div>
      </div>
      <div className="card bg-ink-900 p-6 text-white" aria-live="polite">
        {!valid ? (
          <p className="text-white/80">Enter valid odds for every selection.</p>
        ) : sys ? (
          <dl className="space-y-4">
            <div>
              <dt className="text-sm text-white/70">Total stake ({sys.lines} lines)</dt>
              <dd className="tabular text-2xl font-bold">{money(sys.totalStake)}</dd>
            </div>
            <div>
              <dt className="text-sm text-white/70">Returns</dt>
              <dd className="tabular text-4xl font-extrabold text-brand-400">{money(sys.returns)}</dd>
            </div>
            <div>
              <dt className="text-sm text-white/70">Profit</dt>
              <dd className={`tabular text-xl font-bold ${sys.profit >= 0 ? "" : "text-red-300"}`}>{money(sys.profit)}</dd>
            </div>
          </dl>
        ) : (
          <dl className="space-y-4">
            <div>
              <dt className="text-sm text-white/70">Total odds</dt>
              <dd className="tabular text-2xl font-bold">{acca.odds.toFixed(2)}</dd>
            </div>
            <div>
              <dt className="text-sm text-white/70">{allWin ? "Returns" : "Returns (a selection lost)"}</dt>
              <dd className="tabular text-4xl font-extrabold text-brand-400">{money(allWin ? acca.returns : 0)}</dd>
            </div>
            <div>
              <dt className="text-sm text-white/70">Profit</dt>
              <dd className="tabular text-xl font-bold">{money(allWin ? acca.profit : -s)}</dd>
            </div>
            <div>
              <dt className="text-sm text-white/70">Implied chance all win</dt>
              <dd className="tabular font-semibold">{((1 / acca.odds) * 100).toFixed(2)}%</dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}
