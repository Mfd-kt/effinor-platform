import { z } from "zod"

/** Horaires (label affiché + schéma optionnel pour SEO / JSON-LD) */
const openingHoursSchemaItem = z.object({
  days: z.string().min(1),
  opens: z.string().min(1),
  closes: z.string().min(1),
})

export const siteContactSchema = z.object({
  email: z.string().email("Email invalide"),
  phone: z.string().min(1, "Téléphone requis"),
  phoneE164: z
    .string()
    .min(1, "Téléphone E.164 requis")
    .regex(
      /^\+\d{8,16}$/,
      "Format E.164 : + suivi de chiffres (ex: +33978455063)"
    ),
  address: z.object({
    street: z.string().min(1, "Adresse requise"),
    postalCode: z.string().min(1, "Code postal requis"),
    city: z.string().min(1, "Ville requise"),
    country: z.string().min(1, "Pays requis"),
    full: z.string().min(1, "Ligne d’adresse complète requise"),
  }),
  hours: z.object({
    label: z.string().min(1, "Libellé horaires requis"),
    schema: z.array(openingHoursSchemaItem).default([]),
  }),
})

export const siteStatItemSchema = z.object({
  value: z.string().min(1, "Valeur requise"),
  label: z.string().min(1, "Libellé requis"),
  description: z.string().optional().nullable(),
})

export const siteStatsFormSchema = z
  .array(siteStatItemSchema)
  .length(4, "4 statistiques requises (ordre = bandeau de confiance)")

export const siteSettingsUpdateSchema = z.object({
  contact: siteContactSchema,
  stats: siteStatsFormSchema,
})

export type SiteContactForm = z.infer<typeof siteContactSchema>
export type SiteStatItemForm = z.infer<typeof siteStatItemSchema>
export type SiteSettingsUpdate = z.infer<typeof siteSettingsUpdateSchema>
