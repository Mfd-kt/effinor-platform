import { z } from "zod"

export const SERVICE_TYPES = [
  "pac-maison",
  "pac-immeuble",
  "ssc",
  "renovation-globale",
] as const

export type ServiceType = (typeof SERVICE_TYPES)[number]

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  "pac-maison": "Pompe à chaleur — Maison individuelle",
  "pac-immeuble": "Pompe à chaleur — Immeuble collectif",
  ssc: "Système solaire combiné",
  "renovation-globale": "Rénovation globale",
}

export const REALISATION_STATUS = ["draft", "published", "archived"] as const
export type RealisationStatus = (typeof REALISATION_STATUS)[number]

/**
 * Schéma Zod d'une réalisation (création).
 * Aligné sur la table public.realisations (migration 20260425200000).
 */
export const realisationSchema = z.object({
  title: z.string().min(1, "Titre requis").max(200, "Titre trop long (200 max)"),
  slug: z
    .string()
    .min(1, "Slug requis")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug invalide — kebab-case uniquement (ex: pac-maison-lyon)",
    ),
  excerpt: z
    .string()
    .min(10, "Extrait trop court (10 caractères minimum)")
    .max(400, "Extrait trop long (400 caractères maximum)"),
  description_html: z.string().default(""),

  city: z.string().min(1, "Ville requise"),
  postal_code: z
    .string()
    .regex(/^\d{5}$/, "Code postal invalide (5 chiffres)")
    .nullable()
    .optional(),
  region: z.string().nullable().optional(),

  service_type: z.enum(SERVICE_TYPES),
  surface_m2: z.number().int().min(1).max(10000).nullable().optional(),
  year_completed: z.number().int().min(2015).max(2030).nullable().optional(),

  total_cost_eur: z.number().int().min(0).nullable().optional(),
  total_aids_eur: z.number().int().min(0).nullable().optional(),

  cover_image_url: z.string().url("URL d'image invalide").nullable().optional(),
  cover_image_alt: z.string().max(200).nullable().optional(),
  gallery_urls: z.array(z.string().url()).default([]),

  status: z.enum(REALISATION_STATUS).default("draft"),
  featured: z.boolean().default(false),
})

export const realisationUpdateSchema = realisationSchema.partial()

export type RealisationInput = z.infer<typeof realisationSchema>
export type RealisationUpdateInput = z.infer<typeof realisationUpdateSchema>
