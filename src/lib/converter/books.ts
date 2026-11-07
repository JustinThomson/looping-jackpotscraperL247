import { countryByCode } from "@/data/countries";
import type { ConverterBook } from "@/components/converter/Converter";
import { converterBookmakers } from "./index";

/** Serializable bookmaker options for the converter UI. */
export function converterBookOptions(): ConverterBook[] {
  return converterBookmakers().map((b) => ({
    slug: b.slug,
    name: b.name,
    codeName: b.bookingCode?.name ?? "Booking Code",
    countries: b.markets
      .filter((m) => m.bookingCodeName)
      .map((m) => {
        const c = countryByCode(m.country)!;
        return { code: c.code, name: c.name, flag: c.flag };
      }),
  }));
}

/** All directed converter pairs, e.g. sportybet-to-bet9ja. */
export function converterPairs(): { from: string; to: string; slug: string }[] {
  const books = converterBookmakers();
  return books.flatMap((a) => books.filter((b) => b.slug !== a.slug).map((b) => ({ from: a.slug, to: b.slug, slug: `${a.slug}-to-${b.slug}` })));
}
