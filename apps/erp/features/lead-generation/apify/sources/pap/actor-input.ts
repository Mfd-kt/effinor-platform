import { z } from "zod";

import { PAP_DEFAULT_MAX_ITEMS, PAP_MAX_ITEMS } from "./config";

/**
 * Input acteur PAP.fr — `azzouzana/pap-fr-mass-products-scraper-by-search-url`.
 *
 * `startUrl` peut être :
 *   - **Vente** : `https://www.pap.fr/annonce/vente-maison`
 *   - **Location** : `https://www.pap.fr/annonce/location-maison`
 *
 * Les deux sources sont scrapées séparément (un import = un type d'annonce).
 * Le mapper (`map-item.ts`) détecte automatiquement vente / location depuis
 * l'URL de chaque item et persiste `listing_kind = "sale" | "rental"` en BDD.
 *
 * UI : l'utilisateur colle une URL pap.fr (vente OU location) avec ses filtres
 * CEE déjà appliqués + choisit le nombre max d'annonces.
 */
export const papActorInputSchema = z.object({
  /** URL de recherche pap.fr complète (ex: vente maison Bordeaux DPE D-G). */
  startUrl: z.string().url("startUrl doit être une URL pap.fr valide"),
  /** Nombre max d'annonces à récupérer pour ce run. */
  maxItemsToScrape: z.number().int().min(1).max(PAP_MAX_ITEMS).default(PAP_DEFAULT_MAX_ITEMS),
});

export type PapActorInput = z.infer<typeof papActorInputSchema>;
