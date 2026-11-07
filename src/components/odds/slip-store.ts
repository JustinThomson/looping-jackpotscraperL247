"use client";

import { useSyncExternalStore } from "react";
import type { MarketKey, PickKey } from "@/lib/types";

export interface SlipItem {
  fixtureId: string;
  market: MarketKey;
  pick: PickKey;
  /** Display info so the slip renders without refetching. */
  event: string;
  label: string;
  kickoff: string;
  bestOdds: number;
}

const KEY = "ob:slip";
const listeners = new Set<() => void>();
let cache: SlipItem[] | null = null;
const EMPTY: SlipItem[] = [];

function load(): SlipItem[] {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    const items = raw ? (JSON.parse(raw) as SlipItem[]) : [];
    // Drop selections whose match has started.
    cache = items.filter((i) => new Date(i.kickoff).getTime() > Date.now());
  } catch {
    cache = [];
  }
  return cache;
}

function save(items: SlipItem[]) {
  cache = items;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export const slip = {
  subscribe(l: () => void) {
    listeners.add(l);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) {
        cache = null;
        l();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(l);
      window.removeEventListener("storage", onStorage);
    };
  },
  get: load,
  toggle(item: SlipItem) {
    const items = load();
    const same = items.find((i) => i.fixtureId === item.fixtureId);
    if (same && same.market === item.market && same.pick === item.pick) {
      save(items.filter((i) => i !== same));
    } else {
      // One selection per match, like most bookmakers' accumulators.
      save([...items.filter((i) => i.fixtureId !== item.fixtureId), item].slice(-20));
    }
  },
  remove(fixtureId: string) {
    save(load().filter((i) => i.fixtureId !== fixtureId));
  },
  clear() {
    save([]);
  },
};

export function useSlip(): SlipItem[] {
  return useSyncExternalStore(slip.subscribe, slip.get, () => EMPTY);
}

export function isSelected(items: SlipItem[], fixtureId: string, market: MarketKey, pick: PickKey) {
  return items.some((i) => i.fixtureId === fixtureId && i.market === market && i.pick === pick);
}
