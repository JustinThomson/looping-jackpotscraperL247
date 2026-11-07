import { describe, expect, it } from "vitest";
import { extractFaqs, getGuides, parseFrontmatter } from "@/lib/guides";
import { bookmakers } from "@/data/bookmakers";
import { countries } from "@/data/countries";

describe("guide parsing", () => {
  it("parses frontmatter with colons in values", () => {
    const { data, body } = parseFrontmatter("---\ntitle: Odds: explained\nregions: africa, europe\n---\nHello");
    expect(data.title).toBe("Odds: explained");
    expect(data.regions).toBe("africa, europe");
    expect(body.trim()).toBe("Hello");
  });

  it("extracts FAQ section", () => {
    const { body, faqs } = extractFaqs("Intro\n\n## Section\nText\n\n## FAQ\n\n### Is it **free**?\nYes, see [here](/x).\n\n### Second?\nAnswer two.\n");
    expect(body).not.toContain("FAQ");
    expect(faqs).toEqual([
      { q: "Is it **free**?", a: "Yes, see here." },
      { q: "Second?", a: "Answer two." },
    ]);
  });
});

describe("guide content", () => {
  const guides = getGuides();
  const slugs = new Set(guides.map((g) => g.slug));
  const staticRoutes = new Set([
    "/", "/odds", "/odds/today", "/bonuses", "/bookmakers", "/betting-sites", "/booking-code-converter", "/booking-codes", "/guides", "/tools", "/compare",
    "/tools/odds-converter", "/tools/bet-calculator", "/tools/margin-calculator", "/responsible-gambling", "/methodology", "/about", "/contact",
  ]);

  it("loads every guide with metadata and FAQs", () => {
    expect(guides.length).toBeGreaterThanOrEqual(14);
    for (const g of guides) {
      expect(g.title.length, g.slug).toBeGreaterThan(10);
      expect(g.description.length, g.slug).toBeGreaterThan(80);
      expect(g.faqs.length, g.slug).toBeGreaterThanOrEqual(3);
      expect(g.toc.length, g.slug).toBeGreaterThanOrEqual(3);
      for (const r of g.related) expect(slugs.has(r), `${g.slug} related ${r}`).toBe(true);
    }
  });

  it("only links to routes that exist", () => {
    const valid = (href: string) => {
      const path = href.split("#")[0];
      if (staticRoutes.has(path)) return true;
      const [, section, slug] = path.split("/");
      if (section === "guides") return slugs.has(slug);
      if (section === "bookmakers") return bookmakers.some((b) => b.slug === slug);
      if (section === "betting-sites" || section === "bonuses") return countries.some((c) => c.slug === slug);
      return false;
    };
    for (const g of guides) {
      for (const [, href] of g.html.matchAll(/href="(\/[^"]*)"/g)) expect(valid(href), `${g.slug} -> ${href}`).toBe(true);
    }
  });
});
