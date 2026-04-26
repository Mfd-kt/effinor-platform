import { siteConfig } from '@/lib/site-config'

const BASE = siteConfig.url.replace(/\/$/, '')
export const LOCAL_ID = `${BASE}#localbusiness`
const WEBSITE_ID = `${BASE}#website`

const WEEKDAY = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
] as const

const openingHoursSpecification = siteConfig.contact.hours.schema.map((row) => {
  const days = row.days.split(',').map((d) => d.trim().toLowerCase())
  const dayOfWeek: string[] = []
  const map: Record<string, (typeof WEEKDAY)[number] | undefined> = {
    mo: 'Monday',
    tu: 'Tuesday',
    we: 'Wednesday',
    th: 'Thursday',
    fr: 'Friday',
  }
  for (const d of days) {
    const m = map[d]
    if (m) dayOfWeek.push(m)
  }
  if (dayOfWeek.length === 0) {
    return {
      '@type': 'OpeningHoursSpecification' as const,
      dayOfWeek: [...WEEKDAY],
      opens: row.opens,
      closes: row.closes,
    }
  }
  return {
    '@type': 'OpeningHoursSpecification' as const,
    dayOfWeek,
    opens: row.opens,
    closes: row.closes,
  }
})

const sameAs: string[] = Object.values(
  (siteConfig.social ?? {}) as Record<string, string | undefined>
).filter((v): v is string => typeof v === 'string' && v.length > 0)

export function JsonLdGlobal() {
  const localBusiness = {
    '@type': 'LocalBusiness' as const,
    '@id': LOCAL_ID,
    name: siteConfig.name,
    url: `${BASE}/`,
    image: `${BASE}/favicon.svg`,
    description: siteConfig.description,
    email: siteConfig.contact.email,
    telephone: siteConfig.contact.phoneE164,
    address: {
      '@type': 'PostalAddress' as const,
      streetAddress: siteConfig.contact.address.street,
      addressLocality: siteConfig.contact.address.city,
      postalCode: siteConfig.contact.address.postalCode,
      addressCountry: siteConfig.contact.address.country,
    },
    aggregateRating: {
      '@type': 'AggregateRating' as const,
      ratingValue: '4.7',
      bestRating: '5',
      worstRating: '1',
      reviewCount: '150',
    },
    openingHoursSpecification,
    areaServed: { '@type': 'Country' as const, name: 'France' },
    ...(sameAs.length ? { sameAs } : {}),
  }

  const website = {
    '@type': 'WebSite' as const,
    '@id': WEBSITE_ID,
    name: siteConfig.name,
    url: `${BASE}/`,
    description: siteConfig.description,
    inLanguage: 'fr-FR',
    publisher: { '@id': LOCAL_ID },
    potentialAction: {
      '@type': 'SearchAction' as const,
      target: {
        '@type': 'EntryPoint' as const,
        urlTemplate: `${BASE}/blog?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [localBusiness, website],
        }),
      }}
    />
  )
}
