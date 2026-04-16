export type LocationQualityStatus =
  | "complete_geocoded"
  | "complete_not_geocoded"
  | "incomplete_address"
  | "invalid_coordinates"
  | "geocoding_error";

function normalizeString(v: string | null | undefined): string {
  return (v ?? "").trim().replace(/\s+/g, " ");
}

export function isValidLatitude(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= -90 && value <= 90;
}

export function isValidLongitude(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= -180 && value <= 180;
}

export function hasCompleteAddress(input: {
  address_line_1?: string | null;
  postal_code?: string | null;
  city?: string | null;
  country?: string | null;
}): boolean {
  return Boolean(
    normalizeString(input.address_line_1).length > 0 &&
      normalizeString(input.postal_code).length > 0 &&
      normalizeString(input.city).length > 0 &&
      normalizeString(input.country).length > 0,
  );
}

/**
 * Suffisant pour tenter un géocodage chantier : adresse complète **ou** code postal seul
 * (le pays est complété côté app, ex. « France », pour la requête Nominatim).
 */
export function hasEnoughForWorksiteGeocoding(input: {
  address_line_1?: string | null;
  postal_code?: string | null;
  city?: string | null;
  country?: string | null;
}): boolean {
  if (hasCompleteAddress(input)) return true;
  return normalizeString(input.postal_code).length > 0;
}

export function getProfileLocationQuality(input: {
  address_line_1?: string | null;
  postal_code?: string | null;
  city?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  geocoding_status?: string | null;
}): LocationQualityStatus {
  const complete = hasCompleteAddress(input);
  const hasLat = input.latitude != null;
  const hasLng = input.longitude != null;
  if (!complete) return "incomplete_address";
  if (!hasLat || !hasLng) return input.geocoding_status === "geocoding_error" ? "geocoding_error" : "complete_not_geocoded";
  if (!isValidLatitude(input.latitude) || !isValidLongitude(input.longitude)) return "invalid_coordinates";
  return "complete_geocoded";
}

export function getVisitLocationQuality(input: {
  worksite_address?: string | null;
  worksite_postal_code?: string | null;
  worksite_city?: string | null;
  worksite_country?: string | null;
  worksite_latitude?: number | null;
  worksite_longitude?: number | null;
  geocoding_status?: string | null;
}): LocationQualityStatus {
  const hasLat = input.worksite_latitude != null;
  const hasLng = input.worksite_longitude != null;
  if (
    hasLat &&
    hasLng &&
    isValidLatitude(input.worksite_latitude) &&
    isValidLongitude(input.worksite_longitude)
  ) {
    return "complete_geocoded";
  }

  const textOk =
    hasCompleteAddress({
      address_line_1: input.worksite_address,
      postal_code: input.worksite_postal_code,
      city: input.worksite_city,
      country: input.worksite_country,
    }) || normalizeString(input.worksite_postal_code).length > 0;
  if (!textOk) return "incomplete_address";
  if (!hasLat || !hasLng) return input.geocoding_status === "geocoding_error" ? "geocoding_error" : "complete_not_geocoded";
  if (!isValidLatitude(input.worksite_latitude) || !isValidLongitude(input.worksite_longitude)) {
    return "invalid_coordinates";
  }
  return "complete_geocoded";
}

export function normalizeAddressPart(value: string | null | undefined): string | null {
  const v = normalizeString(value);
  return v.length > 0 ? v : null;
}
