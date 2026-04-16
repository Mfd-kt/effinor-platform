import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";
import { ACTIVE_TECHNICAL_VISIT_STATUSES } from "@/features/leads/constants/technical-visit-active-statuses";
import { geocodeWorksiteForSave } from "@/features/technical-visits/lib/geocode-worksite-for-save";
import {
  getSameDayAssignedVisitsForTechnician,
  getTechnicianEligibilityForVisit,
  type SameDayAssignedVisit,
} from "@/features/technical-visits/lib/technician-eligibility";
import {
  getRecommendedTechnician,
  getSelectedTechnicianRecommendationStatus,
} from "@/features/technical-visits/lib/technician-recommendation";
import type { GetTechnicalVisitFormOptionsParams } from "@/features/technical-visits/queries/technical-visit-form-options-params";
import type { ProfileOption, TechnicalVisitFormOptions } from "@/features/technical-visits/types";

export type TechnicianRecommendationBundle = Pick<
  TechnicalVisitFormOptions,
  "profiles" | "technicianOrphanOption" | "recommendation"
>;

/**
 * Recalcule profils + recommandation technicien (même logique que le rendu du formulaire VT).
 * À appeler côté serveur au moment d’une action (ex. affecter le recommandé).
 */
export async function loadTechnicianRecommendationBundle(
  supabase: SupabaseClient<Database>,
  params?: GetTechnicalVisitFormOptionsParams,
): Promise<TechnicianRecommendationBundle> {
  const targetCoords =
    params?.targetWorksiteLatitude != null && params?.targetWorksiteLongitude != null
      ? { lat: params.targetWorksiteLatitude, lng: params.targetWorksiteLongitude }
      : await geocodeWorksiteForSave({
          worksite_address: params?.targetWorksiteAddress ?? null,
          worksite_postal_code: params?.targetWorksitePostalCode ?? null,
          worksite_city: params?.targetWorksiteCity ?? null,
          worksite_country: params?.targetWorksiteCountry ?? null,
        });
  const hasSchedulingContext = Boolean(params?.targetScheduledAt?.trim() && params?.targetTimeSlot?.trim());
  const hasWorksiteCoordsContext = targetCoords.lat != null && targetCoords.lng != null;
  const recommendationAvailabilityState =
    hasSchedulingContext && hasWorksiteCoordsContext ? "ready" : "insufficient_context";

  const { data: techRole } = await supabase.from("roles").select("id").eq("code", "technician").maybeSingle();

  let profilesRes: {
    data: {
      id: string;
      full_name: string | null;
      email: string;
      latitude: number | null;
      longitude: number | null;
    }[] | null;
    error: { message: string } | null;
  };

  if (!techRole?.id) {
    profilesRes = { data: [], error: null };
  } else {
    const { data: urRows, error: urErr } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role_id", techRole.id);
    if (urErr) {
      profilesRes = { data: null, error: urErr };
    } else {
      const technicianIds = [...new Set((urRows ?? []).map((r) => r.user_id))];
      if (technicianIds.length === 0) {
        profilesRes = { data: [], error: null };
      } else {
        const res = await supabase
          .from("profiles")
          .select("id, full_name, email, latitude, longitude")
          .in("id", technicianIds)
          .eq("is_active", true)
          .is("deleted_at", null)
          .order("full_name", { ascending: true });
        profilesRes = { data: res.data, error: res.error };
      }
    }
  }

  if (profilesRes.error) {
    throw new Error(`Profils : ${profilesRes.error.message}`);
  }

  const technicianIds = (profilesRes.data ?? []).map((r) => r.id);
  const sameDayVisitsByTechnician = new Map<string, SameDayAssignedVisit[]>();
  if (technicianIds.length > 0 && params?.targetScheduledAt) {
    const { data: vtRows } = await supabase
      .from("technical_visits")
      .select("id, technician_id, scheduled_at, time_slot, worksite_latitude, worksite_longitude, status")
      .in("technician_id", technicianIds)
      .in("status", [...ACTIVE_TECHNICAL_VISIT_STATUSES])
      .is("deleted_at", null);
    for (const row of vtRows ?? []) {
      const tid = row.technician_id ?? "";
      if (!tid) continue;
      const arr = sameDayVisitsByTechnician.get(tid) ?? [];
      arr.push({
        id: row.id,
        scheduled_at: row.scheduled_at,
        time_slot: row.time_slot,
        worksite_latitude: row.worksite_latitude,
        worksite_longitude: row.worksite_longitude,
        status: row.status,
      });
      sameDayVisitsByTechnician.set(tid, arr);
    }
  }

  const profiles = (profilesRes.data ?? [])
    .map((r) => {
      const base: ProfileOption = {
        id: r.id,
        label: r.full_name?.trim() || r.email || r.id,
      };
      const result = getTechnicianEligibilityForVisit({
        technicianHomeLat: r.latitude ?? null,
        technicianHomeLng: r.longitude ?? null,
        targetVisitLat: targetCoords.lat ?? null,
        targetVisitLng: targetCoords.lng ?? null,
        targetScheduledAt: params?.targetScheduledAt ?? null,
        targetTimeSlot: params?.targetTimeSlot ?? null,
        sameDayAssignedVisits: getSameDayAssignedVisitsForTechnician(
          sameDayVisitsByTechnician.get(r.id) ?? [],
          params?.targetScheduledAt ?? null,
          params?.visitId ?? null,
        ),
      });
      return {
        ...base,
        is_eligible: result.isEligible,
        eligibility_reason: result.reason,
        distance_km: result.distanceKm ?? null,
        conflicting_visit_distance_km: result.conflictingVisitDistanceKm ?? null,
        conflicting_visit_id: result.conflictingVisitId ?? null,
        ranking_score: result.rankingScore,
      };
    })
    .sort((a, b) => {
      if ((a.is_eligible ?? false) !== (b.is_eligible ?? false)) return a.is_eligible ? -1 : 1;
      const scoreDelta = (b.ranking_score ?? -1) - (a.ranking_score ?? -1);
      if (scoreDelta !== 0) return scoreDelta;
      const da = a.distance_km ?? Number.POSITIVE_INFINITY;
      const db = b.distance_km ?? Number.POSITIVE_INFINITY;
      if (da !== db) return da - db;
      return a.label.localeCompare(b.label, "fr");
    });

  const visitTid = params?.visitTechnicianProfileId?.trim() ?? "";
  let technicianOrphanOption: ProfileOption | null = null;
  if (visitTid && !profiles.some((p) => p.id === visitTid)) {
    const { data: orphan } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", visitTid)
      .maybeSingle();
    if (orphan) {
      technicianOrphanOption = {
        id: orphan.id,
        label: orphan.full_name?.trim() || orphan.email || orphan.id,
      };
    }
  }

  const recommendedTechnician = getRecommendedTechnician(profiles, recommendationAvailabilityState);
  const selectedTechnicianStatus = getSelectedTechnicianRecommendationStatus({
    selectedTechnicianId: params?.visitTechnicianProfileId ?? null,
    profiles,
    recommendedTechnician,
  });

  return {
    profiles,
    technicianOrphanOption,
    recommendation: {
      availabilityState: recommendationAvailabilityState,
      message:
        recommendationAvailabilityState === "insufficient_context"
          ? "Recommandation indisponible tant que la date, le créneau et la localisation chantier ne sont pas renseignés."
          : recommendedTechnician == null
            ? "Aucun technicien éligible pour cette date / ce créneau / ce chantier."
            : null,
      recommendedTechnician,
      selectedTechnicianStatus,
    },
  };
}
