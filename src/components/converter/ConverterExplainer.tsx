import Link from "next/link";

export function HowConversionWorks() {
  const steps = [
    { t: "Decode", d: "We read the selections stored in the source booking code — the match, market and outcome for every leg." },
    { t: "Match events", d: "Each match is found at the target bookmaker using team-name normalisation, known aliases (Man Utd = Manchester United), fuzzy matching and kickoff time." },
    { t: "Map markets", d: "Markets are mapped to their equivalents — 1X2, double chance, draw no bet, over/under (same line only) and both teams to score." },
    { t: "Rebuild & compare", d: "We create the new slip, flag anything that couldn't be converted and show the total odds at both bookmakers." },
  ];
  return (
    <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {steps.map((s, i) => (
        <li key={s.t} className="card p-5">
          <span className="tabular inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">{i + 1}</span>
          <h3 className="mt-3 font-bold">{s.t}</h3>
          <p className="mt-1 text-sm text-ink-700">{s.d}</p>
        </li>
      ))}
    </ol>
  );
}

export function SupportedMarkets() {
  const rows = [
    ["Match result (1X2)", "Converts", "Home / Draw / Away"],
    ["Double chance", "Converts", "1X, 12, X2"],
    ["Draw no bet", "Converts", "Where offered by the target"],
    ["Over/Under goals", "Converts when the line matches", "e.g. Over 2.5 → Over 2.5"],
    ["Both teams to score", "Converts", "GG/NG, Yes/No"],
    ["Moneyline (2-way)", "Converts", "Basketball, NFL"],
    ["Correct score, player props, bet builders", "Not yet", "Rebuild these manually"],
  ];
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-line bg-surface text-left">
            <th className="px-4 py-3 font-semibold">Market</th>
            <th className="px-4 py-3 font-semibold">Support</th>
            <th className="px-4 py-3 font-semibold">Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([m, s, n]) => (
            <tr key={m} className="border-b border-line last:border-0">
              <td className="px-4 py-2.5 font-semibold">{m}</td>
              <td className={`px-4 py-2.5 ${s === "Not yet" ? "text-muted" : "text-brand-700"}`}>{s}</td>
              <td className="px-4 py-2.5 text-ink-700">{n}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-line px-4 py-3 text-xs text-muted">
        Learn more about each market in <Link href="/guides/betting-markets-explained">betting markets explained</Link>.
      </p>
    </div>
  );
}
