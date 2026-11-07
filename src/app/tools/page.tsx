import Link from "next/link";
import { PageHero } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Free Betting Tools — Odds Converter, Bet Calculator & Margin Calculator",
  description: "Free betting calculators: convert decimal, fractional and American odds, calculate accumulator and system bet returns, work out bookmaker margins and convert booking codes.",
  path: "/tools",
});

const TOOLS = [
  { href: "/booking-code-converter", title: "Booking code converter", text: "Convert SportyBet, Bet9ja, Betway and BetKing codes between bookmakers." },
  { href: "/tools/bet-calculator", title: "Bet calculator", text: "Accumulator, parlay and system bet returns, with acca bonus." },
  { href: "/tools/odds-converter", title: "Odds converter", text: "Decimal, fractional and American odds plus implied probability." },
  { href: "/tools/margin-calculator", title: "Margin calculator", text: "Bookmaker overround, fair odds and arbitrage stake splits." },
];

export default function ToolsPage() {
  return (
    <>
      <PageHero breadcrumbs={[{ name: "Tools", path: "/tools" }]} title="Free betting tools" intro="Calculators that help you understand prices and returns before you bet." />
      <div className="container-page grid gap-4 py-10 md:grid-cols-2">
        {TOOLS.map((t) => (
          <Link key={t.href} href={t.href} className="card p-6 text-ink-900 no-underline hover:border-brand-500 hover:no-underline">
            <h2 className="text-xl font-bold">{t.title} →</h2>
            <p className="mt-1 text-ink-700">{t.text}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
