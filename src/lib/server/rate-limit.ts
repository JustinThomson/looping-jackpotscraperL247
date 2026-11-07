import { NextResponse } from "next/server";

/**
 * Tiny in-memory sliding-window rate limiter for API routes.
 * Per server instance only — put a shared store (e.g. Redis) or edge rate
 * limiting in front for multi-instance deployments.
 */
const hits = new Map<string, number[]>();
let lastSweep = Date.now();

export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] || req.headers.get("x-real-ip") || "anon").trim();
}

export function rateLimit(req: Request, bucket: string, limit = 30, windowMs = 60_000): NextResponse | null {
  const now = Date.now();
  if (now - lastSweep > windowMs) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
    lastSweep = now;
  }
  const key = `${bucket}:${clientKey(req)}`;
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    const retry = Math.ceil((windowMs - (now - recent[0])) / 1000);
    return NextResponse.json({ error: "Too many requests — please wait a moment and try again." }, { status: 429, headers: { "Retry-After": String(retry) } });
  }
  recent.push(now);
  hits.set(key, recent);
  return null;
}
