#!/usr/bin/env node
/**
 * Smoke test: fetch every URL in the sitemap (rewritten to BASE_URL) and
 * report any non-200 responses or slow pages.
 *   BASE_URL=http://localhost:3000 npm run smoke
 */
const BASE = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const CONCURRENCY = Number(process.env.CONCURRENCY || 8);

const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => BASE + new URL(m[1]).pathname);
console.log(`Checking ${urls.length} URLs on ${BASE} …`);

const failures = [];
const slow = [];
let i = 0;
async function worker() {
  while (i < urls.length) {
    const url = urls[i++];
    const t = Date.now();
    try {
      const res = await fetch(url, { redirect: "manual" });
      const ms = Date.now() - t;
      if (res.status !== 200) failures.push(`${res.status} ${url}`);
      else if (ms > 3000) slow.push(`${ms}ms ${url}`);
      await res.arrayBuffer();
    } catch (e) {
      failures.push(`ERR ${url} ${e.message}`);
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

if (slow.length) console.log(`Slow pages:\n  ${slow.join("\n  ")}`);
if (failures.length) {
  console.error(`✗ ${failures.length} failing URL(s):\n  ${failures.join("\n  ")}`);
  process.exit(1);
}
console.log(`✓ All ${urls.length} URLs returned 200`);
