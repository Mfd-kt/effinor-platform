import type { MetadataRoute } from 'next'

import { landingConfig } from '@/lib/site-config'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    {
      url: landingConfig.url,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]
}
