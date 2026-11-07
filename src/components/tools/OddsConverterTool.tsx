"use client";

import { useState } from "react";
import { decimalToAmerican, decimalToFractional, impliedProbability, parseOdds, type OddsFormat } from "@/lib/odds";

const ROWS = [1.1, 1.25, 1.5, 1.67, 1.8, 1.91, 2, 2.2, 2.5, 3, 3.5, 4, 5, 6, 8, 10, 15, 21];

export function OddsConverterTool() {
  const [format, setFormat] = useState<OddsFormat>("decimal");
  const [value, setValue] = useState("2.50");
  const d = parseOdds(value, format);
  const cards = d
    ? [
        { label: "Decimal", v: d.toFixed(3).replace(/0$/, "") },
        { label: "Fractional", v: decimalToFractional(d) },
        { label: "American", v: (decimalToAmerican(d) > 0 ? "+" : "") + decimalToAmerican(d) },
        { label: "Implied probability", v: `${(impliedProbability(d) * 100).toFixed(2)}%` },
      ]
    : [];
  return (
    <div className="space-y-8">
      <div className="card p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
          <label>
            <span className="label">I have odds in</span>
            <select className="input" value={format} onChange={(e) => setFormat(e.target.value as OddsFormat)}>
              <option value="decimal">Decimal (2.50)</option>
              <option value="fractional">Fractional (6/4)</option>
              <option value="american">American (+150)</option>
            </select>
          </label>
          <label>
            <span className="label">Odds</span>
            <input className="input text-lg font-semibold" value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal" aria-invalid={!d} />
          </label>
        </div>
        {d ? (
          <dl className="mt-5 grid gap-3 sm:grid-cols-4">
            {cards.map((c) => (
              <div key={c.label} className="rounded-xl bg-surface p-4">
                <dt className="text-xs font-semibold text-muted uppercase">{c.label}</dt>
                <dd className="tabular mt-1 text-2xl font-extrabold">{c.v}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-4 text-sm text-red-700">Enter valid {format} odds (e.g. {format === "decimal" ? "2.50" : format === "fractional" ? "6/4" : "+150 or -110"}).</p>
        )}
      </div>
      <div>
        <h2 className="text-xl font-bold">Odds conversion chart</h2>
        <div className="card mt-3 overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="border-b border-line bg-surface text-left">
                <th className="px-4 py-2.5">Decimal</th>
                <th className="px-4 py-2.5">Fractional</th>
                <th className="px-4 py-2.5">American</th>
                <th className="px-4 py-2.5">Implied probability</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r} className="tabular border-b border-line last:border-0">
                  <td className="px-4 py-2">{r.toFixed(2)}</td>
                  <td className="px-4 py-2">{decimalToFractional(r)}</td>
                  <td className="px-4 py-2">{(decimalToAmerican(r) > 0 ? "+" : "") + decimalToAmerican(r)}</td>
                  <td className="px-4 py-2">{(100 / r).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
