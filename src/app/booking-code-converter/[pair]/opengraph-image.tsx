import { bookmakerBySlug } from "@/data/bookmakers";
import { ogImage, OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Booking code converter";

export default async function Image({ params }: { params: Promise<{ pair: string }> }) {
  const { pair } = await params;
  const [from, to] = pair.split("-to-").map((s) => bookmakerBySlug(s)?.name ?? s);
  return ogImage(`Convert ${from} codes to ${to}`, "Free booking code converter", "Booking code converter");
}
