import { ogImage, OG_SIZE } from "@/lib/og";

export const alt = "OddsBridge — compare betting sites, odds and booking codes";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogImage("Compare betting sites, odds & convert booking codes", "South Africa · Africa · United States · Europe", "Betting comparison");
}
