"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { SearchDoc } from "@/lib/search-index";

function normalize(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Rank documents: every query word must match; title matches weigh more. */
export function rank(docs: SearchDoc[], q: string): SearchDoc[] {
  const words = normalize(q).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return docs
    .map((d) => {
      const title = normalize(d.title);
      const text = normalize(d.text);
      let score = 0;
      for (const w of words) {
        if (title.includes(w)) score += title.startsWith(w) ? 4 : 3;
        else if (text.includes(w)) score += 1;
        else return null;
      }
      return { d, score };
    })
    .filter((x): x is { d: SearchDoc; score: number } => x !== null)
    .sort((a, b) => b.score - a.score || a.d.title.localeCompare(b.d.title))
    .map((x) => x.d)
    .slice(0, 40);
}

export function SearchResults({ docs }: { docs: SearchDoc[] }) {
  const [q, setQ] = useState("");
  useEffect(() => setQ(new URLSearchParams(window.location.search).get("q") ?? ""), []);
  const results = useMemo(() => rank(docs, q), [docs, q]);

  return (
    <div>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          const url = new URL(window.location.href);
          url.searchParams.set("q", q);
          window.history.replaceState(null, "", url);
        }}
      >
        <label htmlFor="site-search" className="label">
          Search bookmakers, countries, guides and odds
        </label>
        <input id="site-search" type="search" className="input text-lg" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. SportyBet, Kenya, accumulator" autoFocus />
      </form>
      {q.trim() && (
        <p className="mt-4 text-sm text-muted" aria-live="polite">
          {results.length} result{results.length === 1 ? "" : "s"} for “{q.trim()}”
        </p>
      )}
      <ul className="mt-3 space-y-2">
        {results.map((r) => (
          <li key={r.url}>
            <Link href={r.url} className="card block p-4 text-ink-900 no-underline hover:border-brand-500 hover:no-underline">
              <span className="chip mr-2">{r.type}</span>
              <span className="font-semibold">{r.title}</span>
              <span className="mt-1 block text-sm text-ink-700">{r.text}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
