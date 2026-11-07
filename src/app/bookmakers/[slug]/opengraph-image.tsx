import { bookmakerBySlug, overallRating } from "@/data/bookmakers";
import { ogImage, OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Bookmaker review";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const b = bookmakerBySlug(slug);
  return ogImage(b ? `${b.name} review` : "Bookmaker review", b ? `Rated ${overallRating(b).toFixed(1)}/10 · ${b.tagline}` : undefined, "Bookmaker review");
}
