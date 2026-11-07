import Link from "next/link";
import { countries } from "@/data/countries";
import { PageHero } from "@/components/ui";
import { comparePairs } from "@/lib/compare";
import { overallRating } from "@/data/bookmakers";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Bookmaker Comparisons — Head-to-Head Betting Site Reviews",
  description: "Head-to-head comparisons of bookmakers in South Africa, Nigeria, Kenya, Ghana, the US and Europe: odds, bonuses, features, payments and booking codes side by side.",
  path: "/compare",
});

export default function CompareIndex() {
  const pairs = comparePairs();
  return (
    <>
      <PageHero
        breadcrumbs={[{ name: "Compare", path: "/compare" }]}
        title="Bookmaker head-to-head comparisons"
        intro="Can't decide between two bookmakers? Compare their ratings, odds margins, welcome offers, features and payment methods side by side."
      />
      <div className="container-page space-y-10 py-10">
        {countries.map((c) => {
          const list = pairs
            .filter((p) => p.shared.includes(c.code))
            .sort((x, y) => overallRating(y.a) + overallRating(y.b) - (overallRating(x.a) + overallRating(x.b)))
            .slice(0, 12);
          if (!list.length) return null;
          return (
            <section key={c.code}>
              <h2 className="text-xl font-bold">
                {c.flag} {c.name}
              </h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {list.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/compare/${p.slug}`} className="card block px-4 py-3 text-sm font-semibold text-ink-900 no-underline hover:border-brand-500 hover:no-underline">
                      {p.a.name} vs {p.b.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
