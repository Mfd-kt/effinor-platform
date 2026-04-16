import { createClient } from "@/lib/supabase/server";

import type { AccessContext } from "@/lib/auth/access-context";
import { canAccessTechnicalVisitDetail } from "@/lib/auth/data-scope";

import {
  getTechnicalVisitFieldAccessLevelForAuthenticatedViewer,
  sanitizeTechnicalVisitDetailForRestrictedTechnician,
} from "@/features/technical-visits/access";
import { geocodeFranceAddressServer } from "@/features/technical-visits/lib/nominatim-geocode-server";
import { computeOfficeDistanceKm } from "@/features/technical-visits/lib/office-distance";
import { buildWorksiteGeocodeFallbackQueriesFromFields } from "@/features/technical-visits/lib/worksite-geocode-query";
import { getLatestVisitStartGeoProof } from "@/features/technical-visits/queries/get-latest-visit-start-geo-proof";
import type { TechnicalVisitDetailRow } from "@/features/technical-visits/types";

async function hydrateOfficeDistance(row: TechnicalVisitDetailRow): Promise<TechnicalVisitDetailRow> {
  const direct = computeOfficeDistanceKm(row.worksite_latitude, row.worksite_longitude);
  if (direct != null) {
    return { ...row, office_distance_km: direct };
  }
  const queries = buildWorksiteGeocodeFallbackQueriesFromFields({
    worksite_address: row.worksite_address,
    worksite_postal_code: row.worksite_postal_code,
    worksite_city: row.worksite_city,
  });
  for (const q of queries) {
    const coords = await geocodeFranceAddressServer(q);
    if (coords) {
      return { ...row, office_distance_km: computeOfficeDistanceKm(coords.lat, coords.lng) };
    }
  }
  return { ...row, office_distance_km: null };
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
  const row = rowRaw ? await hydrateOfficeDistance(rowRaw) : null;
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
