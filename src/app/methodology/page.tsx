import Link from "next/link";
import { StaticPage } from "@/components/StaticPage";
import { RATING_WEIGHTS } from "@/data/bookmakers";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "How We Rate Bookmakers", description: "Our bookmaker rating methodology: how we score odds value, markets, bonuses, apps, payments and support, and how the overall rating is weighted.", path: "/methodology" });

const DESCRIPTIONS: Record<keyof typeof RATING_WEIGHTS, string> = {
  odds: "Margins on popular markets (especially football 1X2, totals and US spreads) compared with rivals in the same country. Lower margins score higher.",
  markets: "Depth of sports, leagues and bet types, including local leagues, live betting, bet builders and specials.",
  bonuses: "Welcome offer value after wagering requirements, minimum odds and expiry, plus ongoing promotions such as acca boosts.",
  app: "Speed, stability and ease of use of the apps and mobile site, including data-light options for low-bandwidth users.",
  payments: "Local payment methods, deposit and withdrawal speed, fees and minimums.",
  support: "Licensing, safer gambling tools, transparency of terms and customer support quality.",
};

export default function Methodology() {
  const keys = Object.keys(RATING_WEIGHTS) as (keyof typeof RATING_WEIGHTS)[];
  return (
    <StaticPage title="How we rate bookmakers" path="/methodology" intro="Every bookmaker is scored out of 10 in six categories. The overall rating is a weighted average.">
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Weight</th>
            <th>What we look at</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((k) => (
            <tr key={k}>
              <td className="font-semibold capitalize">{k}</td>
              <td>{Math.round(RATING_WEIGHTS[k] * 100)}%</td>
              <td>{DESCRIPTIONS[k]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>Licensing first</h2>
      <p>
        We only rank bookmakers in countries where they hold a licence. Unlicensed offshore operators are excluded, however popular they are, because players have little protection if something goes wrong.
      </p>
      <h2>Odds and margins</h2>
      <p>
        A bookmaker&apos;s margin (overround) is the edge built into its prices. We calculate it from the implied probabilities of every outcome in a market. Read more in <Link href="/guides/bookmaker-margin-explained">bookmaker margins explained</Link>{" "}
        or try the <Link href="/tools/margin-calculator">margin calculator</Link>.
      </p>
      <h2>Keeping data current</h2>
      <p>
        Each review shows when it was last reviewed. Bonuses and features change often, so we re-check offers regularly and always recommend confirming terms on the operator&apos;s site.
      </p>
      <h2>Odds data</h2>
      <p>
        When a live odds feed is connected, odds pages refresh roughly every 15 minutes. Without one, pages show clearly labelled sample odds generated for demonstration.
      </p>
    </StaticPage>
  );
}
