import type { RunGoogleMapsApifyImportInput } from "./types";
import {
  DEFAULT_APIFY_GOOGLE_MAPS_LOCATION_QUERY,
  getLeadGenGoogleMapsGeoOption,
  injectGeoTargetInSearchStrings,
} from "../lib/google-maps-region-options";
export { DEFAULT_APIFY_GOOGLE_MAPS_LOCATION_QUERY };

/** Défaut : cartes Google Maps centrées sur la France (actor type Compass / recherche + zone). */
export function resolveGoogleMapsLocationQuery(input: RunGoogleMapsApifyImportInput): string {
  const q = input.locationQuery?.trim();
  return q && q.length > 0 ? q : DEFAULT_APIFY_GOOGLE_MAPS_LOCATION_QUERY;
}

/** Input JSON envoyé à l’actor Apify (schéma type Google Maps Scraper / Compass). */
export function buildGoogleMapsActorRunInput(input: RunGoogleMapsApifyImportInput): Record<string, unknown> {
  const locationQuery = resolveGoogleMapsLocationQuery(input);
  const geoTarget = getLeadGenGoogleMapsGeoOption(locationQuery);
  const searchStringsArray = injectGeoTargetInSearchStrings(input.searchStrings, locationQuery);

  const runInput: Record<string, unknown> = {
    searchStringsArray,
    maxCrawledPlacesPerSearch: input.maxCrawledPlacesPerSearch ?? 50,
    /** Toujours présent pour cadrer la recherche (défaut France). */
    locationQuery,
  };
  if (geoTarget) {
    runInput.country = "France";
    runInput.countryCode = "FR";
    runInput.geoTarget = {
      value: geoTarget.value,
      label: geoTarget.label,
      kind: geoTarget.kind,
      departmentCode: geoTarget.departmentCode ?? null,
    };
  }
  if (typeof input.includeWebResults === "boolean") {
    runInput.includeWebResults = input.includeWebResults;
  }
  return runInput;
}
