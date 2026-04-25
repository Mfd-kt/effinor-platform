export const LEBONCOIN_IMMOBILIER_ACTOR_ID = "clearpath/leboncoin-immobilier" as const;

/** Catégories immobilières LBC. */
export const LBC_CATEGORIES = {
  "9": "Ventes immobilières",
  "10": "Locations",
  "11": "Colocations",
  "13": "Bureaux & Commerces",
  "2001": "Immobilier Neuf",
} as const;

export type LbcCategoryCode = keyof typeof LBC_CATEGORIES;

/** Types de biens immobiliers LBC. */
export const LBC_REAL_ESTATE_TYPES = {
  "1": "Maison",
  "2": "Appartement",
  "3": "Terrain",
  "4": "Parking",
  "5": "Autre",
} as const;

export type LbcRealEstateType = keyof typeof LBC_REAL_ESTATE_TYPES;

/** Classes DPE. */
export const LBC_ENERGY_RATES = ["a", "b", "c", "d", "e", "f", "g", "v", "n"] as const;
export type LbcEnergyRate = (typeof LBC_ENERGY_RATES)[number];

/** DPE par défaut pour le ciblage CEE (maisons à rénover). */
export const LBC_DPE_CEE_TARGET: LbcEnergyRate[] = ["d", "e", "f", "g"];

/**
 * Types de vendeur acceptés par l'acteur Apify clearpath/leboncoin-immobilier.
 *
 * IMPORTANT — la valeur attendue côté Apify est `"private"` (et non `"pri"`).
 * L'acteur rejette tout autre alias avec « Field input.seller_type must be equal
 * to one of the allowed values: "all", "pro", "private" ».
 */
export const LBC_SELLER_TYPES = {
  all: "all",
  pro: "pro",
  private: "private",
} as const;

export type LbcSellerType = (typeof LBC_SELLER_TYPES)[keyof typeof LBC_SELLER_TYPES];

/**
 * L'acteur clearpath/leboncoin-immobilier ne supporte l'extraction de téléphones
 * qu'avec des URLs d'annonces directes (`adDetailUrls`), pas en mode recherche
 * par localisation. Activer `includePhone=true` en mode recherche fait retourner
 * 0 résultats avec le warning Apify : « includePhone is only supported with ad URLs ».
 *
 * Pour récupérer les téléphones, prévoir un workflow en 2 étapes :
 *   1. Import recherche (includePhone=false) → récupère les URLs des annonces
 *   2. Run secondaire avec `adDetailUrls` + includePhone=true
 */
export const LBC_INCLUDE_PHONE_SUPPORTED = false;

/** Limite par défaut d'annonces par run. */
export const LBC_DEFAULT_AD_LIMIT = 500;

/** Limite max par run (protection anti-quota). */
export const LBC_MAX_AD_LIMIT = 2000;
