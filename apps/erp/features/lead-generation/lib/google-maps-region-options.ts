import { DEFAULT_APIFY_GOOGLE_MAPS_LOCATION_QUERY } from "../apify/google-maps-actor-input";

/** Région → chaîne `locationQuery` pour l’actor Apify / Google Maps (évite la saisie libre). */
export type LeadGenGoogleMapsRegionOption = {
  /** Valeur envoyée à l’API (libellé géographique reconnu par Maps). */
  value: string;
  /** Libellé affiché dans l’UI. */
  label: string;
};

/**
 * Régions de France métropolitaine (+ périmètre national). Ordre alphabétique du libellé court,
 * avec « France métropolitaine » en tête.
 */
export const LEAD_GEN_GOOGLE_MAPS_REGION_OPTIONS: LeadGenGoogleMapsRegionOption[] = [
  { value: DEFAULT_APIFY_GOOGLE_MAPS_LOCATION_QUERY, label: "France métropolitaine (ensemble)" },
  { value: "Auvergne-Rhône-Alpes, France", label: "Auvergne-Rhône-Alpes" },
  { value: "Bourgogne-Franche-Comté, France", label: "Bourgogne-Franche-Comté" },
  { value: "Bretagne, France", label: "Bretagne" },
  { value: "Centre-Val de Loire, France", label: "Centre-Val de Loire" },
  { value: "Corse, France", label: "Corse" },
  { value: "Grand Est, France", label: "Grand Est" },
  { value: "Hauts-de-France, France", label: "Hauts-de-France" },
  { value: "Île-de-France, France", label: "Île-de-France" },
  { value: "Normandie, France", label: "Normandie" },
  { value: "Nouvelle-Aquitaine, France", label: "Nouvelle-Aquitaine" },
  { value: "Occitanie, France", label: "Occitanie" },
  { value: "Pays de la Loire, France", label: "Pays de la Loire" },
  { value: "Provence-Alpes-Côte d'Azur, France", label: "Provence-Alpes-Côte d'Azur" },
];

export function isLeadGenGoogleMapsRegionValue(value: string): boolean {
  return LEAD_GEN_GOOGLE_MAPS_REGION_OPTIONS.some((o) => o.value === value);
}
