import Link from "next/link";
import { hashString } from "@/lib/random";
import { JsonLd } from "./JsonLd";
import { breadcrumbLd, faqLd } from "@/lib/seo";
import type { Faq } from "@/lib/types";

/* Neutral monogram badge (we deliberately don't reproduce operator logos). */
const BADGE_COLORS = ["#0b1f33", "#12304d", "#065f46", "#1e3a8a", "#7c2d12", "#581c87", "#134e4a", "#831843", "#3f3f46", "#14532d"];

export function BookmakerBadge({ name, size = 44 }: { name: string; size?: number }) {
  const words = name.replace(/[^A-Za-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  const initials = (words.length > 1 ? words[0][0] + words[1][0] : name.replace(/[^A-Za-z0-9]/g, "").slice(0, 2)).toUpperCase();
  const bg = BADGE_COLORS[hashString(name) % BADGE_COLORS.length];
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-xl font-bold text-white"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.36 }}
    >
      {initials}
    </span>
  );
}

export function ScoreBadge({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const tone = score >= 8.5 ? "bg-brand-600" : score >= 7.8 ? "bg-brand-700" : "bg-ink-700";
  const cls = size === "lg" ? "h-16 w-16 text-2xl" : size === "sm" ? "h-9 w-9 text-sm" : "h-12 w-12 text-lg";
  return (
    <span className={`tabular inline-flex flex-col items-center justify-center rounded-xl font-bold text-white ${tone} ${cls}`} aria-label={`Rating ${score.toFixed(1)} out of 10`}>
      {score.toFixed(1)}
    </span>
  );
}

export function RatingBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-ink-700">{label}</span>
        <span className="tabular font-semibold">{value.toFixed(1)}</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-surface">
        <div className="h-2 rounded-full bg-brand-500" style={{ width: `${value * 10}%` }} />
      </div>
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  const all = [{ name: "Home", path: "/" }, ...items];
  return (
    <>
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1">
          {all.map((it, i) => (
            <li key={it.path} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden="true">/</span>}
              {i < all.length - 1 ? (
                <Link href={it.path} className="text-muted hover:text-ink-900">
                  {it.name}
                </Link>
              ) : (
                <span aria-current="page" className="text-ink-800">
                  {it.name}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd data={breadcrumbLd(all)} />
    </>
  );
}

export function PageHero({ eyebrow, title, intro, children, breadcrumbs }: { eyebrow?: string; title: string; intro?: React.ReactNode; children?: React.ReactNode; breadcrumbs?: { name: string; path: string }[] }) {
  return (
    <section className="border-b border-line bg-white">
      <div className="container-page py-8 sm:py-10">
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
        {eyebrow && <p className="eyebrow mt-4">{eyebrow}</p>}
        <h1 className="mt-2 max-w-4xl text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">{title}</h1>
        {intro && <div className="mt-3 max-w-3xl text-base leading-relaxed text-ink-700 sm:text-lg">{intro}</div>}
        {children}
      </div>
    </section>
  );
}

export function FaqSection({ faqs, title = "Frequently asked questions" }: { faqs: Faq[]; title?: string }) {
  if (!faqs.length) return null;
  return (
    <section className="mt-12" aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="h-section">
        {title}
      </h2>
      <div className="mt-5 divide-y divide-line card">
        {faqs.map((f) => (
          <details key={f.q} className="group px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink-900">
              {f.q}
              <span aria-hidden="true" className="text-brand-600 transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-2 leading-relaxed text-ink-700">{f.a}</p>
          </details>
        ))}
      </div>
      <JsonLd data={faqLd(faqs)} />
    </section>
  );
}

export function Check({ ok }: { ok: boolean | undefined }) {
  return ok ? (
    <span className="font-bold text-brand-600" aria-label="Yes">
      ✓
    </span>
  ) : (
    <span className="text-muted" aria-label="No">
      –
    </span>
  );
}

export function Notice({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "warn" }) {
  const cls = tone === "warn" ? "border-gold-400 bg-gold-100 text-gold-700" : "border-brand-200 bg-brand-50 text-brand-800";
  return <div className={`rounded-xl border px-4 py-3 text-sm ${cls}`}>{children}</div>;
}

export function TermsNote({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs leading-snug text-muted ${className}`}>
      18+. T&Cs apply. Offers change often — always confirm the latest terms on the operator&apos;s site. <Link href="/responsible-gambling">Gamble responsibly</Link>.
    </p>
  );
}

export function SectionHeader({ title, href, linkLabel, sub }: { title: string; href?: string; linkLabel?: string; sub?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="h-section">{title}</h2>
        {sub && <p className="mt-1 text-ink-700">{sub}</p>}
      </div>
      {href && (
        <Link href={href} className="text-sm font-semibold">
          {linkLabel ?? "View all"} →
        </Link>
      )}
    </div>
  );
}
