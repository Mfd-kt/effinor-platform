import { siteConfig } from '@/lib/site-config'
import { LOCAL_ID } from '@/components/seo/json-ld-global'

type JsonLdServiceProps = {
  name: string
  description: string
  urlPath: string
  /** BAR-TH-174, Système solaire, etc. */
  serviceType?: string
}

export function JsonLdService({ name, description, urlPath, serviceType }: JsonLdServiceProps) {
  const base = siteConfig.url.replace(/\/$/, '')
  const url = `${base}${urlPath.startsWith('/') ? urlPath : `/${urlPath}`}`

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Service' as const,
    name,
    description,
    url,
    serviceType: serviceType ?? 'Rénovation énergétique',
    provider: {
      '@id': LOCAL_ID,
    },
  }

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
