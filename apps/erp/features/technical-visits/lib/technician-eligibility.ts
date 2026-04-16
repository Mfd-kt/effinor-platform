import { haversineDistanceKm } from "@/features/technical-visits/lib/haversine-distance-km";
import type { TechnicalVisitStatus } from "@/types/database.types";

const HOME_RADIUS_KM_MAX = 200;
const SAME_DAY_VISIT_RADIUS_KM_MAX = 100;

export type TechnicianEligibilityReason =
  | "available"
  | "missing_location"
  | "out_of_home_range"
  | "blocked_by_unavailability"
  | "blocked_by_existing_visit"
  | "too_far_from_same_day_visit";

export type SameDayAssignedVisit = {
  id: string;
  scheduled_at: string | null;
  time_slot: string | null;
  worksite_latitude: number | null;
  worksite_longitude: number | null;
  status: TechnicalVisitStatus;
};

export type TechnicianEligibilityResult = {
  isEligible: boolean;
  isAvailable: boolean;
  reason: TechnicianEligibilityReason;
  distanceKm?: number | null;
  conflictingVisitDistanceKm?: number | null;
  conflictingVisitId?: string | null;
  rankingScore?: number;
};

function parisYmd(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
}

export function getSameDayAssignedVisitsForTechnician(
  visits: SameDayAssignedVisit[],
  targetScheduledAt: string | null | undefined,
  excludeVisitId?: string | null,
): SameDayAssignedVisit[] {
  if (!targetScheduledAt) return [];
  const targetDay = parisYmd(targetScheduledAt);
  return visits.filter((v) => {
    if (!v.scheduled_at) return false;
    if (excludeVisitId && v.id === excludeVisitId) return false;
    return parisYmd(v.scheduled_at) === targetDay;
  });
}

export function isWithinHomeRadius(distanceKm: number | null | undefined): boolean {
  return distanceKm != null && Number.isFinite(distanceKm) && distanceKm <= HOME_RADIUS_KM_MAX;
}

export function isWithinSameDayVisitRadius(distanceKm: number | null | undefined): boolean {
  return distanceKm != null && Number.isFinite(distanceKm) && distanceKm <= SAME_DAY_VISIT_RADIUS_KM_MAX;
}

function sameDayProximityBonus(minDistanceKm: number | null): number {
  if (minDistanceKm == null) return 0;
  if (minDistanceKm < 30) return 30;
  if (minDistanceKm < 60) return 20;
  if (minDistanceKm <= 100) return 10;
  return 0;
}

export function getTechnicianEligibilityForVisit(input: {
  technicianHomeLat: number | null;
  technicianHomeLng: number | null;
  targetVisitLat: number | null;
  targetVisitLng: number | null;
  targetScheduledAt: string | null;
  targetTimeSlot: string | null;
  sameDayAssignedVisits: SameDayAssignedVisit[];
}): TechnicianEligibilityResult {
  const {
    technicianHomeLat,
    technicianHomeLng,
    targetVisitLat,
    targetVisitLng,
    targetScheduledAt,
    targetTimeSlot,
    sameDayAssignedVisits,
  } = input;

  if (
    technicianHomeLat == null ||
    technicianHomeLng == null ||
    targetVisitLat == null ||
    targetVisitLng == null
  ) {
    return { isEligible: false, isAvailable: false, reason: "missing_location", distanceKm: null };
  }

  const homeDistanceKm = haversineDistanceKm(
    technicianHomeLat,
    technicianHomeLng,
    targetVisitLat,
    targetVisitLng,
  );
  if (!isWithinHomeRadius(homeDistanceKm)) {
    return {
      isEligible: false,
      isAvailable: false,
      reason: "out_of_home_range",
      distanceKm: homeDistanceKm,
    };
  }

  if (targetScheduledAt && targetTimeSlot?.trim()) {
    const slotConflict = sameDayAssignedVisits.find((v) => (v.time_slot?.trim() ?? "") === targetTimeSlot.trim());
    if (slotConflict) {
      return {
        isEligible: false,
        isAvailable: false,
        reason: "blocked_by_unavailability",
        distanceKm: homeDistanceKm,
        conflictingVisitId: slotConflict.id,
      };
    }
  }

  let minSameDayDistanceKm: number | null = null;
  for (const v of sameDayAssignedVisits) {
    if (v.worksite_latitude == null || v.worksite_longitude == null) {
      return {
        isEligible: false,
        isAvailable: false,
        reason: "blocked_by_existing_visit",
        distanceKm: homeDistanceKm,
        conflictingVisitId: v.id,
      };
    }
    const d = haversineDistanceKm(v.worksite_latitude, v.worksite_longitude, targetVisitLat, targetVisitLng);
    if (!isWithinSameDayVisitRadius(d)) {
      return {
        isEligible: false,
        isAvailable: false,
        reason: "too_far_from_same_day_visit",
        distanceKm: homeDistanceKm,
        conflictingVisitDistanceKm: d,
        conflictingVisitId: v.id,
      };
    }
    if (d != null && (minSameDayDistanceKm == null || d < minSameDayDistanceKm)) {
      minSameDayDistanceKm = d;
    }
  }

  const distanceScore = Math.max(0, 200 - (homeDistanceKm ?? 200));
  const bonus = sameDayProximityBonus(minSameDayDistanceKm);
  return {
    isEligible: true,
    isAvailable: true,
    reason: "available",
    distanceKm: homeDistanceKm,
    rankingScore: Math.round(distanceScore + bonus),
  };
}
