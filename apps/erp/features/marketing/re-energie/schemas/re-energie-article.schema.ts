import { z } from "zod"

import { BLOG_STATUS } from "../../blog/schemas/blog-article.schema"

const ICON_KEYS = [
  "home",
  "building-2",
  "frame",
  "layers",
  "air-vent",
  "sun",
  "sparkles",
  "layout-grid",
  "flame",
  "house-plus",
  "house",
] as const

export const RE_ENERGIE_ICON_KEYS = ICON_KEYS
export type ReEnergieIconKey = (typeof ICON_KEYS)[number]

const externalHrefSchema = z
  .string()
  .max(2000, "Lien trop long")
  .nullable()
  .optional()
  .refine(
    (v) =>
      v == null || v === "" || v.startsWith("/") || /^https?:\/\//.test(v),
    "Lien : chemin (ex. /services/...) ou URL https"
  )

/**
 * Fiche « Rénovation énergétique » — table public.re_energie_articles
 */
export const reEnergieArticleSchema = z.object({
  category_id: z.string().uuid("Catégorie requise"),
  title: z.string().min(1, "Titre requis").max(200, "Titre trop long (200 max)"),
  slug: z
    .string()
    .min(1, "Slug requis")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug invalide — kebab-case uniquement (ex: isolation-combles)"
    ),
  excerpt: z
    .string()
    .min(20, "Extrait trop court (20 caractères minimum)")
    .max(500, "Extrait trop long (500 caractères maximum)"),
  content_html: z.string().default(""),
  content_json: z.record(z.unknown()).nullable().optional(),
  cover_image_url: z.string().url("URL d'image invalide").nullable().optional(),
  cover_image_alt: z.string().max(200).nullable().optional(),
  seo_title: z.string().max(60, "SEO title : 60 caractères max").nullable().optional(),
  seo_description: z
    .string()
    .max(160, "SEO description : 160 caractères max")
    .nullable()
    .optional(),
  status: z.enum(BLOG_STATUS).default("draft"),
  sort_order: z.coerce.number().int().min(0).max(99_999).default(0),
  icon_key: z.enum(ICON_KEYS).nullable().optional(),
  external_href: externalHrefSchema,
  reading_time_min: z.number().int().min(1).nullable().optional(),
})

export const reEnergieArticleUpdateSchema = reEnergieArticleSchema.partial()

export type ReEnergieArticleInput = z.infer<typeof reEnergieArticleSchema>
export type ReEnergieArticleUpdateInput = z.infer<
  typeof reEnergieArticleUpdateSchema
>
