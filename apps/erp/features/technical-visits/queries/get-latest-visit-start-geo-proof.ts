import type { SupabaseClient } from "@supabase/supabase-js";

import { isTechnicalVisitGeoProofsTableUnavailable } from "@/features/technical-visits/geo/geo-proofs-schema-error";
import type { TechnicalVisitStartGeoProofSummary } from "@/features/technical-visits/types";
import type { Database } from "@/types/database.types";

type Supabase = SupabaseClient<Database>;

export async function getLatestVisitStartGeoProof(
  supabase: Supabase,
  visitId: string,
): Promise<TechnicalVisitStartGeoProofSummary | null> {
  const { data, error } = await supabase
    .from("technical_visit_geo_proofs")
    .select(
      "id, coherence, server_recorded_at, client_captured_at, distance_to_site_m, latitude, longitude, accuracy_m, provider_error_code, worksite_latitude_snapshot, worksite_longitude_snapshot",
    )
    .eq("technical_visit_id", visitId)
    .eq("kind", "visit_start")
    .order("server_recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isTechnicalVisitGeoProofsTableUnavailable(error)) {
      return null;
    }
    throw new Error(`Preuve géolocalisation visite : ${error.message}`);
  }
  if (!data) return null;

  return {
    id: data.id,
    coherence: data.coherence,
    server_recorded_at: data.server_recorded_at,
    client_captured_at: data.client_captured_at,
    distance_to_site_m: data.distance_to_site_m,
    latitude: data.latitude,
    longitude: data.longitude,
    accuracy_m: data.accuracy_m,
    provider_error_code: data.provider_error_code,
    worksite_latitude_snapshot: data.worksite_latitude_snapshot,
    worksite_longitude_snapshot: data.worksite_longitude_snapshot,
  };
}
