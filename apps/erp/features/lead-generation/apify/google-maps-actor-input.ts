import type { RunGoogleMapsApifyImportInput } from "./types";

/** Défaut : cartes Google Maps centrées sur la France métropolitaine (actor type Compass / recherche + zone). */
export const DEFAULT_APIFY_GOOGLE_MAPS_LOCATION_QUERY = "France métropolitaine";

/**
 * Résout la zone géographique envoyée à Apify : toujours une chaîne non vide.
 */
export function resolveGoogleMapsLocationQuery(input: RunGoogleMapsApifyImportInput): string {
  const q = input.locationQuery?.trim();
  return q && q.length > 0 ? q : DEFAULT_APIFY_GOOGLE_MAPS_LOCATION_QUERY;
}

/** Input JSON envoyé à l’actor Apify (schéma type Google Maps Scraper / Compass). */
export function buildGoogleMapsActorRunInput(input: RunGoogleMapsApifyImportInput): Record<string, unknown> {
  const locationQuery = resolveGoogleMapsLocationQuery(input);
  const runInput: Record<string, unknown> = {
    searchStringsArray: input.searchStrings,
    maxCrawledPlacesPerSearch: input.maxCrawledPlacesPerSearch ?? 50,
    /** Toujours présent pour cadrer la recherche (défaut France métropolitaine). */
    locationQuery,
  };
  if (typeof input.includeWebResults === "boolean") {
    runInput.includeWebResults = input.includeWebResults;
  }
  return runInput;
}
