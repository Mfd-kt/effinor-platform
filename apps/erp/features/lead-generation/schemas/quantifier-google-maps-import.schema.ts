import { z } from "zod";

import { isLeadGenGoogleMapsGeoValue } from "../lib/google-maps-region-options";
import { parseGoogleMapsSearchLines } from "../lib/parse-google-maps-search-lines";

const uuid = z.string().uuid("Identifiant UUID invalide.");

/** Lancement Maps Apify depuis l’espace quantificateur (même modèle que le dashboard : recherches multi-lignes). */
export const quantifierStartGoogleMapsApifyImportActionInputSchema = z
  .object({
    searchLines: z.string().max(8000),
    locationQuery: z
      .string()
      .trim()
      .max(200)
      .optional()
      .refine((q) => !q || isLeadGenGoogleMapsGeoValue(q), {
        message: "Choisissez un département / territoire dans la liste.",
      }),
    maxCrawledPlacesPerSearch: z.number().int().min(1).max(500).optional(),
    ceeSheetId: uuid,
    targetTeamId: uuid,
  })
  .superRefine((data, ctx) => {
    const lines = parseGoogleMapsSearchLines(data.searchLines);
    if (lines.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Indiquez au moins une recherche (une par ligne).",
        path: ["searchLines"],
      });
    }
    if (lines.length > 20) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Maximum 20 recherches.",
        path: ["searchLines"],
      });
    }
  });
