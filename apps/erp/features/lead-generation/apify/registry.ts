import type { ApifySourceCode, ApifySourceDefinition } from "./types";

/**
 * Registre des sources Apify actives dans l'ERP.
 * Pour ajouter une nouvelle source (PAP, SeLoger, Pages Jaunes...) :
 * 1. Ajouter le code dans le type ApifySourceCode (types.ts)
 * 2. Créer le dossier sources/<code>/ avec actor-input.ts, actor-output.ts, map-item.ts, start-import.ts, sync-import.ts
 * 3. Ajouter la définition dans DEFINITIONS ci-dessous
 */
const DEFINITIONS: readonly ApifySourceDefinition[] = [
  {
    code: "leboncoin_immobilier",
    label: "Le Bon Coin — Immobilier",
    actorId: "clearpath/leboncoin-immobilier",
    description:
      "Annonces immobilières leboncoin.fr avec téléphones des vendeurs. Filtres : DPE, type de bien, surface, prix, localisation.",
    requiresCredentials: true,
  },
  {
    code: "pap",
    label: "PAP.fr — Particuliers (Vente)",
    actorId: "azzouzana/pap-fr-mass-products-scraper-by-search-url",
    description:
      "Annonces PAP.fr **vente maison** entre particuliers, avec téléphones inclus. Input : URL `pap.fr/annonce/vente-…`.",
    requiresCredentials: false,
  },
  {
    code: "pap_location",
    label: "PAP.fr — Locations",
    actorId: "azzouzana/pap-fr-mass-products-scraper-by-search-url",
    description:
      "Annonces PAP.fr **location maison** entre particuliers, avec téléphones inclus. Input : URL `pap.fr/annonce/location-…`. Filtre prix : loyer mensuel.",
    requiresCredentials: false,
  },
] as const;

/** Liste toutes les sources Apify actives. */
export function listApifySources(): readonly ApifySourceDefinition[] {
  return DEFINITIONS;
}

/** Récupère une source par son code (throw si inconnue). */
export function getApifySource(code: ApifySourceCode): ApifySourceDefinition {
  const source = DEFINITIONS.find((d) => d.code === code);
  if (!source) {
    throw new Error(`Source Apify inconnue : ${code}`);
  }
  return source;
}

/** Vérifie si une source existe. */
export function hasApifySource(code: string): code is ApifySourceCode {
  return DEFINITIONS.some((d) => d.code === code);
}
