import { geocodeNormalizedAddressWithFallbacks, nextGeocodingStatusFromAddress } from "@/features/technical-visits/lib/geocoding-persistence";

/** Géocode serveur (Nominatim) pour enregistrer lat/lng sur la VT. */
export async function geocodeWorksiteForSave(fields: {
  worksite_address: string | null | undefined;
  worksite_postal_code: string | null | undefined;
  worksite_city: string | null | undefined;
  worksite_country?: string | null | undefined;
}): Promise<{ lat: number | null; lng: number | null; geocoding_status: string; geocoding_provider: string | null; geocoding_error: string | null }> {
  const status = nextGeocodingStatusFromAddress({
    addressLine1: fields.worksite_address,
    postalCode: fields.worksite_postal_code,
    city: fields.worksite_city,
    country: fields.worksite_country,
  });
  if (status === "incomplete_address") {
    return {
      lat: null,
      lng: null,
      geocoding_status: "incomplete_address",
      geocoding_provider: null,
      geocoding_error: "Adresse chantier incomplète",
    };
  }

  const geo = await geocodeNormalizedAddressWithFallbacks({
    addressLine1: fields.worksite_address,
    postalCode: fields.worksite_postal_code,
    city: fields.worksite_city,
    country: fields.worksite_country,
  });
  if (!geo) {
    return {
      lat: null,
      lng: null,
      geocoding_status: "geocoding_error",
      geocoding_provider: null,
      geocoding_error: "Aucun résultat de géocodage",
    };
  }
  return {
    lat: geo.lat,
    lng: geo.lng,
    geocoding_status: "complete_geocoded",
    geocoding_provider: geo.provider,
    geocoding_error: null,
  };
}
