import type { SupabaseClient } from "@supabase/supabase-js";

import {
  geocodeNormalizedAddressWithFallbacks,
  nextGeocodingStatusFromAddress,
  shouldSkipGeocodingAttempt,
} from "@/features/technical-visits/lib/geocoding-persistence";
import type { Database } from "@/types/database.types";

type DbClient = SupabaseClient<Database>;

export async function ensureVisitGeocoded(
  supabase: DbClient,
  visitId: string,
): Promise<{ lat: number | null; lng: number | null; geocoding_status: string | null }> {
  const { data: row } = await supabase
    .from("technical_visits")
    .select(
      "id,worksite_address,worksite_postal_code,worksite_city,worksite_country,worksite_latitude,worksite_longitude,geocoding_status,geocoding_updated_at,geocoding_attempts",
    )
    .eq("id", visitId)
    .maybeSingle();
  if (!row) return { lat: null, lng: null, geocoding_status: null };

  const hasCoords = row.worksite_latitude != null && row.worksite_longitude != null;
  if (
    shouldSkipGeocodingAttempt({
      geocoding_status: row.geocoding_status,
      geocoding_updated_at: row.geocoding_updated_at,
      geocoding_attempts: row.geocoding_attempts,
      hasCoords,
    })
  ) {
    return {
      lat: row.worksite_latitude,
      lng: row.worksite_longitude,
      geocoding_status: row.geocoding_status,
    };
  }

  const baseStatus = nextGeocodingStatusFromAddress({
    addressLine1: row.worksite_address,
    postalCode: row.worksite_postal_code,
    city: row.worksite_city,
    country: row.worksite_country,
  });
  if (baseStatus === "incomplete_address") {
    await supabase
      .from("technical_visits")
      .update({
        geocoding_status: "incomplete_address",
        geocoding_provider: null,
        geocoding_error: "Adresse chantier incomplète",
        geocoding_updated_at: new Date().toISOString(),
      })
      .eq("id", visitId);
    return {
      lat: row.worksite_latitude,
      lng: row.worksite_longitude,
      geocoding_status: "incomplete_address",
    };
  }

  const geo = await geocodeNormalizedAddressWithFallbacks({
    addressLine1: row.worksite_address,
    postalCode: row.worksite_postal_code,
    city: row.worksite_city,
    country: row.worksite_country,
  });

  const attempts = (row.geocoding_attempts ?? 0) + 1;
  if (!geo) {
    await supabase
      .from("technical_visits")
      .update({
        geocoding_status: "geocoding_error",
        geocoding_provider: null,
        geocoding_error: "Aucun résultat de géocodage",
        geocoding_attempts: attempts,
        geocoding_updated_at: new Date().toISOString(),
      })
      .eq("id", visitId);
    return { lat: null, lng: null, geocoding_status: "geocoding_error" };
  }

  await supabase
    .from("technical_visits")
    .update({
      worksite_latitude: geo.lat,
      worksite_longitude: geo.lng,
      geocoding_status: "complete_geocoded",
      geocoding_provider: geo.provider,
      geocoding_error: null,
      geocoding_attempts: attempts,
      geocoding_updated_at: new Date().toISOString(),
    })
    .eq("id", visitId);

  return { lat: geo.lat, lng: geo.lng, geocoding_status: "complete_geocoded" };
}
