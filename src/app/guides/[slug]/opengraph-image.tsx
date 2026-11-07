import { getGuide } from "@/lib/guides";
import { ogImage, OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Betting guide";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = getGuide(slug);
  return ogImage(g?.title ?? "Betting guide", undefined, "Betting guide");
}
