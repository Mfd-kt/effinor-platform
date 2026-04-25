import { z } from "zod";

import { PAP_LOCATION_DEFAULT_MAX_ITEMS, PAP_LOCATION_MAX_ITEMS } from "./config";

/**
 * Input acteur PAP.fr (Locations) — `azzouzana/pap-fr-mass-products-scraper-by-search-url`.
 *
 * `startUrl` = URL de recherche pap.fr **location** (ex : `/annonce/location-maison-…`).
 *
 * Pour les ventes : utiliser plutôt la source `pap` (`apps/erp/features/lead-generation/apify/sources/pap`).
 */
export const papLocationActorInputSchema = z.object({
  /** URL de recherche pap.fr complète (location maison + filtres CEE). */
  startUrl: z.string().url("startUrl doit être une URL pap.fr valide"),
  /** Nombre max d'annonces à récupérer pour ce run. */
  maxItemsToScrape: z
    .number()
    .int()
    .min(1)
    .max(PAP_LOCATION_MAX_ITEMS)
    .default(PAP_LOCATION_DEFAULT_MAX_ITEMS),
});

export type PapLocationActorInput = z.infer<typeof papLocationActorInputSchema>;
