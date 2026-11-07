import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, FaqSection, Notice } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { CATEGORY_LABELS, getGuide, getGuides } from "@/lib/guides";
import { articleLd, pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return getGuides().map((g) => ({ slug: g.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) return {};
  return pageMetadata({ title: g.title, description: g.description, path: `/guides/${g.slug}`, type: "article", modifiedTime: g.updated, publishedTime: g.updated });
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) notFound();
  const related = g.related.map((s) => getGuide(s)).filter((x): x is NonNullable<typeof x> => Boolean(x));
  const updated = new Date(g.updated).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  return (
    <>
      <div className="border-b border-line bg-white">
        <div className="container-page max-w-5xl py-8">
          <Breadcrumbs
            items={[
              { name: "Guides", path: "/guides" },
              { name: g.title, path: `/guides/${g.slug}` },
            ]}
          />
          <p className="eyebrow mt-4">{CATEGORY_LABELS[g.category]}</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{g.title}</h1>
          <p className="mt-3 text-sm text-muted">
            By the OddsBridge editorial team · Updated <time dateTime={g.updated}>{updated}</time> · {g.readingMinutes} min read
          </p>
        </div>
      </div>
      <div className="container-page grid max-w-5xl gap-10 py-10 lg:grid-cols-[1fr_15rem]">
        <article className="min-w-0">
          <div className="prose-content" dangerouslySetInnerHTML={{ __html: g.html }} />
          <FaqSection faqs={g.faqs} title="FAQ" />
          <div className="mt-10">
            <Notice>
              18+ only (21+ in most US states, 25+ in Uganda). Gambling involves risk — never bet more than you can afford to lose. <Link href="/responsible-gambling">Get help and tools</Link>.
            </Notice>
          </div>
          {related.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-bold">Related guides</h2>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link href={`/guides/${r.slug}`} className="card block p-4 font-semibold text-ink-900 no-underline hover:border-brand-500 hover:no-underline">
                      {r.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
        <aside className="hidden lg:block">
          <nav aria-label="On this page" className="sticky top-20">
            <p className="eyebrow">On this page</p>
            <ul className="mt-2 space-y-1.5 border-l border-line text-sm">
              {g.toc.map((t) => (
                <li key={t.id}>
                  <a href={`#${t.id}`} className="-ml-px block border-l-2 border-transparent pl-3 text-ink-700 hover:border-brand-500 hover:text-ink-900">
                    {t.text}
                  </a>
                </li>
              ))}
            </ul>
            <Link href="/booking-code-converter" className="btn-primary mt-6 w-full">
              Convert a booking code
            </Link>
          </nav>
        </aside>
      </div>
      <JsonLd data={articleLd({ title: g.title, description: g.description, path: `/guides/${g.slug}`, updated: g.updated })} />
    </>
  );
}
