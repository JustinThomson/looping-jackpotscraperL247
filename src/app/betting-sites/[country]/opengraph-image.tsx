import { countryBySlug } from "@/data/countries";
import { bookmakersInCountry } from "@/data/bookmakers";
import { ogImage, OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Best betting sites";

export default async function Image({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  const c = countryBySlug(country);
  return ogImage(c ? `Best betting sites in ${c.name}` : "Best betting sites", c ? `${bookmakersInCountry(c.code).length} licensed bookmakers compared` : undefined, "Betting sites");
}
