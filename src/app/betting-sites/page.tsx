import Link from "next/link";
import { bookmakersInCountry } from "@/data/bookmakers";
import { countryByCode, regions } from "@/data/countries";
import { PageHero } from "@/components/ui";
import { monthYear, pageMetadata } from "@/lib/seo";

/** Re-render daily so "updated" dates and years stay current. */
export const revalidate = 86400;

export const metadata = pageMetadata({
  title: `Betting Sites by Country — South Africa, Africa, US & Europe`,
  description: "Find the best licensed betting sites in your country. Rankings, legal status, bonuses and payment methods for South Africa, Nigeria, Kenya, Ghana, the US, UK and Europe.",
  path: "/betting-sites",
});

export default function BettingSitesIndex() {
  return (
    <>
      <PageHero
        breadcrumbs={[{ name: "Betting sites", path: "/betting-sites" }]}
        title="Betting sites by country"
        intro="Betting laws, licences, payment methods and bonuses differ by country. Choose yours to see bookmakers that are licensed where you live, ranked on odds, promotions and app quality."
      />
      <div className="container-page space-y-10 py-10">
        {regions.map((r) => (
          <section key={r.key}>
            <h2 className="h-section">{r.name}</h2>
            <p className="mt-1 text-ink-700">{r.description}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {r.countries.map((code) => {
                const c = countryByCode(code)!;
                const books = bookmakersInCountry(code);
                return (
                  <Link key={code} href={`/betting-sites/${c.slug}`} className="card p-5 text-ink-900 no-underline hover:border-brand-500 hover:no-underline">
                    <p className="text-3xl" aria-hidden="true">{c.flag}</p>
                    <h3 className="mt-2 text-lg font-bold">Betting sites in {c.name}</h3>
                    <p className="mt-1 text-sm text-ink-700">
                      {books.length} bookmakers · Age {c.minAge}+ · {c.currency.code}
                    </p>
                    <p className="mt-2 text-sm text-muted">Top: {books.slice(0, 3).map((b) => b.name).join(", ")}</p>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
