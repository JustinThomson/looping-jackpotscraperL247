import type { Metadata } from "next";
import { absoluteUrl, site } from "./site";
import type { Faq } from "./types";

interface PageMeta {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  noindex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
}

/** Build consistent metadata (canonical, Open Graph, Twitter) for a page. */
export function pageMetadata({ title, description, path, type = "website", noindex, publishedTime, modifiedTime }: PageMeta): Metadata {
  const url = absoluteUrl(path);
  return {
    title: title.includes(site.name) ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: site.name,
      type,
      locale: "en",
      ...(type === "article" ? { publishedTime, modifiedTime } : {}),
    },
    twitter: { card: "summary_large_image", title, description },
    robots: noindex ? { index: false, follow: true } : undefined,
  };
}

/* ---------- JSON-LD builders ---------- */

/** "November 2026" — used in titles of regularly updated pages. */
export function monthYear(d = new Date()): string {
  return d.toLocaleString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}

export type JsonLdObject = Record<string, unknown>;

export function organizationLd(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": absoluteUrl("/#organization"),
    name: site.name,
    url: site.url,
    logo: absoluteUrl("/icon.svg"),
    email: site.email,
  };
}

export function websiteLd(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    name: site.name,
    url: site.url,
    description: site.description,
    publisher: { "@id": absoluteUrl("/#organization") },
    inLanguage: "en",
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: absoluteUrl(it.path) })),
  };
}

export function faqLd(faqs: Faq[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

export function itemListLd(name: string, items: { name: string; path: string }[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, url: absoluteUrl(it.path) })),
  };
}

export function reviewLd(opts: { name: string; url: string; rating: number; summary: string; path: string; dateModified: string }): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    name: `${opts.name} review`,
    url: absoluteUrl(opts.path),
    reviewBody: opts.summary,
    dateModified: opts.dateModified,
    author: { "@type": "Organization", name: site.name, url: site.url },
    publisher: { "@id": absoluteUrl("/#organization") },
    itemReviewed: { "@type": "Organization", name: opts.name, url: opts.url },
    reviewRating: { "@type": "Rating", ratingValue: opts.rating, bestRating: 10, worstRating: 1 },
  };
}

export function articleLd(opts: { title: string; description: string; path: string; updated: string }): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.title,
    description: opts.description,
    url: absoluteUrl(opts.path),
    mainEntityOfPage: absoluteUrl(opts.path),
    dateModified: opts.updated,
    datePublished: opts.updated,
    author: { "@type": "Organization", name: `${site.name} Editorial Team`, url: absoluteUrl("/about") },
    publisher: { "@id": absoluteUrl("/#organization") },
  };
}

export function sportsEventLd(opts: { name: string; home: string; away: string; startDate: string; path: string; league: string }): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: opts.name,
    startDate: opts.startDate,
    url: absoluteUrl(opts.path),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: `${opts.home} home ground` },
    homeTeam: { "@type": "SportsTeam", name: opts.home },
    awayTeam: { "@type": "SportsTeam", name: opts.away },
    competitor: [
      { "@type": "SportsTeam", name: opts.home },
      { "@type": "SportsTeam", name: opts.away },
    ],
    superEvent: { "@type": "SportsEvent", name: opts.league },
  };
}

export function softwareAppLd(opts: { name: string; description: string; path: string }): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: opts.name,
    description: opts.description,
    url: absoluteUrl(opts.path),
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
}
