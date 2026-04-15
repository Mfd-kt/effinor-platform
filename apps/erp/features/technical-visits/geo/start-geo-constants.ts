/** Seuils pragmatiques terrain (GPS téléphone ~5–50 m ; bâtiments/industriel). */
export const START_GEO_ON_SITE_MAX_M = 120;
export const START_GEO_NEAR_SITE_MAX_M = 600;

export type VisitStartGeoCoherence =
  | "on_site"
  | "near_site"
  | "far_from_site"
  | "site_coords_missing"
  | "geo_unavailable"
  | "geo_refused";

export type VisitStartGeoProviderErrorCode = "refused" | "unavailable" | "timeout" | "incompatible";
