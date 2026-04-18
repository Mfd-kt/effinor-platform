import { resolveYellowPagesApifyInputProfile } from "./client";
import type { RunYellowPagesApifyImportInput } from "./types";
import { resolveGoogleMapsLocationQuery } from "./google-maps-actor-input";

/**
 * URL de résultats « Quoi / Où » sur pagesjaunes.fr (utilisable comme startUrl pour les actors type memo23).
 * @see https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui=…&ou=…&univers=pagesjaunes
 */
export function buildPagesJaunesChercherLesProsUrl(quoiqui: string, ou: string): string {
  const params = new URLSearchParams();
  params.set("quoiqui", quoiqui.trim());
  params.set("ou", ou.trim());
  params.set("univers", "pagesjaunes");
  return `https://www.pagesjaunes.fr/annuaire/chercherlespros?${params.toString()}`;
}

/**
 * Input JSON pour l’actor Pages Jaunes Apify.
 * - `google_maps_compat` : `searchStringsArray`, `locationQuery`, `maxCrawledPlacesPerSearch` (actors type Compass / annuaire).
 * - `trudax_us` : `search`, `location`, `maxItems`, `debugMode` (scrapers Yellow Pages US / tests — pas la source principale FR).
 * - `pagesjaunes_fr` : `startUrls`, `maxItems`, concurrence, `proxyConfiguration` résidentiel FR (ex. memo23/pagesjaunes-scraper-cheerio).
 */
export function buildYellowPagesActorRunInput(
  input: RunYellowPagesApifyImportInput,
  actorId: string | null,
): Record<string, unknown> {
  const locationQuery = resolveGoogleMapsLocationQuery(input);
  const max = input.maxYellowPagesResults ?? input.maxCrawledPlacesPerSearch ?? 50;
  const profile = resolveYellowPagesApifyInputProfile(actorId);

  if (profile === "trudax_us") {
    const parts = (input.searchStrings ?? []).map((s) => String(s).trim()).filter((s) => s.length > 0);
    const search = parts.join(", ");
    if (!search) {
      throw new Error("Import Pages Jaunes (format US) : au moins une requête de recherche est requise.");
    }
    return {
      search,
      location: locationQuery,
      maxItems: max,
      debugMode: false,
    };
  }

  if (profile === "pagesjaunes_fr") {
    const parts = (input.searchStrings ?? []).map((s) => String(s).trim()).filter((s) => s.length > 0);
    const quoiqui = parts.join(" ").trim();
    if (!quoiqui) {
      throw new Error("Import PagesJaunes.fr : au moins une requête (Quoi / Qui) est requise.");
    }
    const startUrl = buildPagesJaunesChercherLesProsUrl(quoiqui, locationQuery);
    return {
      startUrls: [startUrl],
      maxItems: max,
      maxConcurrency: 10,
      minConcurrency: 1,
      maxRequestRetries: 100,
      proxyConfiguration: {
        useApifyProxy: true,
        apifyProxyGroups: ["RESIDENTIAL"],
        apifyProxyCountry: "FR",
      },
    };
  }

  return {
    searchStringsArray: input.searchStrings,
    maxCrawledPlacesPerSearch: max,
    locationQuery,
  };
}
