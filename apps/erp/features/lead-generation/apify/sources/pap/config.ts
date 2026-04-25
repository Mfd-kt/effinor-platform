/**
 * Configuration de la source Apify PAP.fr.
 *
 * Acteur : azzouzana/pap-fr-mass-products-scraper-by-search-url
 * Tarif  : ~$2 / 1000 annonces
 *
 * Avantage par rapport à leboncoin-immobilier : les téléphones (`telephones[]`)
 * sont systématiquement renvoyés, y compris en mode recherche par URL.
 *
 * Workflow : l'utilisateur applique ses filtres sur https://www.pap.fr (vente,
 * type de bien, DPE, ville, etc.), puis colle l'URL résultante dans la modale
 * `StartPapImportModal`. Aucun filtre côté ERP — on délègue tout à PAP.
 */
export const PAP_ACTOR_ID = "azzouzana/pap-fr-mass-products-scraper-by-search-url" as const;

/** Nombre d'annonces par défaut pour un run. */
export const PAP_DEFAULT_MAX_ITEMS = 50;

/** Limite max par run (protection budget — ~$2 / 1000 items). */
export const PAP_MAX_ITEMS = 1000;

/** Code de la source persisté dans `lead_generation_*.source`. */
export const PAP_SOURCE_CODE = "pap" as const;

/** Libellé UI affiché dans les listes. */
export const PAP_SOURCE_LABEL = "PAP.fr — Particuliers";
