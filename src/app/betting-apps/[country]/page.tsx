import Link from "next/link";
import { notFound } from "next/navigation";
import { bookmakersInCountry, marketFor } from "@/data/bookmakers";
import { countries, countryBySlug } from "@/data/countries";
import { VisitButton } from "@/components/bookmakers";
import { BookmakerBadge, Check, FaqSection, PageHero, TermsNote } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { itemListLd, monthYear, pageMetadata } from "@/lib/seo";
import type { FeatureKey } from "@/lib/types";

export const revalidate = 86400;

export function generateStaticParams() {
  return countries.map((c) => ({ country: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  const c = countryBySlug(country);
  if (!c) return {};
  return pageMetadata({
    title: `Best Betting Apps in ${c.name} (${monthYear()})`,
    description: `The best sports betting apps in ${c.name}, ranked on speed, features and ease of use. iOS and Android availability, live streaming, cash out${c.region === "africa" || c.region === "south-africa" ? ", data-light sites" : ""} and safe download tips.`,
    path: `/betting-apps/${c.slug}`,
  });
}

const APP_FEATURES: [FeatureKey, string][] = [
  ["iosApp", "iOS"],
  ["androidApp", "Android"],
  ["liteSite", "Data-light"],
  ["liveStreaming", "Streaming"],
  ["cashOut", "Cash out"],
  ["betBuilder", "Bet builder"],
];

export default async function BettingAppsPage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  const c = countryBySlug(country);
  if (!c) notFound();
  const books = [...bookmakersInCountry(c.code)].sort((a, b) => b.ratings.app - a.ratings.app);
  const african = c.region === "africa" || c.region === "south-africa";

  return (
    <>
      <PageHero
        breadcrumbs={[
          { name: "Betting sites", path: "/betting-sites" },
          { name: c.name, path: `/betting-sites/${c.slug}` },
          { name: "Betting apps", path: `/betting-apps/${c.slug}` },
        ]}
        eyebrow={`${c.flag} Updated ${monthYear()}`}
        title={`Best betting apps in ${c.name}`}
        intro={`We rank the apps of ${books.length} licensed ${c.demonym} bookmakers on speed, stability, ease of use and in-app features. ${books[0].name} has the top-rated app right now.`}
      />
      <div className="container-page space-y-12 py-10">
        <section className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line bg-surface text-left">
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">App</th>
                <th className="px-3 py-3 text-center font-semibold">App score</th>
                {APP_FEATURES.map(([, l]) => (
                  <th key={l} className="px-3 py-3 text-center font-semibold">
                    {l}
                  </th>
                ))}
                <th className="px-4 py-3">
                  <span className="sr-only">Visit</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {books.map((b, i) => (
                <tr key={b.slug} className="border-b border-line last:border-0">
                  <td className="tabular px-4 py-3 font-bold text-muted">{i + 1}</td>
                  <td className="px-4 py-3">
                    <Link href={`/bookmakers/${b.slug}`} className="flex items-center gap-3 font-semibold text-ink-900">
                      <BookmakerBadge name={b.name} size={36} />
                      {b.name}
                    </Link>
                  </td>
                  <td className="tabular px-3 py-3 text-center font-bold">{b.ratings.app.toFixed(1)}</td>
                  {APP_FEATURES.map(([f]) => (
                    <td key={f} className="px-3 py-3 text-center">
                      <Check ok={b.features[f]} />
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <VisitButton b={b} country={c.code} className="btn-ghost py-1.5 whitespace-nowrap" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <TermsNote />

        <section className="prose-content">
          <h2>What makes a good betting app?</h2>
          <ul>
            <li>
              <strong>Speed and stability</strong> — odds must update instantly and the app shouldn&apos;t crash at kick-off when traffic peaks.
            </li>
            <li>
              <strong>Easy betslip tools</strong> — quick stakes, accumulators, {african ? "booking codes, " : ""}cash out and bet builders.
            </li>
            {african && (
              <li>
                <strong>Low data usage</strong> — data-light sites and lite apps save airtime and work on slower networks.
              </li>
            )}
            <li>
              <strong>Fast payments</strong> — {c.popularPayments.slice(0, 3).join(", ")} should be available inside the app.
            </li>
            <li>
              <strong>Safer gambling controls</strong> — deposit limits, time-outs and self-exclusion should be easy to find.
            </li>
          </ul>
          <h2>Downloading betting apps safely</h2>
          <p>
            {african
              ? `Many ${c.demonym} bookmakers offer their Android app as a direct download (APK) from their own website rather than through Google Play. Only download from the bookmaker's official site — fake apps are a common way to steal login details and money.`
              : `Download apps only from the official App Store, Google Play or the bookmaker's own website. Check the developer name matches the licensed operator.`}{" "}
            Read more in our guide to <Link href="/guides/betting-scams-to-avoid">betting scams to avoid</Link>.
          </p>
          <p>
            Compare the full picture — odds, bonuses and payments — in our <Link href={`/betting-sites/${c.slug}`}>{c.name} betting sites rankings</Link>, or see current <Link href={`/bonuses/${c.slug}`}>{c.demonym} welcome offers</Link>.
          </p>
        </section>

        <FaqSection
          faqs={[
            { q: `What is the best betting app in ${c.name}?`, a: `${books[0].name} has the highest app score in our ${c.name} rankings (${books[0].ratings.app.toFixed(1)}/10). ${books[1] ? `${books[1].name} and ${books[2]?.name ?? "others"} are close behind.` : ""}` },
            { q: "Are betting apps safe?", a: `Apps from bookmakers licensed in ${c.name} are regulated and must protect your data and funds. Only download them from official sources and never share your login details.` },
            { q: "Can I claim the welcome bonus in the app?", a: `Yes. Welcome offers such as ${marketFor(books[0], c.code)?.welcome.headline ?? "deposit bonuses"} can normally be claimed in the app as well as on the website. Terms apply.` },
          ]}
        />
      </div>
      <JsonLd data={itemListLd(`Best betting apps in ${c.name}`, books.map((b) => ({ name: `${b.name} app`, path: `/bookmakers/${b.slug}` })))} />
    </>
  );
}
