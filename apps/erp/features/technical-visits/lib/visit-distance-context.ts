import type { AccessContext } from "@/lib/auth/access-context";
import { COMPANY_LOCATION } from "@/features/technical-visits/lib/company-location";
import { formatDistanceKmLabel, haversineDistanceKm } from "@/features/technical-visits/lib/haversine-distance-km";

export type VisitDistanceContext = "technician" | "admin";
export type VisitDistanceOriginType = "technician" | "company";

export type TechnicianDistanceProfile = {
  address_line_1?: string | null;
  postal_code?: string | null;
  city?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
} | null;

export type VisitDistanceTarget = {
  site_address_line_1?: string | null;
  site_postal_code?: string | null;
  site_city?: string | null;
  site_country?: string | null;
  site_lat?: number | null;
  site_lng?: number | null;
};

export function getDistanceContextFromAccess(access: AccessContext | undefined): VisitDistanceContext {
  if (access?.kind !== "authenticated") return "admin";
  return access.roleCodes.includes("technician") ? "technician" : "admin";
}

export function getVisitDistanceForContext({
  context,
  technician,
  visit,
}: {
  context: VisitDistanceContext;
  technician: TechnicianDistanceProfile;
  visit: VisitDistanceTarget;
}): {
  distanceKm: number | null;
  formattedDistance: string;
  distanceLabel: string;
  originType: VisitDistanceOriginType;
} {
  const destLat = visit.site_lat ?? null;
  const destLng = visit.site_lng ?? null;
  const originType: VisitDistanceOriginType = context === "technician" ? "technician" : "company";

  const originLat = context === "technician" ? (technician?.latitude ?? null) : COMPANY_LOCATION.latitude;
  const originLng = context === "technician" ? (technician?.longitude ?? null) : COMPANY_LOCATION.longitude;

  const distanceKm = haversineDistanceKm(originLat, originLng, destLat, destLng);
  const formattedDistance = formatDistanceKmLabel(distanceKm);

  return {
    distanceKm,
    formattedDistance,
    distanceLabel: formattedDistance,
    originType,
  };
}
