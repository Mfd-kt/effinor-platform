import { z } from "zod";
import { LBC_ENERGY_RATES, LBC_MAX_AD_LIMIT } from "./config";

/**
 * Schéma Zod de l'input de l'acteur clearpath/leboncoin-immobilier.
 * Deux modes possibles : soit searchUrl direct, soit filtres manuels.
 */
export const leboncoinImmobilierInputSchema = z
  .object({
    // --- Mode URL ou filtres manuels ---
    searchUrl: z.string().url().optional(),
    searchQuery: z.string().optional(),

    // --- Filtres principaux ---
    immobilierCategory: z.enum(["9", "10", "11", "13", "2001"]).optional(),
    location: z.string().optional(),
    real_estate_type: z.array(z.enum(["1", "2", "3", "4", "5"])).optional(),

    // --- Surface ---
    square_min: z.number().int().min(0).optional(),
    square_max: z.number().int().min(0).optional(),
    land_square_min: z.number().int().min(0).optional(),
    land_square_max: z.number().int().min(0).optional(),

    // --- Pièces ---
    rooms_min: z.number().int().min(1).max(8).optional(),
    rooms_max: z.number().int().min(1).max(8).optional(),
    bedrooms_min: z.number().int().min(1).max(8).optional(),
    bedrooms_max: z.number().int().min(1).max(8).optional(),

    // --- DPE ---
    energy_rate: z.array(z.enum(LBC_ENERGY_RATES)).optional(),

    // --- Prix ---
    price_min_filter: z.number().int().min(0).optional(),
    price_max_filter: z.number().int().min(0).optional(),

    // --- Limite ---
    adLimit: z.number().int().min(1).max(LBC_MAX_AD_LIMIT).default(500),

    // --- Téléphone (credentials injectés côté serveur) ---
    includePhone: z.boolean().default(true),
    email: z.string().email().optional(),
    password: z.string().optional(),

    // --- Mode surveillance (désactivé par défaut) ---
    mode: z.enum(["standard", "monitor"]).default("standard"),

    // --- Recherche avancée ---
    adDetailUrls: z.array(z.string().url()).optional(),
    excludeKeywords: z.string().optional(),
    radius: z.number().int().min(1).max(200).optional(),

    // --- Tri ---
    sortBy: z.enum(["time", "price", "relevance"]).default("time"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),

    // --- Filtre vendeur (pro/particulier/tous) ---
    seller_type: z.enum(["all", "pro", "pri"]).default("all"),

    // --- Amenities booléens ---
    elevator: z.boolean().optional(),
  })
  .refine(
    (data) =>
      Boolean(data.searchUrl) ||
      Boolean(data.searchQuery) ||
      Boolean(data.immobilierCategory),
    {
      message:
        "Vous devez fournir soit searchUrl, soit searchQuery, soit immobilierCategory + filtres.",
    },
  );

export type LeboncoinImmobilierInput = z.infer<typeof leboncoinImmobilierInputSchema>;
