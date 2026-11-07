import Link from "next/link";
import { countryByCode } from "@/data/countries";
import { BookmakerBadge, PageHero } from "@/components/ui";
import { converterBookmakers } from "@/lib/converter";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Booking Codes Explained — SportyBet, Bet9ja, Betway, BetKing & More",
  description: "How booking codes work at every major African bookmaker: create, load, share and convert codes for SportyBet, Bet9ja, Betway, BetKing, MSport, Betika and betPawa.",
  path: "/booking-codes",
});

export default function BookingCodesHub() {
  const books = converterBookmakers();
  return (
    <>
      <PageHero
        breadcrumbs={[{ name: "Booking codes", path: "/booking-codes" }]}
        title="Booking codes by bookmaker"
        intro={
          <p>
            Every bookmaker names and handles shareable betslips a little differently — Bet9ja calls it a booking number, Betika a share code. Pick your bookmaker for step-by-step instructions, or jump straight to the{" "}
            <Link href="/booking-code-converter">booking code converter</Link>.
          </p>
        }
      />
      <div className="container-page grid gap-4 py-10 sm:grid-cols-2 lg:grid-cols-3">
        {books.map((b) => (
          <Link key={b.slug} href={`/booking-codes/${b.slug}`} className="card flex items-center gap-4 p-5 text-ink-900 no-underline hover:border-brand-500 hover:no-underline">
            <BookmakerBadge name={b.name} />
            <div>
              <h2 className="font-bold">
                {b.name} {b.bookingCode?.name.toLowerCase()}
              </h2>
              <p className="text-sm text-muted">
                {b.markets
                  .filter((m) => m.bookingCodeName)
                  .map((m) => countryByCode(m.country)!.flag)
                  .join(" ")}{" "}
                How to create, load &amp; convert
              </p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
