import { geocodeFranceAddressServer } from "@/features/technical-visits/lib/nominatim-geocode-server";
import { buildWorksiteGeocodeFallbackQueriesFromFields } from "@/features/technical-visits/lib/worksite-geocode-query";

/** Géocode serveur (Nominatim) pour enregistrer lat/lng sur la VT. */
export async function geocodeWorksiteForSave(fields: {
  worksite_address: string | null | undefined;
  worksite_postal_code: string | null | undefined;
  worksite_city: string | null | undefined;
}): Promise<{ lat: number | null; lng: number | null }> {
  const queries = buildWorksiteGeocodeFallbackQueriesFromFields(fields);

  if (queries.length === 0) {
    return { lat: null, lng: null };
  }

  for (const q of queries) {
    const c = await geocodeFranceAddressServer(q);
    if (c) {
      return { lat: c.lat, lng: c.lng };
    }
  }

  return { lat: null, lng: null };
}
