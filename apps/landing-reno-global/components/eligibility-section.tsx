import Link from 'next/link'
import { ArrowRight, Check, X } from 'lucide-react'
import { Button, Container, Section } from '@effinor/design-system'

const ELIGIBLE = [
  {
    title: 'Propriétaire occupant',
    detail: "Vous vivez dans le logement en résidence principale (ou y êtes domicilié·e).",
  },
  {
    title: 'Maison individuelle',
    detail: 'Pavillon, maison de ville, villa — non collective.',
  },
  {
    title: 'DPE E, F ou G',
    detail:
      'Passoire énergétique ou logement très énergivore (les classes D sont éligibles dans certains cas, à valider).',
  },
  {
    title: "Chauffage non remplacé depuis plus de 24 mois",
    detail:
      'Règle BAR-TH-174 : le système de chauffage principal ne doit pas avoir été changé dans les 24 derniers mois.',
  },
]

const NON_ELIGIBLE = [
  {
    title: 'Locataires',
    detail: 'Les travaux doivent être commandés par le propriétaire du logement.',
  },
  {
    title: 'Résidences secondaires',
    detail: 'Dispositif réservé aux résidences principales occupées à titre habituel.',
  },
  {
    title: 'SCI / SARL / bailleurs',
    detail:
      "Sauf copropriétés (parcours dédié BAR-TH-145) — nous contacter pour une étude sur-mesure.",
  },
  {
    title: 'Appartements individuels',
    detail:
      'Le bouquet BAR-TH-174 vise les maisons individuelles. Les copropriétés ont leur propre dispositif.',
  },
]

export function EligibilitySection() {
  return (
    <Section spacing="md" id="eligibilite">
      <Container size="site">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-secondary-700">
            Êtes-vous éligible ?
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-primary-900 sm:text-4xl">
            Conditions d&apos;éligibilité BAR-TH-174
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Le dispositif Coup de pouce Rénovation performante est réservé aux maisons
            individuelles en résidence principale. Vérifiez votre éligibilité en 2 minutes
            avec le simulateur.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Éligibles */}
          <div className="rounded-2xl border-2 border-secondary-200 bg-secondary-50/40 p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-secondary-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-500 text-white">
                <Check className="h-4 w-4" aria-hidden="true" />
              </span>
              Éligible
            </h3>
            <ul className="mt-5 space-y-3">
              {ELIGIBLE.map(({ title, detail }) => (
                <li key={title} className="flex items-start gap-3">
                  <span
                    className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary-500/15 text-secondary-700"
                    aria-hidden="true"
                  >
                    <Check className="h-3 w-3" />
                  </span>
                  <div className="text-sm">
                    <p className="font-semibold text-primary-900">{title}</p>
                    <p className="mt-0.5 text-muted-foreground">{detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Non éligibles */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-primary-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <X className="h-4 w-4" aria-hidden="true" />
              </span>
              Non éligible
            </h3>
            <ul className="mt-5 space-y-3">
              {NON_ELIGIBLE.map(({ title, detail }) => (
                <li key={title} className="flex items-start gap-3">
                  <span
                    className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                    aria-hidden="true"
                  >
                    <X className="h-3 w-3" />
                  </span>
                  <div className="text-sm">
                    <p className="font-semibold text-foreground">{title}</p>
                    <p className="mt-0.5 text-muted-foreground">{detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Button asChild variant="accent" size="lg">
            <a href="#simulateur">
              Vérifier mon éligibilité
              <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
            </a>
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            Cas particuliers (DPE D, copropriété, bailleur…) — appelez-nous ou{' '}
            <Link
              href={`${'https://effinor.fr'}/contact`}
              className="underline-offset-2 hover:underline"
              rel="noopener"
            >
              contactez-nous
            </Link>{' '}
            pour un avis personnalisé.
          </p>
        </div>
      </Container>
    </Section>
  )
}
