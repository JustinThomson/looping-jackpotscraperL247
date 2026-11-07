import Link from "next/link";
import { StaticPage } from "@/components/StaticPage";
import { bookmakers } from "@/data/bookmakers";
import { countries } from "@/data/countries";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata = pageMetadata({ title: "About Us", description: `${site.name} is an independent sports betting comparison site covering South Africa, Africa, the US and Europe.`, path: "/about" });

export default function About() {
  return (
    <StaticPage title={`About ${site.name}`} path="/about" intro="Independent comparisons that help punters choose licensed bookmakers, get better odds and move betslips between sites.">
      <p>
        {site.name} compares {bookmakers.length} licensed bookmakers across {countries.length} countries, with a particular focus on South Africa and the wider African market, where booking codes and mobile money shape how people bet — alongside the
        regulated markets of the United States, the UK and Europe.
      </p>
      <h2>What we do</h2>
      <ul>
        <li>
          <strong>Review bookmakers</strong> against a consistent, published <Link href="/methodology">methodology</Link>.
        </li>
        <li>
          <strong>Compare odds</strong> so you can see who pays the most for the same bet.
        </li>
        <li>
          <strong>Track bonuses</strong> by country, with plain-English notes on terms.
        </li>
        <li>
          <strong>Build free tools</strong> — the <Link href="/booking-code-converter">booking code converter</Link>, odds converter and bet calculators.
        </li>
      </ul>
      <h2>Our principles</h2>
      <ul>
        <li>We only list operators that hold a licence in the country we list them for.</li>
        <li>Commercial relationships never change ratings — see our <Link href="/affiliate-disclosure">affiliate disclosure</Link>.</li>
        <li>We promote <Link href="/responsible-gambling">responsible gambling</Link> on every page. Betting is entertainment, not income.</li>
        <li>Where data is sample or simulated (for example, odds without a live feed), we say so clearly.</li>
      </ul>
      <p>
        Questions or corrections? <Link href="/contact">Contact us</Link>.
      </p>
    </StaticPage>
  );
}
