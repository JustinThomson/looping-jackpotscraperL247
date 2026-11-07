export const site = {
  name: "OddsBridge",
  tagline: "Compare odds, bonuses & convert booking codes",
  description:
    "Compare sports betting sites in South Africa, Nigeria, Kenya, Ghana, the US and Europe. Find the best odds, latest bonuses and convert booking codes between bookmakers.",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://www.oddsbridge.com").replace(/\/$/, ""),
  email: "hello@oddsbridge.com",
  locale: "en",
  /** Updated whenever editorial data is reviewed. */
  dataReviewed: "November 2026",
};

export function absoluteUrl(path = "/"): string {
  return `${site.url}${path.startsWith("/") ? path : `/${path}`}`;
}

export const YEAR = new Date().getFullYear();

export const NAV = [
  { href: "/odds", label: "Odds" },
  { href: "/bookmakers", label: "Bookmakers" },
  { href: "/bonuses", label: "Bonuses" },
  { href: "/booking-code-converter", label: "Code Converter" },
  { href: "/guides", label: "Guides" },
  { href: "/tools", label: "Tools" },
];
