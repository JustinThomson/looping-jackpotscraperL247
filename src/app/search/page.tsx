import { SearchResults } from "@/components/SearchResults";
import { PageHero } from "@/components/ui";
import { buildSearchIndex } from "@/lib/search-index";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Search", description: "Search OddsBridge for bookmakers, countries, bonuses, odds and guides.", path: "/search", noindex: true });

export default function SearchPage() {
  return (
    <>
      <PageHero breadcrumbs={[{ name: "Search", path: "/search" }]} title="Search" />
      <div className="container-page max-w-3xl py-10">
        <SearchResults docs={buildSearchIndex()} />
      </div>
    </>
  );
}
