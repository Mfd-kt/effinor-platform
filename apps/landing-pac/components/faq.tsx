import { ChevronDown } from 'lucide-react'
import { Container, Section } from '@effinor/design-system'

const ITEMS: { q: string; a: string }[] = [
  {
    q: "Qu'est-ce qu'une pompe à chaleur air-eau ?",
    a: "Une PAC air-eau capte les calories de l'air extérieur pour chauffer l'eau qui circule dans votre réseau de radiateurs ou votre plancher chauffant. Elle produit aussi votre eau chaude sanitaire. Un seul équipement remplace chaudière + chauffe-eau, avec un rendement 3 à 4 fois supérieur à un chauffage électrique.",
  },
  {
    q: 'Quelles aides pour une PAC en 2026 ?',
    a: "Cumul CEE (Coup de pouce Chauffage pour le remplacement d'une chaudière gaz ou fioul) + MaPrimeRénov' selon votre tranche de revenus + éco-PTZ pour le reste à charge. Le total peut dépasser 11 000 € pour les ménages modestes.",
  },
  {
    q: 'Mon logement est-il compatible avec une PAC air-eau ?',
    a: "La PAC air-eau fonctionne idéalement avec un réseau de chauffage central existant (radiateurs basse température, plancher chauffant). Elle remplace une chaudière gaz ou fioul sans changer les émetteurs dans la majorité des cas. Notre visite technique gratuite valide la faisabilité.",
  },
  {
    q: "Combien coûte l'installation d'une PAC ?",
    a: "Pour une maison individuelle, comptez 12 000 à 18 000 € TTC pose comprise. Avec les aides maximales (CEE + MaPrimeRénov'), le reste à charge descend souvent entre 3 000 et 7 000 €. Le simulateur vous donne une estimation personnalisée en 2 minutes.",
  },
  {
    q: "Combien de temps dure l'installation ?",
    a: "1 à 2 jours de chantier en moyenne pour une maison individuelle. Le chauffage est coupé pendant une demi-journée maximum pour le raccordement. Chantier propre, équipe RGE QualiPAC.",
  },
  {
    q: 'La PAC fonctionne-t-elle par grand froid ?',
    a: "Oui. Les PAC air-eau modernes conservent un bon rendement jusqu'à -15 °C à -20 °C. Un appoint électrique intégré prend le relais lors des pics de froid extrêmes pour garantir votre confort.",
  },
]

export function Faq() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: ITEMS.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: it.a,
      },
    })),
  }

  return (
    <Section spacing="lg" variant="muted" id="faq">
      <Container size="hero">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-secondary-600">
            Questions fréquentes
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-primary-900 sm:text-4xl">
            Tout savoir sur la PAC air-eau
          </h2>
        </div>

        <div className="mx-auto mt-10 max-w-3xl space-y-3">
          {ITEMS.map((it) => (
            <details
              key={it.q}
              className="group rounded-xl border border-border bg-card p-5 transition-colors open:border-secondary-300 open:bg-secondary-50/40"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-semibold text-primary-900 [&::-webkit-details-marker]:hidden">
                <span>{it.q}</span>
                <ChevronDown
                  className="h-5 w-5 shrink-0 text-secondary-600 transition-transform group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{it.a}</p>
            </details>
          ))}
        </div>
      </Container>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </Section>
  )
}
