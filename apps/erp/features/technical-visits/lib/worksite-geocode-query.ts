import type { TechnicalVisitListRow } from "@/features/technical-visits/types";

/**
 * Chaîne envoyée à Nominatim (France) à partir des champs travaux VT.
 */
export function buildWorksiteGeocodeQueryFromFields(f: {
  worksite_address: string | null | undefined;
  worksite_postal_code: string | null | undefined;
  worksite_city: string | null | undefined;
}): string {
  const addr = f.worksite_address?.trim() ?? "";
  const cp = f.worksite_postal_code?.trim() ?? "";
  const city = f.worksite_city?.trim() ?? "";
  const cpCity = [cp, city].filter(Boolean).join(" ").trim();

  if (!addr && !cpCity) {
    return "";
  }

  if (addr && cpCity) {
    return `${addr}, ${cpCity}, France`;
  }
  if (addr) {
    return `${addr}, France`;
  }
  return `${cpCity}, France`;
}

export function buildWorksiteGeocodeQuery(
  row: Pick<TechnicalVisitListRow, "worksite_address" | "worksite_postal_code" | "worksite_city">,
): string {
  return buildWorksiteGeocodeQueryFromFields(row);
}
