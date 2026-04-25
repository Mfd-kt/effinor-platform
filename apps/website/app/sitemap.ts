import type { MetadataRoute } from 'next'
import { getAllBlogSlugs } from '@/lib/blog'
import { getAllRealisationSlugs } from '@/lib/realisations'
import { siteConfig } from '@/lib/site-config'

const BASE = siteConfig.url

/**
 * Sitemap du site vitrine Effinor.
 * - Routes statiques codées en dur
 * - Routes blog dynamiques (alimentées depuis Supabase blog_articles
 *   où status='published' et published_at <= now())
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const [blogSlugs, realisationSlugs] = await Promise.all([
    getAllBlogSlugs(),
    getAllRealisationSlugs(),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    {
      url: `${BASE}/services`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE}/services/pompe-a-chaleur/maison-individuelle`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/services/pompe-a-chaleur/immeuble-collectif`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/services/systeme-solaire-combine`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/services/renovation-globale`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/a-propos`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE}/blog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE}/realisations`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE}/mentions-legales`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${BASE}/politique-de-confidentialite`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${BASE}/cgv`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ]

  const blogRoutes: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
    url: `${BASE}/blog/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  const realisationRoutes: MetadataRoute.Sitemap = realisationSlugs.map(
    (slug) => ({
      url: `${BASE}/realisations/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })
  )

  return [...staticRoutes, ...blogRoutes, ...realisationRoutes]
}
