import { z } from "zod"

export const TESTIMONIAL_STATUS = ["draft", "published", "archived"] as const
export type TestimonialStatus = (typeof TESTIMONIAL_STATUS)[number]

/**
 * Aligné sur public.testimonials (migration 20260425210100).
 */
export const testimonialSchema = z.object({
  author_name: z.string().min(1, "Nom requis").max(120),
  author_city: z.string().min(1, "Ville requise").max(120),
  author_initials: z
    .string()
    .min(1, "Initiales requises")
    .max(8, "Initiales trop longues"),
  rating: z
    .number()
    .int()
    .min(1, "Note min. 1")
    .max(5, "Note max. 5"),
  text: z
    .string()
    .min(20, "Texte trop court (20 caractères min.)")
    .max(2000, "Texte trop long (2000 max.)"),
  service_type: z.string().min(1, "Type de prestation requis").max(200),
  date_label: z.string().min(1, "Date / période requise").max(80),
  featured: z.boolean().default(false),
  status: z.enum(TESTIMONIAL_STATUS).default("draft"),
})

export const testimonialUpdateSchema = testimonialSchema.partial()

export type TestimonialInput = z.infer<typeof testimonialSchema>
export type TestimonialUpdateInput = z.infer<typeof testimonialUpdateSchema>
