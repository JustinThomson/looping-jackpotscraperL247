import { StaticPage } from "@/components/StaticPage";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata = pageMetadata({ title: "Contact Us", description: `Get in touch with the ${site.name} team.`, path: "/contact" });

export default function Contact() {
  return (
    <StaticPage title="Contact us" path="/contact" intro="Corrections, partnership enquiries or feedback on our tools — we'd love to hear from you.">
      <p>
        Email: <a href={`mailto:${site.email}`}>{site.email}</a>
      </p>
      <p>If you&apos;re reporting outdated bonus or licensing information, please include the bookmaker, country and a link to the operator&apos;s current terms.</p>
      <p>We can&apos;t help with disputes about individual bets — please contact the bookmaker directly, and escalate to its licensing regulator if needed.</p>
    </StaticPage>
  );
}
