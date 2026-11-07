import { NextResponse } from "next/server";
import { countries } from "@/data/countries";

export const dynamic = "force-dynamic";

/** Region hint from CDN geo headers (Vercel / Cloudflare). Returns { region: null } when unknown. */
export async function GET(req: Request) {
  const code = (req.headers.get("x-vercel-ip-country") || req.headers.get("cf-ipcountry") || "").toLowerCase();
  const country = countries.find((c) => c.code === code || (code === "uk" && c.code === "gb"));
  const EUROPE_EXTRA = new Set(["fr", "pt", "be", "at", "ch", "dk", "no", "fi", "pl", "gr", "ro", "cz"]);
  const region = country?.region ?? (EUROPE_EXTRA.has(code) ? "europe" : null);
  return NextResponse.json({ country: country?.code ?? null, region }, { headers: { "Cache-Control": "private, no-store" } });
}
