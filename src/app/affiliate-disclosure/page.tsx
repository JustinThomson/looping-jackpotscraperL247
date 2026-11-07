import Link from "next/link";
import { StaticPage } from "@/components/StaticPage";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata = pageMetadata({ title: "Affiliate Disclosure", description: `How ${site.name} is funded and how we keep our bookmaker ratings independent.`, path: "/affiliate-disclosure" });

export default function Disclosure() {
  return (
    <StaticPage title="Affiliate disclosure" path="/affiliate-disclosure">
      <p>
        {site.name} is free to use. Some links to bookmakers are affiliate links: if you open an account through them, we may receive a commission from the operator. This costs you nothing.
      </p>
      <h2>Our ratings are independent</h2>
      <p>
        Commercial agreements never influence our ratings, rankings or reviews. Bookmakers are scored using our published <Link href="/methodology">methodology</Link>, and operators we have no relationship with are rated in exactly the same way.
      </p>
      <h2>Licensed operators only</h2>
      <p>We only promote bookmakers licensed in the country we list them for, and we never target content at people under the legal gambling age.</p>
      <p>
        Outbound bookmaker links are marked <code>rel=&quot;sponsored&quot;</code> in line with search engine guidelines.
      </p>
    </StaticPage>
  );
}
