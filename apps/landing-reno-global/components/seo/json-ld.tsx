import { landingConfig } from '@/lib/site-config'
import { FAQ_ITEMS } from '@/components/faq'

/**
 * JSON-LD (Organization + Service + FAQPage + WebSite) pour la landing
 * Rénovation globale BAR-TH-174. Inliné dans <body> via app/layout.tsx.
 */
export function JsonLd() {
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${landingConfig.mainSiteUrl}#organization`,
    name: landingConfig.name,
    legalName: 'Effinor',
    url: landingConfig.mainSiteUrl,
    logo: `${landingConfig.mainSiteUrl}/apple-icon`,
    telephone: landingConfig.contact.phoneE164,
    email: landingConfig.contact.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: "Tour Europa, Av. de l'Europe",
      postalCode: '94320',
      addressLocality: 'Thiais',
      addressRegion: 'Île-de-France',
      addressCountry: 'FR',
    },
    areaServed: { '@type': 'Country', name: 'France' },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '18:00',
      },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.7',
      reviewCount: '400',
      bestRating: '5',
      worstRating: '1',
    },
    sameAs: [landingConfig.mainSiteUrl],
  }

  const service = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${landingConfig.url}#service-renovation-globale`,
    serviceType: 'Rénovation énergétique globale (BAR-TH-174)',
    name: 'Rénovation globale maison — bouquet de travaux clé en main',
    description:
      "Rénovation énergétique d'ampleur d'une maison individuelle : audit énergétique, isolation combles + murs + sous-sol, VMC hygro B, ballon thermodynamique, chauffage performant. Gain minimum de 2 classes DPE. Aides CEE Coup de pouce + MaPrimeRénov' financent jusqu'à 90 % du montant des travaux.",
    provider: { '@id': `${landingConfig.mainSiteUrl}#organization` },
    areaServed: { '@type': 'Country', name: 'France' },
    audience: {
      '@type': 'Audience',
      audienceType:
        'Propriétaires occupants de maison individuelle en résidence principale',
    },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'EUR',
      lowPrice: '0',
      highPrice: '80000',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        priceType: 'https://schema.org/RegularPrice',
        description: "Jusqu'à 90 % du montant financé par les aides CEE + MaPrimeRénov'",
      },
    },
    url: landingConfig.url,
  }

  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  }

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${landingConfig.url}#website`,
    name: `${landingConfig.name} — Rénovation globale`,
    url: landingConfig.url,
    inLanguage: 'fr-FR',
    publisher: { '@id': `${landingConfig.mainSiteUrl}#organization` },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(service) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
    </>
  )
}
