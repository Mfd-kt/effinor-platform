import { z } from "zod";

/**
 * Schéma de parsing tolérant pour l'output de clearpath/leboncoin-immobilier.
 * On accepte les champs manquants et on valide au mieux, car les scrapers peuvent
 * renvoyer des outputs partiels selon les annonces.
 */
export const leboncoinImmobilierItemSchema = z.object({
  list_id: z.union([z.number(), z.string()]).optional(),
  title: z.string().optional(),
  price: z.number().nullable().optional(),
  price_cents: z.number().nullable().optional(),

  // Localisation
  location: z.string().optional(),
  city: z.string().optional(),
  zipcode: z.string().optional(),
  department_name: z.string().optional(),
  region_name: z.string().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),

  // URL + images
  url: z.string().optional(),
  images: z.array(z.string()).optional(),

  // Dates
  first_publication_date: z.string().optional(),

  // Caractéristiques bien
  real_estate_type: z.string().optional(),
  rooms: z.number().nullable().optional(),
  bedrooms: z.number().nullable().optional(),
  square: z.number().nullable().optional(),
  land_square: z.number().nullable().optional(),
  energy_rate: z.string().nullable().optional(),
  ges: z.string().nullable().optional(),
  floor_property: z.string().nullable().optional(),
  elevator: z.boolean().optional(),
  furnished: z.boolean().optional(),

  // Vendeur
  seller_name: z.string().optional(),
  seller_type: z.enum(["pro", "pri", "private"]).optional(),
  seller_siren: z.string().nullable().optional(),

  // Téléphone
  phone: z.string().nullable().optional(),
  has_phone: z.boolean().optional(),
  phoneQuotaExhausted: z.boolean().optional(),
});

export type LeboncoinImmobilierItem = z.infer<typeof leboncoinImmobilierItemSchema>;
