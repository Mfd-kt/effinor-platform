/**
 * Configuration de la source Apify PAP.fr — **annonces LOCATION uniquement**.
 *
 * Acteur partagé avec la source `pap` (ventes) :
 *   azzouzana/pap-fr-mass-products-scraper-by-search-url
 * Tarif : ~$2 / 1000 annonces.
 *
 * Workflow : l'utilisateur applique ses filtres sur https://www.pap.fr (location,
 * type de bien, ville, etc.), puis colle l'URL résultante dans la modale
 * `StartPapLocationImportModal`. Aucun filtre côté ERP — on délègue tout à PAP.
 */
export const PAP_LOCATION_ACTOR_ID =
  "azzouzana/pap-fr-mass-products-scraper-by-search-url" as const;

/** Nombre d'annonces par défaut pour un run. */
export const PAP_LOCATION_DEFAULT_MAX_ITEMS = 50;

/** Limite max par run (protection budget — ~$2 / 1000 items). */
export const PAP_LOCATION_MAX_ITEMS = 1000;

/** Code de la source persisté dans `lead_generation_*.source`. */
export const PAP_LOCATION_SOURCE_CODE = "pap_location" as const;

/** Libellé UI affiché dans les listes. */
export const PAP_LOCATION_SOURCE_LABEL = "PAP.fr — Locations";

/** URL par défaut suggérée dans la modale. */
export const PAP_LOCATION_DEFAULT_URL = "https://www.pap.fr/annonce/location-maison";
