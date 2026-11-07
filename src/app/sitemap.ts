import type { MetadataRoute } from "next";
import { bookmakers } from "@/data/bookmakers";
import { countries } from "@/data/countries";
import { leagues } from "@/data/leagues";
import { comparePairs } from "@/lib/compare";
import { converterPairs } from "@/lib/converter/books";
import { converterBookmakers } from "@/lib/converter";
import { getGuides } from "@/lib/guides";
import { getAllFixtures } from "@/lib/odds-data";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const e = (path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"], lastModified: Date | string = now) => ({
    url: absoluteUrl(path),
    lastModified,
    changeFrequency,
    priority,
  });
  const fixtures = await getAllFixtures();
  return [
    e("/", 1, "daily"),
    e("/odds", 0.9, "hourly"),
    e("/odds/today", 0.9, "hourly"),
    e("/booking-codes", 0.8, "weekly"),
    ...converterBookmakers().map((b) => e(`/booking-codes/${b.slug}`, 0.8, "weekly")),
    e("/booking-code-converter", 0.9, "weekly"),
    e("/bookmakers", 0.8, "weekly"),
    e("/bonuses", 0.8, "daily"),
    e("/betting-sites", 0.8, "weekly"),
    e("/compare", 0.6, "weekly"),
    e("/guides", 0.7, "weekly"),
    e("/tools", 0.6, "monthly"),
    e("/tools/odds-converter", 0.6, "monthly"),
    e("/tools/bet-calculator", 0.6, "monthly"),
    e("/tools/margin-calculator", 0.6, "monthly"),
    ...["/about", "/methodology", "/responsible-gambling", "/affiliate-disclosure", "/privacy", "/terms", "/contact"].map((p) => e(p, 0.3, "yearly")),
    ...countries.flatMap((c) => [e(`/betting-sites/${c.slug}`, 0.9, "weekly"), e(`/bonuses/${c.slug}`, 0.8, "weekly"), e(`/betting-apps/${c.slug}`, 0.7, "weekly")]),
    ...bookmakers.map((b) => e(`/bookmakers/${b.slug}`, 0.8, "weekly")),
    ...leagues.map((l) => e(`/odds/${l.slug}`, 0.7, "hourly")),
    ...fixtures.map((f) => e(`/odds/match/${f.id}`, 0.5, "hourly")),
    ...converterPairs().map((p) => e(`/booking-code-converter/${p.slug}`, 0.7, "monthly")),
    ...comparePairs().map((p) => e(`/compare/${p.slug}`, 0.5, "monthly")),
    ...getGuides().map((g) => e(`/guides/${g.slug}`, 0.7, "monthly", g.updated)),
  ];
}
