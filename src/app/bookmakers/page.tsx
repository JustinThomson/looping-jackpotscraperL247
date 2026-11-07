import { bookmakers, overallRating } from "@/data/bookmakers";
import { BookmakerDirectory } from "@/components/BookmakerDirectory";
import { PageHero } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { itemListLd, monthYear, pageMetadata } from "@/lib/seo";
import { KEY_FEATURES } from "@/components/bookmakers";

/** Re-render daily so "updated" dates and years stay current. */
export const revalidate = 86400;

export const metadata = pageMetadata({
  title: `All Bookmakers Reviewed & Rated (${monthYear()})`,
  description: `Independent reviews of ${bookmakers.length} licensed bookmakers across South Africa, Africa, the US and Europe. Filter by country and features like booking codes, live streaming and mobile money.`,
  path: "/bookmakers",
});

export default function BookmakersPage() {
  const sorted = [...bookmakers].sort((a, b) => overallRating(b) - overallRating(a));
  const items = sorted.map((b) => ({
    slug: b.slug,
    name: b.name,
    tagline: b.tagline,
    rating: overallRating(b),
    countries: b.markets.map((m) => m.country),
    features: KEY_FEATURES.filter((f) => b.features[f]),
    offer: b.markets[0].welcome.headline,
  }));
  return (
    <>
      <PageHero
        breadcrumbs={[{ name: "Bookmakers", path: "/bookmakers" }]}
        title="Bookmaker reviews"
        intro={`We've reviewed ${bookmakers.length} licensed sportsbooks. Filter by country or feature, then open a review for ratings, bonuses, payment methods and booking code instructions.`}
      />
      <div className="container-page py-10">
        <BookmakerDirectory items={items} />
      </div>
      <JsonLd data={itemListLd("Bookmaker reviews", sorted.map((b) => ({ name: b.name, path: `/bookmakers/${b.slug}` })))} />
    </>
  );
}
