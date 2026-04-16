import { normalizeAddressPart } from "@/features/technical-visits/lib/location-validation";

export function buildFullAddress(input: {
  addressLine1?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
}): string | null {
  const address = normalizeAddressPart(input.addressLine1);
  const cp = normalizeAddressPart(input.postalCode);
  const city = normalizeAddressPart(input.city);
  const country = normalizeAddressPart(input.country) ?? "France";
  const cpCity = [cp, city].filter(Boolean).join(" ").trim();
  const out = [address, cpCity, country].filter(Boolean).join(", ").trim();
  return out.length > 0 ? out : null;
}

export function buildAddressFallbackQueries(input: {
  addressLine1?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
}): string[] {
  const cp = normalizeAddressPart(input.postalCode);
  const city = normalizeAddressPart(input.city);
  const country = normalizeAddressPart(input.country) ?? "France";

  const queries: string[] = [];
  /** Priorité : code postal (+ pays), puis CP + ville, puis adresse complète si disponible. */
  if (cp) {
    queries.push(`${cp}, ${country}`);
    if (city) {
      queries.push(`${cp} ${city}, ${country}`);
    }
  }
  const full = buildFullAddress(input);
  if (full) queries.push(full);

  return queries.filter((q, i, arr) => Boolean(q) && arr.indexOf(q) === i);
}
