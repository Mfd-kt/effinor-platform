import { z } from "zod";

/**
 * Schéma de parsing tolérant pour l'output de azzouzana/pap-fr-mass-products-scraper-by-search-url.
 *
 * On accepte les champs manquants (les annonces PAP peuvent renvoyer des outputs partiels)
 * et on valide au mieux. La normalisation (prix, surface, téléphone, date) est faite
 * dans `map-item.ts` pour rester proche de l'enveloppe brute ici.
 */

/** Lettre DPE / GES (a..g) ; PAP renvoie en minuscules. */
const energyLetterSchema = z
  .union([
    z.enum(["a", "b", "c", "d", "e", "f", "g"]),
    /** Tolérance : majuscules / valeur inconnue → on filtre dans le mapper. */
    z.string(),
  ])
  .nullable()
  .optional();

export const papItemSchema = z.object({
  /** Identifiant interne PAP (utilisé comme `source_external_id`). */
  id: z.union([z.number(), z.string()]).optional(),

  /** Type de bien tel que renvoyé par PAP. */
  typebien: z.string().nullable().optional(),

  /** Prix au format français : "510.000 €". */
  prix: z.string().nullable().optional(),

  /** Surface est généralement extraite depuis `caracteristiques` (regex \d+ m²). */
  caracteristiques: z.string().nullable().optional(),

  nb_pieces: z.number().nullable().optional(),
  nb_chambres_max: z.number().nullable().optional(),

  /** Géolocalisation. PAP envoie parfois lat/lng à la racine, parfois dans `marker`. */
  marker: z
    .object({
      lat: z.number().nullable().optional(),
      lng: z.number().nullable().optional(),
    })
    .nullable()
    .optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),

  /** Titre de l'annonce — souvent au format "Le Vésinet (78110)". */
  titre: z.string().nullable().optional(),

  /** Classes énergétiques. */
  classe_energie: z
    .object({
      lettre: energyLetterSchema,
    })
    .nullable()
    .optional(),
  classe_ges: z
    .object({
      lettre: energyLetterSchema,
    })
    .nullable()
    .optional(),

  /** Téléphones (E.164 après normalisation). */
  telephones: z.array(z.string()).nullable().optional(),

  /** URL absolue de l'annonce. */
  url: z.string().nullable().optional(),

  /** Date de publication au format français : "31 janvier 2026". */
  date: z.string().nullable().optional(),

  /** Champs additionnels parfois présents — gardés pour debug dans `raw_payload`. */
  description: z.string().nullable().optional(),
  surface: z.union([z.number(), z.string()]).nullable().optional(),
  ville: z.string().nullable().optional(),
  cp: z.string().nullable().optional(),
});

export type PapItem = z.infer<typeof papItemSchema>;
