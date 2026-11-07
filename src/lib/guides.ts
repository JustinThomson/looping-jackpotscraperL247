import fs from "node:fs";
import path from "node:path";
import { Marked } from "marked";
import type { Faq, RegionKey } from "./types";
import { slugify } from "./random";

export type GuideCategory = "booking-codes" | "odds" | "bonuses" | "strategy" | "regional" | "markets" | "safety";

export const CATEGORY_LABELS: Record<GuideCategory, string> = {
  "booking-codes": "Booking codes",
  odds: "Odds & maths",
  bonuses: "Bonuses",
  strategy: "Strategy",
  regional: "Country guides",
  markets: "Betting markets",
  safety: "Safety",
};

export interface Guide {
  slug: string;
  title: string;
  description: string;
  category: GuideCategory;
  updated: string;
  regions: (RegionKey | "all")[];
  related: string[];
  html: string;
  toc: { id: string; text: string }[];
  faqs: Faq[];
  words: number;
  readingMinutes: number;
}

const DIR = path.join(process.cwd(), "content", "guides");

export function parseFrontmatter(src: string): { data: Record<string, string>; body: string } {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: src };
  const data: Record<string, string> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i > 0) data[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { data, body: m[2] };
}

/** Split the trailing "## FAQ" section into structured Q&A. */
export function extractFaqs(body: string): { body: string; faqs: Faq[] } {
  const idx = body.search(/^## FAQ\s*$/m);
  if (idx < 0) return { body, faqs: [] };
  const faqPart = body.slice(idx).replace(/^## FAQ\s*$/m, "");
  const faqs: Faq[] = [];
  for (const chunk of faqPart.split(/^### /m).slice(1)) {
    const [q, ...rest] = chunk.split(/\r?\n/);
    const a = rest.join(" ").replace(/\s+/g, " ").trim();
    if (q.trim() && a) faqs.push({ q: q.trim(), a: stripMarkdown(a) });
  }
  return { body: body.slice(0, idx).trimEnd(), faqs };
}

export function stripMarkdown(s: string): string {
  return s
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .trim();
}

function render(body: string): { html: string; toc: Guide["toc"] } {
  const toc: Guide["toc"] = [];
  const used = new Set<string>();
  const marked = new Marked({ gfm: true });
  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        const plain = text.replace(/<[^>]+>/g, "");
        let id = slugify(plain) || "section";
        while (used.has(id)) id += "-x";
        used.add(id);
        if (depth === 2) toc.push({ id, text: plain });
        return `<h${depth} id="${id}">${text}</h${depth}>\n`;
      },
      link({ href, tokens }) {
        const text = this.parser.parseInline(tokens);
        const external = /^https?:\/\//.test(href);
        return external ? `<a href="${href}" rel="noopener" target="_blank">${text}</a>` : `<a href="${href}">${text}</a>`;
      },
    },
  });
  const html = marked.parse(body, { async: false }) as string;
  return { html, toc };
}

let cache: Guide[] | null = null;

export function getGuides(): Guide[] {
  if (cache && process.env.NODE_ENV === "production") return cache;
  if (!fs.existsSync(DIR)) return [];
  const guides = fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".md"))
    .map((file): Guide => {
      const raw = fs.readFileSync(path.join(DIR, file), "utf8");
      const { data, body } = parseFrontmatter(raw);
      const { body: main, faqs } = extractFaqs(body);
      const { html, toc } = render(main);
      const words = main.split(/\s+/).filter(Boolean).length;
      return {
        slug: file.replace(/\.md$/, ""),
        title: data.title ?? file,
        description: data.description ?? "",
        category: (data.category as GuideCategory) ?? "strategy",
        updated: data.updated ?? "2026-11-01",
        regions: (data.regions ?? "all").split(",").map((s) => s.trim()) as Guide["regions"],
        related: (data.related ?? "").split(",").map((s) => s.trim()).filter(Boolean),
        html,
        toc,
        faqs,
        words,
        readingMinutes: Math.max(1, Math.round(words / 230)),
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
  cache = guides;
  return guides;
}

export function getGuide(slug: string): Guide | undefined {
  return getGuides().find((g) => g.slug === slug);
}

export function guidesFor(region: RegionKey): Guide[] {
  return getGuides().filter((g) => g.regions.includes(region) || g.regions.includes("all"));
}
