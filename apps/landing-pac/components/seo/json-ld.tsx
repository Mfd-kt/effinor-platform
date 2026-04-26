import { landingConfig } from '@/lib/site-config'
import { FAQ_ITEMS } from '@/components/faq'

/**
 * Injecte les 3 blocs JSON-LD nécessaires au référencement riche Google :
 * - Organization / LocalBusiness (identité Effinor)
 * - Service (Installation PAC air-eau)
 * - FAQPage (questions fréquentes)
 *
 * Composant serveur, inliné dans <body> (emplacement autorisé par Google).
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
    areaServed: {
      '@type': 'Country',
      name: 'France',
    },
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
    '@id': `${landingConfig.url}#service-pac-air-eau`,
    serviceType: 'Installation de pompe à chaleur air-eau',
    name: 'Pompe à chaleur air-eau — Installation clé en main',
    description:
      "Installation d'une pompe à chaleur air-eau par un professionnel RGE QualiPAC, avec prise en charge complète des aides CEE et MaPrimeRénov'. Garantie décennale, SAV local, sans sous-traitance.",
    provider: { '@id': `${landingConfig.mainSiteUrl}#organization` },
    areaServed: { '@type': 'Country', name: 'France' },
    audience: { '@type': 'Audience', audienceType: 'Propriétaires de maison individuelle' },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'EUR',
      lowPrice: '3000',
      highPrice: '18000',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        priceType: 'https://schema.org/RegularPrice',
        description:
          "Reste à charge après déduction CEE + MaPrimeRénov' à partir de 3 000 €",
      },
    },
    brand: ['Daikin', 'Mitsubishi Electric', 'Atlantic', 'Ariston'],
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
    name: `${landingConfig.name} — Pompe à chaleur air-eau`,
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
