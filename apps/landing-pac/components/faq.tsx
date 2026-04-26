import { ChevronDown } from 'lucide-react'
import { Container, Section } from '@effinor/design-system'

export const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Qu'est-ce qu'une pompe à chaleur air-eau ?",
    a: "Une PAC air-eau capte les calories de l'air extérieur pour chauffer l'eau qui circule dans votre réseau de radiateurs ou votre plancher chauffant. Elle produit aussi votre eau chaude sanitaire. Un seul équipement remplace chaudière + chauffe-eau, avec un rendement 3 à 4 fois supérieur à un chauffage électrique direct.",
  },
  {
    q: "C'est quoi le COP et le SCOP d'une PAC ?",
    a: "Le COP (Coefficient de Performance) mesure le rendement instantané : pour 1 kWh d'électricité consommé, une PAC restitue 3 à 4 kWh de chaleur. Le SCOP est la moyenne annuelle (plus représentative). Nos PAC Daikin et Mitsubishi ont un SCOP supérieur à 4 sur les modèles basse température.",
  },
  {
    q: 'Quelles aides pour une PAC en 2026 ?',
    a: "Cumul possible : Coup de pouce Chauffage (CEE) pour le remplacement d'une chaudière gaz ou fioul + MaPrimeRénov' selon votre tranche de revenus + éco-PTZ jusqu'à 50 000 € pour financer le reste. TVA à 5,5 %. Effinor déduit les primes directement du devis (pas d'avance à faire).",
  },
  {
    q: 'Mon logement est-il compatible avec une PAC air-eau ?',
    a: "La PAC air-eau fonctionne idéalement avec un réseau de chauffage central existant (radiateurs basse température, plancher chauffant). Elle remplace une chaudière gaz ou fioul sans changer les émetteurs dans la majorité des cas. Notre visite technique gratuite valide la faisabilité (dimensionnement, emplacement de l'unité extérieure, raccordements).",
  },
  {
    q: "Combien coûte l'installation d'une PAC ?",
    a: "Pour une maison individuelle, comptez 12 000 à 18 000 € TTC pose comprise. Avec les aides maximales (CEE + MaPrimeRénov'), le reste à charge descend souvent entre 3 000 et 7 000 €. Le simulateur en haut de page vous donne une estimation personnalisée en 2 minutes.",
  },
  {
    q: 'La PAC est-elle compatible avec mes radiateurs existants ?',
    a: "Oui dans la majorité des cas. Les PAC haute température modernes (Daikin Altherma 3 H HT, par exemple) peuvent chauffer l'eau jusqu'à 65 °C, ce qui couvre le fonctionnement de radiateurs anciens. Pour les logements très bien isolés, les modèles basse température sont plus efficaces.",
  },
  {
    q: "Combien de temps dure l'installation ?",
    a: "1 à 2 jours de chantier en moyenne pour une maison individuelle. Le chauffage est coupé pendant une demi-journée maximum pour le raccordement. Chantier propre, équipe RGE QualiPAC salariée Effinor (pas de sous-traitance).",
  },
  {
    q: 'La PAC fonctionne-t-elle par grand froid ?',
    a: "Oui. Les PAC air-eau modernes conservent un bon rendement jusqu'à -15 °C à -20 °C. Un appoint électrique intégré prend le relais lors des pics de froid extrêmes pour garantir votre confort.",
  },
  {
    q: "L'unité extérieure est-elle bruyante ?",
    a: "Les modèles que nous installons (Daikin Altherma 3, Mitsubishi Ecodan) sont certifiés à moins de 40 dB(A) à 1 mètre, soit l'équivalent d'un murmure. Nous vérifions l'emplacement pendant la visite technique pour respecter les règles de voisinage (arrêté du 30 juin 1999).",
  },
  {
    q: 'Quelle garantie et quel SAV proposez-vous ?',
    a: "Garantie décennale sur la pose, 2 à 5 ans constructeur sur l'équipement selon les modèles, maintenance annuelle incluse la première année. Notre équipe technique locale est joignable 7j/7 — intervention sous 48h ouvrées pour les pannes.",
  },
]

export function Faq() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: it.a,
      },
    })),
  }

  return (
    <Section spacing="md" variant="muted" id="faq">
      <Container size="hero">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-secondary-700">
            Questions fréquentes
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-primary-900 sm:text-4xl">
            Tout savoir sur la PAC air-eau
          </h2>
        </div>

        <div className="mx-auto mt-8 max-w-3xl space-y-3">
          {FAQ_ITEMS.map((it) => (
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
