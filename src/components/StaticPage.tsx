import { PageHero } from "./ui";

export function StaticPage({ title, path, intro, children }: { title: string; path: string; intro?: string; children: React.ReactNode }) {
  return (
    <>
      <PageHero breadcrumbs={[{ name: title, path }]} title={title} intro={intro} />
      <div className="container-page max-w-3xl py-10">
        <div className="prose-content">{children}</div>
      </div>
    </>
  );
}
