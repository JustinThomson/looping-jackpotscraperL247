import { StaticPage } from "@/components/StaticPage";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata = pageMetadata({ title: "Privacy Policy", description: `How ${site.name} handles your data.`, path: "/privacy" });

export default function Privacy() {
  return (
    <StaticPage title="Privacy policy" path="/privacy" intro="We collect as little data as possible.">
      <h2>What we store</h2>
      <p>
        Your odds format, region and betslip preferences are stored in your browser&apos;s local storage only. They never leave your device unless you use a feature that needs them (for example, comparing your betslip), in which case the
        selections are sent to our server to calculate prices and are not stored.
      </p>
      <h2>Booking codes</h2>
      <p>Booking codes you convert are processed to produce the conversion and are not linked to you or kept after the request.</p>
      <h2>Analytics and cookies</h2>
      <p>If analytics are enabled, we use aggregated, privacy-friendly measurement to understand which pages are useful. We do not sell personal data.</p>
      <h2>Third-party sites</h2>
      <p>When you follow a link to a bookmaker, that operator&apos;s privacy policy applies.</p>
      <h2>Contact</h2>
      <p>Questions about privacy: {site.email}</p>
    </StaticPage>
  );
}
