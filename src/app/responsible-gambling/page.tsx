import { StaticPage } from "@/components/StaticPage";
import { countries } from "@/data/countries";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Responsible Gambling — Help, Tools & Helplines", description: "Responsible gambling advice, warning signs, self-exclusion schemes and free helplines in South Africa, Nigeria, Kenya, Ghana, the US, UK and Europe.", path: "/responsible-gambling" });

export default function ResponsibleGambling() {
  return (
    <StaticPage title="Responsible gambling" path="/responsible-gambling" intro="Betting should be entertainment. If it stops being fun, help is free, confidential and available now.">
      <h2>Stay in control</h2>
      <ul>
        <li>Set a budget before you bet and treat it as the cost of entertainment.</li>
        <li>Use deposit limits, time-outs and reality checks — every licensed bookmaker offers them.</li>
        <li>Never chase losses or borrow money to gamble.</li>
        <li>Don&apos;t bet when you&apos;re stressed, upset or have been drinking.</li>
        <li>Remember that no tipster, system or booking code guarantees a win.</li>
      </ul>
      <h2>Warning signs</h2>
      <ul>
        <li>Spending more money or time than you intended.</li>
        <li>Hiding your betting from family or friends.</li>
        <li>Feeling anxious or irritable when not betting.</li>
        <li>Betting to win back losses or to solve money problems.</li>
      </ul>
      <h2>Underage gambling</h2>
      <p>
        Betting is for adults only: 18+ in most countries, 21+ in most US states and 25+ in Uganda. Licensed bookmakers must verify your age. Parents can use device-level filters to block gambling sites.
      </p>
      <h2>Help by country</h2>
      <table>
        <thead>
          <tr>
            <th>Country</th>
            <th>Support</th>
            <th>Self-exclusion</th>
          </tr>
        </thead>
        <tbody>
          {countries.map((c) => (
            <tr key={c.code}>
              <td className="font-semibold whitespace-nowrap">
                {c.flag} {c.name}
              </td>
              <td>
                {c.helplines.map((h) => (
                  <span key={h.name} className="block">
                    <a href={h.url} rel="noopener" target="_blank">
                      {h.name}
                    </a>
                    {h.phone ? ` — ${h.phone}` : ""}
                  </span>
                ))}
              </td>
              <td>{c.selfExclusion ?? "Via each licensed operator"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </StaticPage>
  );
}
