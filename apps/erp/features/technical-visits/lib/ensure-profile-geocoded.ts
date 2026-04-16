import type { SupabaseClient } from "@supabase/supabase-js";

import { geocodeNormalizedAddressWithFallbacks, nextGeocodingStatusFromAddress, shouldSkipGeocodingAttempt } from "@/features/technical-visits/lib/geocoding-persistence";
import type { Database } from "@/types/database.types";

type DbClient = SupabaseClient<Database>;

export async function ensureProfileGeocoded(
  supabase: DbClient,
  profileId: string,
): Promise<{ lat: number | null; lng: number | null; geocoding_status: string | null }> {
  const { data: row } = await supabase
    .from("profiles")
    .select(
      "id,address_line_1,postal_code,city,country,latitude,longitude,geocoding_status,geocoding_updated_at,geocoding_attempts",
    )
    .eq("id", profileId)
    .maybeSingle();
  if (!row) return { lat: null, lng: null, geocoding_status: null };

  const hasCoords = row.latitude != null && row.longitude != null;
  if (
    shouldSkipGeocodingAttempt({
      geocoding_status: row.geocoding_status,
      geocoding_updated_at: row.geocoding_updated_at,
      geocoding_attempts: row.geocoding_attempts,
      hasCoords,
    })
  ) {
    return { lat: row.latitude, lng: row.longitude, geocoding_status: row.geocoding_status };
  }

  const baseStatus = nextGeocodingStatusFromAddress({
    addressLine1: row.address_line_1,
    postalCode: row.postal_code,
    city: row.city,
    country: row.country,
  });
  if (baseStatus === "incomplete_address") {
    await supabase
      .from("profiles")
      .update({
        geocoding_status: "incomplete_address",
        geocoding_provider: null,
        geocoding_error: "Adresse incomplète",
        geocoding_updated_at: new Date().toISOString(),
      })
      .eq("id", profileId);
    return { lat: row.latitude, lng: row.longitude, geocoding_status: "incomplete_address" };
  }

  const geo = await geocodeNormalizedAddressWithFallbacks({
    addressLine1: row.address_line_1,
    postalCode: row.postal_code,
    city: row.city,
    country: row.country,
  });

  const attempts = (row.geocoding_attempts ?? 0) + 1;
  if (!geo) {
    await supabase
      .from("profiles")
      .update({
        geocoding_status: "geocoding_error",
        geocoding_provider: null,
        geocoding_error: "Aucun résultat de géocodage",
        geocoding_attempts: attempts,
        geocoding_updated_at: new Date().toISOString(),
      })
      .eq("id", profileId);
    return { lat: null, lng: null, geocoding_status: "geocoding_error" };
  }

  await supabase
    .from("profiles")
    .update({
      latitude: geo.lat,
      longitude: geo.lng,
      geocoding_status: "complete_geocoded",
      geocoding_provider: geo.provider,
      geocoding_error: null,
      geocoding_attempts: attempts,
      geocoding_updated_at: new Date().toISOString(),
    })
    .eq("id", profileId);

  return { lat: geo.lat, lng: geo.lng, geocoding_status: "complete_geocoded" };
}
