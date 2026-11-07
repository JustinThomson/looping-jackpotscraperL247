import { NextResponse, type NextRequest } from "next/server";
import { bookmakerBySlug } from "@/data/bookmakers";

/**
 * Outbound redirect for bookmaker links. Centralising outbound links lets you
 * swap in affiliate tracking URLs (via AFFILIATE_<SLUG>_<COUNTRY> env vars)
 * without touching content, and keeps them out of the search index.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const b = bookmakerBySlug(slug);
  if (!b) return NextResponse.redirect(new URL("/bookmakers", req.url), 302);
  const country = req.nextUrl.searchParams.get("c");
  const market = b.markets.find((m) => m.country === country) ?? b.markets[0];
  const envKey = `AFFILIATE_${slug.replace(/-/g, "_").toUpperCase()}_${market.country.toUpperCase()}`;
  const target = process.env[envKey] || market.url;
  const res = NextResponse.redirect(target, 302);
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "no-store");
  return res;
}
