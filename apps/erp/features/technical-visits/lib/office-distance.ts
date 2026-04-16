const OFFICE_THIAIS = {
  label: "Bureau Thiais (1 avenue de l'europe, 94320)",
  latitude: 48.7666,
  longitude: 2.3927,
} as const;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function computeOfficeDistanceKm(
  worksiteLatitude: number | null | undefined,
  worksiteLongitude: number | null | undefined,
): number | null {
  if (
    worksiteLatitude == null ||
    worksiteLongitude == null ||
    !Number.isFinite(worksiteLatitude) ||
    !Number.isFinite(worksiteLongitude)
  ) {
    return null;
  }
  return haversineKm(OFFICE_THIAIS.latitude, OFFICE_THIAIS.longitude, worksiteLatitude, worksiteLongitude);
}

export function formatOfficeDistanceKm(
  worksiteLatitude: number | null | undefined,
  worksiteLongitude: number | null | undefined,
  precomputedKm?: number | null,
): string {
  const km =
    precomputedKm != null && Number.isFinite(precomputedKm)
      ? precomputedKm
      : computeOfficeDistanceKm(worksiteLatitude, worksiteLongitude);
  if (km == null) return "—";
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(km)} km`;
}

export const OFFICE_DISTANCE_LABEL = OFFICE_THIAIS.label;
