import Link from "next/link";
import { notFound } from "next/navigation";
import { bookmakersInCountry, marketFor } from "@/data/bookmakers";
import { countries, countryBySlug } from "@/data/countries";
import { OfferCard } from "@/components/bookmakers";
import { FaqSection, Notice, PageHero, SectionHeader } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { itemListLd, monthYear, pageMetadata } from "@/lib/seo";
import type { Offer } from "@/lib/types";

/** Re-render daily so "updated" dates and years stay current. */
export const revalidate = 86400;

const TYPE_LABELS: Record<Offer["type"], string> = {
  "deposit-match": "Deposit match",
  "free-bet": "Free bet",
  "bet-and-get": "Bet & get",
  "no-deposit": "No deposit",
  "second-chance": "Second chance / safety net",
  "odds-boost": "Odds boost",
  "acca-bonus": "Accumulator bonus",
  cashback: "Cashback",
  none: "No welcome bonus",
};

export function generateStaticParams() {
  return countries.map((c) => ({ country: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  const c = countryBySlug(country);
  if (!c) return {};
  return pageMetadata({
    title: `${c.demonym} Betting Bonuses & Free Bets (${monthYear()})`,
    description: `Compare welcome bonuses, free bets and accumulator boosts from licensed bookmakers in ${c.name}. Offer types, key terms and how to claim — updated ${monthYear()}.`,
    path: `/bonuses/${c.slug}`,
  });
}

export default async function CountryBonusesPage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  const c = countryBySlug(country);
  if (!c) notFound();
  const books = bookmakersInCountry(c.code);
  const withBonus = books.filter((b) => marketFor(b, c.code)!.welcome.type !== "none");
  const without = books.filter((b) => marketFor(b, c.code)!.welcome.type === "none");
  const types = [...new Set(withBonus.map((b) => marketFor(b, c.code)!.welcome.type))];

  return (
    <>
      <PageHero
        breadcrumbs={[
          { name: "Bonuses", path: "/bonuses" },
          { name: c.name, path: `/bonuses/${c.slug}` },
        ]}
        eyebrow={`${c.flag} ${c.name} · Updated ${monthYear()}`}
        title={`Betting bonuses in ${c.name}`}
        intro={`${withBonus.length} licensed ${c.demonym} bookmakers currently advertise a welcome offer. Here's what each one gives new customers, and what to check before you claim.`}
      />
      <div className="container-page space-y-12 py-10">
        <section>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-line bg-surface text-left">
                  <th className="px-4 py-3 font-semibold">Bookmaker</th>
                  <th className="px-4 py-3 font-semibold">Welcome offer</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Other promos</th>
                </tr>
              </thead>
              <tbody>
                {books.map((b) => {
                  const m = marketFor(b, c.code)!;
                  return (
                    <tr key={b.slug} className="border-b border-line align-top last:border-0">
                      <td className="px-4 py-3 font-semibold whitespace-nowrap">
                        <Link href={`/bookmakers/${b.slug}`} className="text-ink-900">
                          {b.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-semibold">{m.welcome.headline}</td>
                      <td className="px-4 py-3 text-ink-700">{TYPE_LABELS[m.welcome.type]}</td>
                      <td className="px-4 py-3 text-ink-700">{m.otherPromos?.map((p) => p.headline).join(", ") || "–"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
        <section>
          <SectionHeader title="Offer details" />
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {withBonus.map((b) => (
              <OfferCard key={b.slug} b={b} country={c.code} />
            ))}
          </div>
          {without.length > 0 && <p className="mt-4 text-sm text-ink-700">No welcome bonus currently: {without.map((b) => b.name).join(", ")}.</p>}
        </section>
        <section className="prose-content">
          <h2>How to choose a bonus in {c.name}</h2>
          <p>
            The offer types available in {c.name} right now are: {types.map((t) => TYPE_LABELS[t].toLowerCase()).join(", ")}. Before you claim, check the minimum deposit, minimum odds per selection, how many times the bonus must be wagered, which bets
            count and when the bonus expires.
          </p>
          <ul>
            <li>
              <strong>Deposit matches</strong> add bonus funds based on your first deposit but usually carry wagering requirements.
            </li>
            <li>
              <strong>Free bets and bet-and-get offers</strong> normally return only the winnings, not the free bet stake.
            </li>
            <li>
              <strong>Accumulator bonuses</strong> add a percentage to winning multis with enough legs — useful if you already bet accas.
            </li>
          </ul>
          <p>
            Read our full guide: <Link href="/guides/betting-bonuses-explained">betting bonuses explained</Link>, or compare bookmakers on more than bonuses in our <Link href={`/betting-sites/${c.slug}`}>{c.name} betting sites rankings</Link>.
          </p>
        </section>
        <Notice tone="warn">
          18+ only ({c.minAge}+ in {c.name}). Bonuses are subject to the operator&apos;s terms, which change frequently — always confirm on the bookmaker&apos;s site. Never deposit more than you can afford to lose.
        </Notice>
        <FaqSection
          faqs={[
            { q: `Which bookmaker has the best bonus in ${c.name}?`, a: `It depends on how you bet. ${withBonus[0]?.name ?? "The top-rated bookmaker"} has one of the strongest overall packages in our rankings, but compare wagering and minimum odds in the table above to see which offer suits you.` },
            { q: "Do I need a promo code?", a: "Most welcome offers apply automatically when you register and deposit. If a promo code is required, the bookmaker shows it on the registration page." },
            { q: `Are bonus winnings taxed in ${c.name}?`, a: c.taxNote },
          ]}
        />
      </div>
      <JsonLd data={itemListLd(`${c.name} betting bonuses`, withBonus.map((b) => ({ name: `${b.name}: ${marketFor(b, c.code)!.welcome.headline}`, path: `/bookmakers/${b.slug}` })))} />
    </>
  );
}
