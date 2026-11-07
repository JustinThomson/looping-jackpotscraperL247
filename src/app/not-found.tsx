import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page py-20 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-2 text-3xl font-extrabold">Page not found</h1>
      <p className="mx-auto mt-3 max-w-md text-ink-700">This page doesn&apos;t exist, or the match has already been played. Try one of these instead:</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link href="/odds" className="btn-primary">Odds comparison</Link>
        <Link href="/booking-code-converter" className="btn-ghost">Booking code converter</Link>
        <Link href="/betting-sites" className="btn-ghost">Betting sites by country</Link>
      </div>
    </div>
  );
}
