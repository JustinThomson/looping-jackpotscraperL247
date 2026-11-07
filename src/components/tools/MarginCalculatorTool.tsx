"use client";

import { useState } from "react";
import { arbitrage, fairOdds, marketMargin, parseOdds } from "@/lib/odds";

export function MarginCalculatorTool() {
  const [outcomes, setOutcomes] = useState(["2.10", "3.40", "3.50"]);
  const [stake, setStake] = useState("100");
  const odds = outcomes.map((o) => parseOdds(o, "decimal"));
  const valid = odds.every((o) => o !== null) && odds.length >= 2;
  const d = odds.map((o) => o ?? 2);
  const margin = valid ? marketMargin(d) : NaN;
  const fair = valid ? fairOdds(d) : [];
  const arb = valid ? arbitrage(d, Math.max(0, parseFloat(stake) || 0)) : null;
  const labels = outcomes.length === 3 ? ["Home", "Draw", "Away"] : outcomes.map((_, i) => `Outcome ${i + 1}`);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="card p-5 sm:p-6">
        <div className="flex gap-2">
          {[2, 3].map((n) => (
            <button key={n} onClick={() => setOutcomes(n === 2 ? ["1.91", "1.91"] : ["2.10", "3.40", "3.50"])} className={outcomes.length === n ? "btn-dark" : "btn-ghost"}>
              {n}-way market
            </button>
          ))}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {outcomes.map((o, i) => (
            <label key={i}>
              <span className="label">{labels[i]} (decimal)</span>
              <input className="input text-lg font-semibold" value={o} inputMode="decimal" aria-invalid={odds[i] === null} onChange={(e) => setOutcomes(outcomes.map((x, j) => (j === i ? e.target.value : x)))} />
            </label>
          ))}
        </div>
        {valid && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="py-2">Outcome</th>
                  <th className="py-2">Odds</th>
                  <th className="py-2">Implied %</th>
                  <th className="py-2">Fair odds</th>
                </tr>
              </thead>
              <tbody>
                {d.map((o, i) => (
                  <tr key={i} className="tabular border-b border-line last:border-0">
                    <td className="py-2">{labels[i]}</td>
                    <td className="py-2">{o.toFixed(2)}</td>
                    <td className="py-2">{(100 / o).toFixed(2)}%</td>
                    <td className="py-2 font-semibold">{fair[i].toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <label className="mt-6 block w-48">
          <span className="label">Total stake (for arbitrage split)</span>
          <input className="input" value={stake} onChange={(e) => setStake(e.target.value)} inputMode="decimal" />
        </label>
      </div>
      <div className="card bg-ink-900 p-6 text-white" aria-live="polite">
        {valid ? (
          <dl className="space-y-4">
            <div>
              <dt className="text-sm text-white/70">Bookmaker margin</dt>
              <dd className="tabular text-4xl font-extrabold text-brand-400">{(margin * 100).toFixed(2)}%</dd>
            </div>
            <div>
              <dt className="text-sm text-white/70">Payout (return to player)</dt>
              <dd className="tabular text-xl font-bold">{(100 / (1 + margin)).toFixed(2)}%</dd>
            </div>
            {arb?.isArb && (
              <div className="rounded-xl bg-brand-600/20 p-3 text-sm">
                <p className="font-bold text-brand-400">Arbitrage: {(arb.roi * 100).toFixed(2)}% guaranteed return</p>
                <ul className="mt-1 space-y-0.5 tabular">
                  {arb.stakes.map((st, i) => (
                    <li key={i}>
                      {labels[i]}: stake {st.toFixed(2)}
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-white/70">Odds move fast and bookmakers may void or limit arbitrage bets.</p>
              </div>
            )}
          </dl>
        ) : (
          <p className="text-white/80">Enter decimal odds greater than 1.00 for every outcome.</p>
        )}
      </div>
    </div>
  );
}
