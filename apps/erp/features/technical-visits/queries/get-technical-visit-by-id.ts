import { createClient } from "@/lib/supabase/server";

import type { AccessContext } from "@/lib/auth/access-context";
import { canAccessTechnicalVisitDetail } from "@/lib/auth/data-scope";

import {
  getTechnicalVisitFieldAccessLevelForAuthenticatedViewer,
  sanitizeTechnicalVisitDetailForRestrictedTechnician,
} from "@/features/technical-visits/access";
import { ensureProfileGeocoded } from "@/features/technical-visits/lib/ensure-profile-geocoded";
import { ensureVisitGeocoded } from "@/features/technical-visits/lib/ensure-visit-geocoded";
import { getVisitLocationQuality } from "@/features/technical-visits/lib/location-validation";
import {
  getDistanceContextFromAccess,
  getVisitDistanceForContext,
  type TechnicianDistanceProfile,
} from "@/features/technical-visits/lib/visit-distance-context";
import { getLatestVisitStartGeoProof } from "@/features/technical-visits/queries/get-latest-visit-start-geo-proof";
import type { TechnicalVisitDetailRow } from "@/features/technical-visits/types";

async function hydrateContextDistance(
  supabase: Awaited<ReturnType<typeof createClient>>,
  row: TechnicalVisitDetailRow,
  context: "technician" | "admin",
  technician: TechnicianDistanceProfile,
): Promise<TechnicalVisitDetailRow> {
  let worksiteLat = row.worksite_latitude;
  let worksiteLng = row.worksite_longitude;
  if (worksiteLat == null || worksiteLng == null) {
    const ensured = await ensureVisitGeocoded(supabase, row.id);
    if (ensured.lat != null && ensured.lng != null) {
      worksiteLat = ensured.lat;
      worksiteLng = ensured.lng;
    }
  }
  const distance = getVisitDistanceForContext({
    context,
    technician,
    visit: { site_lat: worksiteLat, site_lng: worksiteLng },
  });
  return {
    ...row,
    worksite_latitude: worksiteLat,
    worksite_longitude: worksiteLng,
    distance_km: distance.distanceKm,
    formatted_distance: distance.formattedDistance,
    distance_origin_type: distance.originType,
    visit_location_quality: getVisitLocationQuality({
      ...row,
      worksite_latitude: worksiteLat,
      worksite_longitude: worksiteLng,
    }),
  };
}

export async function getTechnicalVisitById(
  id: string,
  access?: AccessContext,
): Promise<TechnicalVisitDetailRow | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("technical_visits")
    .select(
      `
      *,
      leads (
        id,
        company_name
      ),
      technician:profiles!technical_visits_technician_id_fkey (
        id,
        full_name,
        email
      )
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Impossible de charger la visite technique : ${error.message}`);
  }

  const rowRaw = (data as unknown as TechnicalVisitDetailRow | null) ?? null;
  const context = getDistanceContextFromAccess(access);
  const technician =
    context === "technician" && access?.kind === "authenticated"
      ? (await ensureProfileGeocoded(supabase, access.userId),
        ((
          await supabase
            .from("profiles")
            .select("address_line_1, postal_code, city, country, latitude, longitude")
            .eq("id", access.userId)
            .maybeSingle()
        ).data ?? null))
      : null;
  const row = rowRaw ? await hydrateContextDistance(supabase, rowRaw, context, technician) : null;
  if (!row) {
    return null;
  }
  if (access?.kind === "authenticated") {
    const ok = await canAccessTechnicalVisitDetail(supabase, row, access);
    if (!ok) {
      return null;
    }
    const level = getTechnicalVisitFieldAccessLevelForAuthenticatedViewer(access, row);

    let withProof: TechnicalVisitDetailRow = row;
    if (row.started_at) {
      const proof = await getLatestVisitStartGeoProof(supabase, id);
      withProof = { ...row, start_geo_proof: proof };
    }

    if (level === "technician_restricted") {
      return sanitizeTechnicalVisitDetailForRestrictedTechnician(withProof);
    }
    return withProof;
  }

  if (row.started_at) {
    const proof = await getLatestVisitStartGeoProof(supabase, id);
    return { ...row, start_geo_proof: proof };
  }

  return row;
}
