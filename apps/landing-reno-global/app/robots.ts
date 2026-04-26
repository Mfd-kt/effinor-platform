import type { MetadataRoute } from 'next'

import { landingConfig } from '@/lib/site-config'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    host: landingConfig.url,
  }
}
