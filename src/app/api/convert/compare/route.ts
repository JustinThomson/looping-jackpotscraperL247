import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/server/rate-limit";
import { compareAcrossBookmakers, getAdapter, ConverterError, CodeFormatError } from "@/lib/converter";
import type { CountryCode } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Convert one code to every supported bookmaker and rank by total odds. */
export async function POST(req: Request) {
  const limited = rateLimit(req, "compare", 10);
  if (limited) return limited;
  let body: { from?: string; code?: string; country?: CountryCode };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  if (!body.from || !body.code) return NextResponse.json({ error: "Choose a bookmaker and enter a code." }, { status: 400 });
  try {
    // Validate the code once up front so we can return a helpful error.
    await getAdapter(body.from).decode(body.code, body.country ?? "ng");
    const rows = await compareAcrossBookmakers(body.from, body.code, body.country);
    return NextResponse.json({ rows });
  } catch (err) {
    if (err instanceof ConverterError || err instanceof CodeFormatError) return NextResponse.json({ error: err.message }, { status: 422 });
    console.error("[convert/compare]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
