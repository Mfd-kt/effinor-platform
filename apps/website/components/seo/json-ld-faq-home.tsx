import { siteConfig } from '@/lib/site-config'

const FAQ = [
  {
    question: 'Quelles aides pour une rénovation énergétique en 2026 ?',
    answer:
      "Vous pouvez cumuler les Certificats d'Économie d'Énergie (CEE), MaPrimeRénov', l'éco-PTZ à taux zéro et la TVA réduite selon les travaux. Effinor identifie les dispositifs applicables à votre foyer.",
  },
  {
    question: 'Le simulateur sur le site sert à quoi ?',
    answer:
      "En environ 2 minutes, il recueille le type de logement, le chauffage, la composition du foyer et vos revenus pour estimer l'éligibilité aux primes CEE et à MaPrimeRénov' — un conseiller affinera ensuite le montant au téléphone.",
  },
  {
    question: "Effinor intervient-il sur toute la France ?",
    answer:
      "Oui, Effinor accompagne les particuliers et les copropriétés sur l'ensemble du territoire national, avec un point de contact unique et des équipes RGE certifiées.",
  },
] as const

/**
 * FAQPage (rich results) — page d'accueil uniquement.
 */
export function JsonLdFaqHome() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    name: `Questions fréquentes — ${siteConfig.name}`,
    mainEntity: FAQ.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
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
