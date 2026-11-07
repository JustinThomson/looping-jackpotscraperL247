import { NextResponse } from "next/server";
import { exampleCodes } from "@/lib/converter/adapters/demo";
import { converterBookmakers } from "@/lib/converter";

export const dynamic = "force-dynamic";

/** Demo booking codes for a bookmaker, for trying the converter. */
export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("bookmaker") ?? "";
  if (!converterBookmakers().some((b) => b.slug === slug)) return NextResponse.json({ error: "Unknown bookmaker" }, { status: 404 });
  return NextResponse.json({ codes: await exampleCodes(slug, 3) }, { headers: { "Cache-Control": "public, max-age=300" } });
}
