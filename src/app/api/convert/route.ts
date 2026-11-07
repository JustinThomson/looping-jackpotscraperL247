import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/server/rate-limit";
import { convertBookingCode, ConverterError, CodeFormatError } from "@/lib/converter";
import type { CountryCode } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const limited = rateLimit(req, "convert", 30);
  if (limited) return limited;
  let body: { from?: string; to?: string; code?: string; country?: CountryCode; toCountry?: CountryCode };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!body.from || !body.to || !body.code) {
    return NextResponse.json({ error: "Please choose both bookmakers and enter a booking code." }, { status: 400 });
  }
  try {
    const result = await convertBookingCode({ from: body.from, to: body.to, code: body.code, country: body.country, toCountry: body.toCountry });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ConverterError || err instanceof CodeFormatError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    console.error("[convert]", err);
    return NextResponse.json({ error: "Something went wrong converting this code. Please try again." }, { status: 500 });
  }
}
