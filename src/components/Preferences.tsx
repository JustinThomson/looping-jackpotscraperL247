"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { formatOdds, type OddsFormat } from "@/lib/odds";
import type { RegionKey } from "@/lib/types";

export type RegionPref = RegionKey | "all";

interface Prefs {
  format: OddsFormat;
  region: RegionPref;
  setFormat: (f: OddsFormat) => void;
  setRegion: (r: RegionPref) => void;
}

const Ctx = createContext<Prefs>({ format: "decimal", region: "all", setFormat: () => {}, setRegion: () => {} });

function read<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const v = window.localStorage.getItem(key) as T | null;
    return v && allowed.includes(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}

const FORMATS = ["decimal", "fractional", "american"] as const;
const REGIONS = ["all", "south-africa", "africa", "united-states", "europe"] as const;

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [format, setFormatState] = useState<OddsFormat>("decimal");
  const [region, setRegionState] = useState<RegionPref>("all");

  useEffect(() => {
    const storedFormat = read<OddsFormat | "">("ob:format", [...FORMATS, ""], "");
    if (storedFormat) setFormatState(storedFormat);
    const stored = read<RegionPref | "">("ob:region", [...REGIONS, ""], "");
    if (stored) {
      setRegionState(stored);
      return;
    }
    // First visit: ask the server for a geo hint (CDN header) and default to that region.
    fetch("/api/geo")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { region: RegionPref | null } | null) => {
        if (d?.region && (REGIONS as readonly string[]).includes(d.region)) {
          setRegionState(d.region);
          write("ob:region", d.region);
          if (d.region === "united-states" && !storedFormat) {
            setFormatState("american");
            write("ob:format", "american");
          }
        }
      })
      .catch(() => {});
  }, []);

  const setFormat = useCallback((f: OddsFormat) => {
    setFormatState(f);
    write("ob:format", f);
  }, []);
  const setRegion = useCallback((r: RegionPref) => {
    setRegionState(r);
    write("ob:region", r);
  }, []);

  return <Ctx.Provider value={{ format, region, setFormat, setRegion }}>{children}</Ctx.Provider>;
}

export const usePrefs = () => useContext(Ctx);

/** Displays decimal odds in the visitor's preferred format. */
export function Odds({ value }: { value: number }) {
  const { format } = usePrefs();
  return <span className="tabular">{formatOdds(value, format)}</span>;
}

export function OddsFormatToggle({ className = "" }: { className?: string }) {
  const { format, setFormat } = usePrefs();
  return (
    <div role="radiogroup" aria-label="Odds format" className={`inline-flex rounded-xl border border-line bg-white p-0.5 text-xs font-semibold ${className}`}>
      {FORMATS.map((f) => (
        <button
          key={f}
          role="radio"
          aria-checked={format === f}
          onClick={() => setFormat(f)}
          className={`rounded-lg px-2.5 py-1.5 capitalize transition-colors ${format === f ? "bg-ink-900 text-white" : "text-ink-700 hover:bg-surface"}`}
        >
          {f}
        </button>
      ))}
    </div>
  );
}

export const REGION_OPTIONS: { value: RegionPref; label: string }[] = [
  { value: "all", label: "All regions" },
  { value: "south-africa", label: "South Africa" },
  { value: "africa", label: "Rest of Africa" },
  { value: "united-states", label: "United States" },
  { value: "europe", label: "Europe & UK" },
];

export function RegionSelect({ className = "" }: { className?: string }) {
  const { region, setRegion } = usePrefs();
  return (
    <label className={`inline-flex items-center gap-2 text-xs font-semibold text-ink-700 ${className}`}>
      <span className="sr-only sm:not-sr-only">Bookmakers in</span>
      <select value={region} onChange={(e) => setRegion(e.target.value as RegionPref)} className="input w-auto py-1.5 text-xs">
        {REGION_OPTIONS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
    </label>
  );
}
