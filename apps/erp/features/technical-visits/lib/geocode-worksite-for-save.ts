import { geocodeFranceAddress } from "@/features/technical-visits/lib/nominatim-geocode";
import { buildWorksiteGeocodeQueryFromFields } from "@/features/technical-visits/lib/worksite-geocode-query";

/** Géocode serveur (Nominatim) pour enregistrer lat/lng sur la VT. */
export async function geocodeWorksiteForSave(fields: {
  worksite_address: string | null | undefined;
  worksite_postal_code: string | null | undefined;
  worksite_city: string | null | undefined;
}): Promise<{ lat: number | null; lng: number | null }> {
  const q = buildWorksiteGeocodeQueryFromFields(fields);
  if (!q) {
    return { lat: null, lng: null };
  }
  const c = await geocodeFranceAddress(q);
  if (!c) {
    return { lat: null, lng: null };
  }
  return { lat: c.lat, lng: c.lng };
}
