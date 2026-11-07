import { StaticPage } from "@/components/StaticPage";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata = pageMetadata({ title: "Terms of Use", description: `Terms for using ${site.name}.`, path: "/terms" });

export default function Terms() {
  return (
    <StaticPage title="Terms of use" path="/terms">
      <h2>Information only</h2>
      <p>
        {site.name} provides comparisons, reviews and tools for information. We are not a bookmaker and do not accept bets. Odds, bonuses and features change frequently; always confirm details with the operator before betting.
      </p>
      <h2>Booking code conversions</h2>
      <p>
        Conversions are provided as a convenience and may not match every selection exactly. You are responsible for checking every selection, market and price on your betslip before placing a bet. Demo codes (starting “DM-”) are simulated
        and do not work on bookmaker websites.
      </p>
      <h2>Eligibility</h2>
      <p>You must be of legal gambling age where you live and only use bookmakers licensed in your jurisdiction.</p>
      <h2>Liability</h2>
      <p>To the extent permitted by law, we are not liable for losses arising from betting decisions made using information on this site.</p>
    </StaticPage>
  );
}
