import type {
  ProfileOption,
  RecommendedTechnician,
  SelectedTechnicianRecommendationStatus,
  TechnicianRecommendationAvailabilityState,
} from "@/features/technical-visits/types";

function recommendationReasonFromProfile(p: ProfileOption): string {
  if (p.conflicting_visit_distance_km != null && p.conflicting_visit_distance_km < 30) {
    return "Tournée très cohérente (< 30 km avec la visite du jour).";
  }
  if (p.conflicting_visit_distance_km != null && p.conflicting_visit_distance_km < 60) {
    return "Bonne cohérence de tournée (30-60 km).";
  }
  if (p.conflicting_visit_distance_km != null) {
    return "Cohérence acceptable de tournée (60-100 km).";
  }
  return "Meilleur score disponible (distance + disponibilité).";
}

export function getRecommendedTechnician(
  profiles: ProfileOption[],
  availabilityState: TechnicianRecommendationAvailabilityState,
): RecommendedTechnician {
  if (availabilityState !== "ready") return null;
  const eligible = profiles.filter((p) => p.is_eligible);
  if (eligible.length === 0) return null;

  const ranked = [...eligible].sort((a, b) => {
    const scoreDelta = (b.ranking_score ?? -1) - (a.ranking_score ?? -1);
    if (scoreDelta !== 0) return scoreDelta;
    const da = a.distance_km ?? Number.POSITIVE_INFINITY;
    const db = b.distance_km ?? Number.POSITIVE_INFINITY;
    if (da !== db) return da - db;
    return (a.label ?? "").localeCompare(b.label ?? "", "fr");
  });
  const top = ranked[0]!;
  return {
    technicianId: top.id,
    fullName: top.label,
    score: top.ranking_score ?? 0,
    distanceKm: top.distance_km ?? null,
    conflictingVisitDistanceKm: top.conflicting_visit_distance_km ?? null,
    availabilityReason: top.eligibility_reason ?? "available",
    recommendationReason: recommendationReasonFromProfile(top),
  };
}

export function getSelectedTechnicianRecommendationStatus(input: {
  selectedTechnicianId: string | null | undefined;
  profiles: ProfileOption[];
  recommendedTechnician: RecommendedTechnician;
}): SelectedTechnicianRecommendationStatus {
  const selectedId = input.selectedTechnicianId?.trim() ?? "";
  if (!selectedId) return null;
  const selected = input.profiles.find((p) => p.id === selectedId);
  if (!selected) {
    return {
      technicianId: selectedId,
      isEligible: false,
      isRecommended: false,
      score: null,
      reason: "not_found",
    };
  }
  const isRecommended = input.recommendedTechnician?.technicianId === selected.id;
  if (isRecommended) {
    return {
      technicianId: selected.id,
      isEligible: Boolean(selected.is_eligible),
      isRecommended: true,
      score: selected.ranking_score ?? null,
      reason: "recommended",
    };
  }
  if (selected.is_eligible) {
    return {
      technicianId: selected.id,
      isEligible: true,
      isRecommended: false,
      score: selected.ranking_score ?? null,
      reason: "eligible_not_recommended",
    };
  }
  return {
    technicianId: selected.id,
    isEligible: false,
    isRecommended: false,
    score: selected.ranking_score ?? null,
    reason: "no_longer_eligible",
  };
}
