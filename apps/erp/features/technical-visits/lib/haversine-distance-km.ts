import { isValidLatitude, isValidLongitude } from "@/features/technical-visits/lib/location-validation";

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineDistanceKm(
  originLat: number | null | undefined,
  originLng: number | null | undefined,
  destLat: number | null | undefined,
  destLng: number | null | undefined,
): number | null {
  if (
    originLat == null ||
    originLng == null ||
    destLat == null ||
    destLng == null ||
    !isValidLatitude(originLat) ||
    !isValidLongitude(originLng) ||
    !isValidLatitude(destLat) ||
    !isValidLongitude(destLng)
  ) {
    return null;
  }
  const R = 6371;
  const dLat = toRad(destLat - originLat);
  const dLon = toRad(destLng - originLng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(originLat)) * Math.cos(toRad(destLat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km = R * c;
  return Math.round(km * 10) / 10;
}

export function formatDistanceKmLabel(distanceKm: number | null | undefined): string {
  if (distanceKm == null || !Number.isFinite(distanceKm)) return "Distance indisponible";
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(distanceKm)} km`;
}
