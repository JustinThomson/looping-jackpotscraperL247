"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Odds, OddsFormatToggle } from "@/components/Preferences";
import type { ConversionResult, ConvertedSelection, CountryCode } from "@/lib/types";

export interface ConverterBook {
  slug: string;
  name: string;
  codeName: string;
  countries: { code: CountryCode; name: string; flag: string }[];
}

const STATUS: Record<ConvertedSelection["status"], { label: string; cls: string }> = {
  matched: { label: "Converted", cls: "bg-brand-100 text-brand-800" },
  "market-unavailable": { label: "Market unavailable", cls: "bg-gold-100 text-gold-700" },
  "event-not-found": { label: "Match not found", cls: "bg-red-100 text-red-800" },
  started: { label: "Already started", cls: "bg-surface text-ink-700" },
};

interface CompareRow {
  bookmaker: string;
  matched: number;
  total: number;
  odds: number;
  code?: string;
}

export function Converter({ books, defaultFrom = "sportybet", defaultTo = "bet9ja", compact = false }: { books: ConverterBook[]; defaultFrom?: string; defaultTo?: string; compact?: boolean }) {
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [country, setCountry] = useState<CountryCode | "">("");
  const [code, setCode] = useState("");
  const [examples, setExamples] = useState<{ code: string; legs: number }[]>([]);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [compare, setCompare] = useState<CompareRow[] | null>(null);
  const [loading, setLoading] = useState<"convert" | "compare" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const byslug = useMemo(() => Object.fromEntries(books.map((b) => [b.slug, b])), [books]);
  const fromBook = byslug[from];
  const toBook = byslug[to];

  // Prefill from URL (?from=&to=&code=) so conversions can be shared.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const f = p.get("from");
    const t = p.get("to");
    const c = p.get("code");
    if (f && byslug[f]) setFrom(f);
    if (t && byslug[t]) setTo(t);
    if (c) setCode(c.slice(0, 200));
  }, [byslug]);

  useEffect(() => {
    let cancelled = false;
    setExamples([]);
    fetch(`/api/examples?bookmaker=${from}`)
      .then((r) => (r.ok ? r.json() : { codes: [] }))
      .then((d) => !cancelled && setExamples(d.codes ?? []))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [from]);

  useEffect(() => {
    if (fromBook && country && !fromBook.countries.some((c) => c.code === country)) setCountry("");
  }, [fromBook, country]);

  async function post<T>(url: string, body: unknown): Promise<T> {
    const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Something went wrong.");
    return data as T;
  }

  async function onConvert(e?: React.FormEvent) {
    e?.preventDefault();
    if (!code.trim()) return setError("Enter a booking code to convert.");
    setLoading("convert");
    setError(null);
    setCompare(null);
    try {
      const r = await post<ConversionResult>("/api/convert", { from, to, code: code.trim(), country: country || undefined });
      setResult(r);
      const url = new URL(window.location.href);
      url.searchParams.set("from", from);
      url.searchParams.set("to", to);
      url.searchParams.set("code", code.trim());
      window.history.replaceState(null, "", url);
    } catch (err) {
      setResult(null);
      setError((err as Error).message);
    } finally {
      setLoading(null);
    }
  }

  async function onCompare() {
    if (!code.trim()) return setError("Enter a booking code first.");
    setLoading("compare");
    setError(null);
    try {
      const r = await post<{ rows: CompareRow[] }>("/api/convert/compare", { from, code: code.trim(), country: country || undefined });
      setCompare(r.rows);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(null);
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div>
      <form onSubmit={onConvert} className="card p-4 sm:p-6" aria-label="Booking code converter">
        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr]">
          <div>
            <label htmlFor="cv-from" className="label">
              From bookmaker
            </label>
            <select id="cv-from" className="input" value={from} onChange={(e) => setFrom(e.target.value)}>
              {books.map((b) => (
                <option key={b.slug} value={b.slug} disabled={b.slug === to}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end justify-center">
            <button
              type="button"
              onClick={() => {
                setFrom(to);
                setTo(from);
                setResult(null);
              }}
              className="btn-ghost h-[42px] w-full md:w-auto"
              aria-label="Swap bookmakers"
              title="Swap"
            >
              ⇄
            </button>
          </div>
          <div>
            <label htmlFor="cv-to" className="label">
              To bookmaker
            </label>
            <select id="cv-to" className="input" value={to} onChange={(e) => setTo(e.target.value)}>
              {books.map((b) => (
                <option key={b.slug} value={b.slug} disabled={b.slug === from}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_12rem]">
          <div>
            <label htmlFor="cv-code" className="label">
              {fromBook?.name} {fromBook?.codeName ?? "booking code"}
            </label>
            <input
              id="cv-code"
              className="input font-mono uppercase"
              placeholder="e.g. DM-SPB-…"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              maxLength={200}
            />
          </div>
          <div>
            <label htmlFor="cv-country" className="label">
              Country
            </label>
            <select id="cv-country" className="input" value={country} onChange={(e) => setCountry(e.target.value as CountryCode)}>
              <option value="">Auto</option>
              {fromBook?.countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {examples.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-muted">Try a demo code:</span>
            {examples.map((ex) => (
              <button key={ex.code} type="button" onClick={() => setCode(ex.code)} className="chip font-mono hover:border-brand-500" title={`${ex.legs}-leg demo slip`}>
                {ex.code.length > 18 ? `${ex.code.slice(0, 16)}…` : ex.code} · {ex.legs} legs
              </button>
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <button type="submit" className="btn-primary min-w-44" disabled={loading !== null}>
            {loading === "convert" ? "Converting…" : `Convert to ${toBook?.name ?? "…"}`}
          </button>
          {!compact && (
            <button type="button" onClick={onCompare} className="btn-ghost" disabled={loading !== null}>
              {loading === "compare" ? "Comparing…" : "Compare across all bookmakers"}
            </button>
          )}
        </div>
        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}
      </form>

      {result && (
        <section className="card mt-6 overflow-hidden" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-ink-900 px-5 py-4 text-white">
            <div>
              <p className="text-sm text-white/70">
                {byslug[result.from.bookmaker]?.name} → {byslug[result.to.bookmaker]?.name}
              </p>
              <p className="text-lg font-bold">
                {result.matchedCount} of {result.selections.length} selections converted
              </p>
            </div>
            {result.to.code ? (
              <div className="flex items-center gap-2">
                <code className="rounded-lg bg-white/10 px-3 py-2 font-mono text-base font-bold tracking-wide">{result.to.code}</code>
                <button onClick={() => copy(result.to.code!)} className="btn-primary py-2">
                  {copied ? "Copied!" : "Copy code"}
                </button>
              </div>
            ) : (
              <p className="text-sm text-white/80">No selections could be converted.</p>
            )}
          </div>
          {result.demo && (
            <p className="border-b border-gold-400 bg-gold-100 px-5 py-2 text-xs text-gold-700">
              Demo mode: matches, odds and codes are simulated from sample data. Codes starting “DM-” work in this converter only, not on bookmaker sites.
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <dl className="flex gap-6 text-sm">
              <div>
                <dt className="text-muted">Total odds on {byslug[result.from.bookmaker]?.name}</dt>
                <dd className="text-lg font-bold">
                  <Odds value={result.totalOdds.source} />
                </dd>
              </div>
              <div>
                <dt className="text-muted">Total odds on {byslug[result.to.bookmaker]?.name}</dt>
                <dd className={`text-lg font-bold ${result.totalOdds.target > result.totalOdds.source ? "text-brand-700" : ""}`}>
                  <Odds value={result.totalOdds.target} />
                </dd>
              </div>
            </dl>
            <OddsFormatToggle />
          </div>
          {result.warnings.length > 0 && (
            <ul className="mx-5 mb-4 space-y-1 rounded-xl bg-gold-100 px-4 py-3 text-sm text-gold-700">
              {result.warnings.map((w) => (
                <li key={w}>⚠ {w}</li>
              ))}
            </ul>
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-y border-line bg-surface text-left">
                  <th className="px-5 py-2.5 font-semibold">{byslug[result.from.bookmaker]?.name} selection</th>
                  <th className="px-3 py-2.5 font-semibold">{byslug[result.to.bookmaker]?.name} equivalent</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Odds</th>
                  <th className="px-5 py-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {result.selections.map((s, i) => (
                  <tr key={i} className="border-b border-line align-top last:border-0">
                    <td className="px-5 py-3">
                      <p className="font-semibold">{s.source.label?.event ?? `${s.source.home} vs ${s.source.away}`}</p>
                      <p className="text-ink-700">
                        {s.source.label?.market}: <strong>{s.source.label?.pick}</strong>
                      </p>
                      <p className="text-xs text-muted" suppressHydrationWarning>
                        {new Date(s.source.kickoff).toLocaleString(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      {s.target ? (
                        <>
                          <p className="font-semibold">{s.target.label?.event}</p>
                          <p className="text-ink-700">
                            {s.target.label?.market}: <strong>{s.target.label?.pick}</strong>
                          </p>
                        </>
                      ) : (
                        <p className="text-muted">{s.note}</p>
                      )}
                    </td>
                    <td className="tabular px-3 py-3 text-right whitespace-nowrap">
                      <span className="text-muted">{s.source.odds ? <Odds value={s.source.odds} /> : "–"}</span>
                      {s.target?.odds && (
                        <>
                          {" → "}
                          <strong className={s.target.odds > (s.source.odds ?? 0) ? "text-brand-700" : ""}>
                            <Odds value={s.target.odds} />
                          </strong>
                        </>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS[s.status].cls}`}>{STATUS[s.status].label}</span>
                      {s.status === "matched" && s.confidence !== undefined && s.confidence < 0.97 && <p className="mt-1 text-xs text-muted">Match confidence {(s.confidence * 100).toFixed(0)}%</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-3 border-t border-line px-5 py-4 text-sm">
            <span className="text-ink-700">
              Load it on {byslug[result.to.bookmaker]?.name}: open the betslip → {byslug[result.to.bookmaker]?.codeName} → paste.
            </span>
            <Link href={`/bookmakers/${result.to.bookmaker}`}>{byslug[result.to.bookmaker]?.name} review</Link>
          </div>
        </section>
      )}

      {compare && (
        <section className="card mt-6 p-5" aria-live="polite">
          <h3 className="text-lg font-bold">Where this slip pays the most</h3>
          <p className="text-sm text-ink-700">The same {fromBook?.name} code converted to every bookmaker we support, ranked by selections matched and total odds.</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="py-2 font-semibold">Bookmaker</th>
                  <th className="py-2 text-center font-semibold">Converted</th>
                  <th className="py-2 text-right font-semibold">Total odds</th>
                  <th className="py-2 pl-4 font-semibold">Code</th>
                </tr>
              </thead>
              <tbody>
                {compare.map((r, i) => (
                  <tr key={r.bookmaker} className={`border-b border-line last:border-0 ${i === 0 ? "bg-brand-50" : ""}`}>
                    <td className="py-2 font-semibold">
                      <Link href={`/bookmakers/${r.bookmaker}`} className="text-ink-900">
                        {byslug[r.bookmaker]?.name}
                      </Link>
                    </td>
                    <td className="tabular py-2 text-center">
                      {r.matched}/{r.total}
                    </td>
                    <td className="py-2 text-right font-bold">
                      <Odds value={r.odds} />
                    </td>
                    <td className="py-2 pl-4">
                      {r.code ? (
                        <button className="font-mono text-xs font-semibold text-brand-700 hover:underline" onClick={() => copy(r.code!)} title="Copy code">
                          {r.code.length > 20 ? `${r.code.slice(0, 18)}…` : r.code}
                        </button>
                      ) : (
                        "–"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
