import { z } from "zod"

export const BLOG_STATUS = ["draft", "published", "archived"] as const
export type BlogStatus = (typeof BLOG_STATUS)[number]

/**
 * Schéma Zod d'un article de blog (création).
 * Aligné sur la table public.blog_articles (migration 20260425190100).
 */
export const blogArticleSchema = z.object({
  title: z.string().min(1, "Titre requis").max(200, "Titre trop long (200 max)"),
  slug: z
    .string()
    .min(1, "Slug requis")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug invalide — kebab-case uniquement (ex: mon-article)"
    ),
  excerpt: z
    .string()
    .min(20, "Extrait trop court (20 caractères minimum)")
    .max(280, "Extrait trop long (280 caractères maximum)"),
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
  category: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  status: z.enum(BLOG_STATUS).default("draft"),
  featured: z.boolean().default(false),
  reading_time_min: z.number().int().min(1).nullable().optional(),
})

export const blogArticleUpdateSchema = blogArticleSchema.partial()

export type BlogArticleInput = z.infer<typeof blogArticleSchema>
export type BlogArticleUpdateInput = z.infer<typeof blogArticleUpdateSchema>
