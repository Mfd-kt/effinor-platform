import { ChevronDown } from 'lucide-react'
import { Container, Section } from '@effinor/design-system'

export const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "C'est quoi la rénovation globale BAR-TH-174 ?",
    a: "La rénovation globale BAR-TH-174 est un dispositif d'aide CEE (Certificats d'Économies d'Énergie) créé par l'État pour financer la rénovation énergétique d'ampleur des maisons individuelles. Elle prend la forme d'un bouquet de travaux (isolation + chauffage + ventilation) visant un gain minimum de 2 classes DPE. Elle se cumule avec MaPrimeRénov' et l'éco-PTZ pour financer jusqu'à 90 % du coût total.",
  },
  {
    q: 'Mon logement est-il éligible à la rénovation globale ?',
    a: "Conditions principales : vous êtes propriétaire occupant d'une maison individuelle utilisée en résidence principale, votre DPE actuel est E, F ou G (parfois D sur dossier), et votre chauffage principal n'a pas été remplacé dans les 24 derniers mois. Les locataires, résidences secondaires et SCI sont exclus (sauf parcours copropriété BAR-TH-145 dédié).",
  },
  {
    q: 'Quels travaux sont obligatoires dans le bouquet ?',
    a: "Le scénario 1 (SC1) impose : isolation des combles + isolation du sous-sol + ballon thermodynamique (BTD) + VMC performante. Le scénario 2 (SC2) remplace le sous-sol par l'isolation d'un mur en ITI (intérieur). Dans les deux cas, l'objectif est d'atteindre un gain énergétique ≥ 40 % et 2 classes DPE minimum.",
  },
  {
    q: 'Combien coûte une rénovation globale ?',
    a: "Pour une maison individuelle de 100 m², le montant des travaux varie entre 35 000 € et 80 000 € selon l'état initial et le niveau de performance visé. Avec le cumul CEE Coup de pouce + MaPrimeRénov' Rénovation d'ampleur + éco-PTZ, les ménages très modestes et modestes peuvent atteindre un reste à charge quasi nul grâce au plafond de 90 % d'aides.",
  },
  {
    q: 'Combien de temps durent les travaux ?',
    a: "Entre 4 et 8 semaines de chantier en moyenne, audit énergétique et études préalables non comprises. Compter 2 à 4 mois supplémentaires entre la signature du devis et le démarrage (validation du dossier CEE, commande matériel, planning artisans). Total : 3 à 6 mois du premier contact aux aides versées.",
  },
  {
    q: "L'audit énergétique est-il payant ?",
    a: "Effinor prend en charge l'audit énergétique préalable à la signature du devis — il est offert aux clients qui nous confient leur rénovation globale. L'audit post-travaux (DPE de fin de chantier) est également inclus dans notre prestation. Ces deux documents sont obligatoires pour déposer le dossier CEE BAR-TH-174.",
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
            Tout savoir sur la rénovation globale
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
