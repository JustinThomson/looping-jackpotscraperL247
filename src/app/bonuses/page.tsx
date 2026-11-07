import Link from "next/link";
import { bookmakersInCountry } from "@/data/bookmakers";
import { countries, countryByCode, regions } from "@/data/countries";
import { OfferCard } from "@/components/bookmakers";
import { FaqSection, PageHero, SectionHeader } from "@/components/ui";
import { monthYear, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: `Betting Bonuses & Free Bets (${monthYear()}) — Welcome Offers by Country`,
  description: "The latest sports betting welcome bonuses, free bets and accumulator boosts in South Africa, Nigeria, Kenya, Ghana, the US, UK and Europe — with plain-English terms.",
  path: "/bonuses",
});

export default function BonusesPage() {
  return (
    <>
      <PageHero
        breadcrumbs={[{ name: "Bonuses", path: "/bonuses" }]}
        eyebrow={`Updated ${monthYear()}`}
        title="Betting bonuses & promotions"
        intro={
          <p>
            Welcome offers from licensed bookmakers, grouped by country. Bonuses differ by market and change often — we note the type of offer and key conditions, and you should always read the full terms. New to bonuses? Read{" "}
            <Link href="/guides/betting-bonuses-explained">betting bonuses explained</Link>.
          </p>
        }
      >
        <nav aria-label="Bonuses by country" className="mt-5 flex flex-wrap gap-2">
          {countries.map((c) => (
            <Link key={c.code} href={`/bonuses/${c.slug}`} className="chip no-underline hover:border-brand-500 hover:no-underline">
              {c.flag} {c.name}
            </Link>
          ))}
        </nav>
      </PageHero>
      <div className="container-page space-y-14 py-10">
        {regions.map((r) =>
          r.countries.slice(0, r.key === "europe" ? 2 : 3).map((code) => {
            const c = countryByCode(code)!;
            const books = bookmakersInCountry(code).filter((b) => b.markets.find((m) => m.country === code)?.welcome.type !== "none");
            if (!books.length) return null;
            return (
              <section key={code}>
                <SectionHeader title={`${c.flag} ${c.name} betting bonuses`} href={`/bonuses/${c.slug}`} linkLabel={`All ${c.name} offers`} />
                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {books.slice(0, 3).map((b) => (
                    <OfferCard key={b.slug} b={b} country={code} />
                  ))}
                </div>
              </section>
            );
          }),
        )}
        <FaqSection
          faqs={[
            { q: "What is a welcome bonus?", a: "A welcome bonus is an offer for new customers, such as a deposit match, free bet or 'bet and get' bonus. It usually comes with conditions like minimum odds, wagering requirements and an expiry date." },
            { q: "Are betting bonuses worth it?", a: "They can be, but their real value is often lower than the headline. A free bet usually doesn't return the stake, and deposit matches must be wagered several times. Compare the wagering requirement, minimum odds and expiry before you choose." },
            { q: "Can I claim bonuses at several bookmakers?", a: "Yes — each bookmaker's welcome offer is separate, so you can claim one per bookmaker, subject to their terms. Some countries, such as Sweden, limit operators to a single bonus per customer." },
          ]}
        />
      </div>
    </>
  );
}
