import type { MarketKey, PickKey } from "@/lib/types";
import { hashString } from "@/lib/random";

/**
 * Compact, self-describing demo booking codes.
 *
 * Real bookmaker codes are database keys on the bookmaker's servers. Demo mode
 * has no server-side store, so the code itself carries the selections:
 *   DM-<PREFIX>-<base32(payload + checksum)>
 * Each selection uses 3 bytes: a 20-bit fixture hash and a 4-bit market/pick index.
 * The "DM-" prefix makes it obvious these are not real bookmaker codes.
 */

export const MARKET_PICKS: [MarketKey, PickKey][] = [
  ["1x2", "home"],
  ["1x2", "draw"],
  ["1x2", "away"],
  ["moneyline", "home"],
  ["moneyline", "away"],
  ["double_chance", "1x"],
  ["double_chance", "12"],
  ["double_chance", "x2"],
  ["draw_no_bet", "home"],
  ["draw_no_bet", "away"],
  ["over_under", "over"],
  ["over_under", "under"],
  ["btts", "yes"],
  ["btts", "no"],
];

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford base32 (no I, L, O, U)

export function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(s: string): Uint8Array {
  const clean = s.toUpperCase().replace(/O/g, "0").replace(/[IL]/g, "1");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const v = ALPHABET.indexOf(ch);
    if (v < 0) throw new Error(`Invalid character "${ch}"`);
    value = ((value << 5) | v) & 0xffff;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

function checksum(bytes: number[], salt: string): number {
  let c = hashString(salt) & 0xff;
  for (const b of bytes) c = (c * 31 + b) & 0xff;
  return c;
}

export function fixtureHash(fixtureId: string): number {
  return hashString(fixtureId) & 0xfffff;
}

export interface CodeSelection {
  fixtureId: string;
  market: MarketKey;
  pick: PickKey;
}

export function encodeDemoCode(prefix: string, selections: CodeSelection[]): string {
  if (!selections.length) throw new Error("A booking code needs at least one selection");
  if (selections.length > 30) throw new Error("Too many selections");
  const bytes: number[] = [];
  for (const s of selections) {
    const idx = MARKET_PICKS.findIndex(([m, p]) => m === s.market && p === s.pick);
    if (idx < 0) throw new Error(`Unsupported market ${s.market}/${s.pick}`);
    const v = (fixtureHash(s.fixtureId) << 4) | idx;
    bytes.push((v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff);
  }
  bytes.push(checksum(bytes, prefix));
  return `DM-${prefix}-${base32Encode(new Uint8Array(bytes))}`;
}

export interface DecodedCode {
  prefix: string;
  selections: { fixtureHash: number; market: MarketKey; pick: PickKey }[];
}

export class CodeFormatError extends Error {}

export function decodeDemoCode(code: string): DecodedCode {
  const m = code.trim().toUpperCase().replace(/\s+/g, "").match(/^DM-([A-Z0-9]{2,5})-([0-9A-Z]+)$/);
  if (!m) throw new CodeFormatError("This doesn't look like a demo booking code (expected DM-XXX-...).");
  const [, prefix, body] = m;
  const bytes = Array.from(base32Decode(body));
  // Reject non-canonical encodings (e.g. a typo in the final character's padding bits).
  if (base32Encode(new Uint8Array(bytes)) !== body) throw new CodeFormatError("Booking code checksum failed — please check for typos.");
  // Base32 padding can add a trailing partial byte; selections are 3 bytes + 1 checksum.
  const usable = bytes.length - ((bytes.length - 1) % 3);
  const data = bytes.slice(0, usable - 1);
  const check = bytes[usable - 1];
  if (data.length === 0 || data.length % 3 !== 0 || checksum(data, prefix) !== check) {
    throw new CodeFormatError("Booking code checksum failed — please check for typos.");
  }
  const selections: DecodedCode["selections"] = [];
  for (let i = 0; i < data.length; i += 3) {
    const v = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
    const idx = v & 0xf;
    const mp = MARKET_PICKS[idx];
    if (!mp) throw new CodeFormatError("Booking code contains an unknown market.");
    selections.push({ fixtureHash: v >>> 4, market: mp[0], pick: mp[1] });
  }
  return { prefix, selections };
}
