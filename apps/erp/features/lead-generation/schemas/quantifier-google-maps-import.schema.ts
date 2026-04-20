import { z } from "zod";

const uuid = z.string().uuid("Identifiant UUID invalide.");

/** Lancement Maps Apify depuis l’espace quantificateur (un mot-clé → une recherche). */
export const quantifierStartGoogleMapsApifyImportActionInputSchema = z.object({
  keyword: z.string().trim().min(1, "Indiquez un mot-clé.").max(200),
  locationQuery: z.string().trim().max(200).optional(),
  maxCrawledPlacesPerSearch: z.number().int().min(1).max(500).optional(),
  ceeSheetId: uuid,
  targetTeamId: uuid,
});
