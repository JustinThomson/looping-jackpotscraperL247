import Link from "next/link";
import { PageHero } from "@/components/ui";
import { CATEGORY_LABELS, getGuides, type GuideCategory } from "@/lib/guides";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Sports Betting Guides — Booking Codes, Odds, Bonuses & Strategy",
  description: "Plain-English betting guides: what booking codes are and how to convert them, how odds and margins work, accumulators, bonuses, mobile money betting and regional rules.",
  path: "/guides",
});

export default function GuidesIndex() {
  const guides = getGuides();
  const cats = (Object.keys(CATEGORY_LABELS) as GuideCategory[]).filter((c) => guides.some((g) => g.category === c));
  return (
    <>
      <PageHero
        breadcrumbs={[{ name: "Guides", path: "/guides" }]}
        title="Betting guides"
        intro="Everything you need to bet smarter — from loading your first booking code to understanding bookmaker margins. Written for punters in South Africa, across Africa, the US and Europe."
      />
      <div className="container-page space-y-12 py-10">
        {cats.map((c) => (
          <section key={c}>
            <h2 className="h-section">{CATEGORY_LABELS[c]}</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {guides
                .filter((g) => g.category === c)
                .map((g) => (
                  <Link key={g.slug} href={`/guides/${g.slug}`} className="card flex flex-col p-5 text-ink-900 no-underline hover:border-brand-500 hover:no-underline">
                    <p className="eyebrow">{g.readingMinutes} min read</p>
                    <h3 className="mt-1 text-lg font-bold">{g.title}</h3>
                    <p className="mt-1 flex-1 text-sm text-ink-700">{g.description}</p>
                  </Link>
                ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
