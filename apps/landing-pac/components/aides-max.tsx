import { Container, Section } from '@effinor/design-system'
import { Banknote, BadgePercent, PiggyBank, Wallet } from 'lucide-react'

const AIDES = [
  {
    Icon: Banknote,
    label: 'CEE — Coup de pouce',
    value: 'jusqu\u2019à 5 000 €',
    description: 'Prime versée par les fournisseurs d\u2019énergie pour le remplacement d\u2019une chaudière gaz ou fioul.',
  },
  {
    Icon: BadgePercent,
    label: "MaPrimeRénov'",
    value: 'jusqu\u2019à 5 000 €',
    description: 'Aide de l\u2019État (Anah) selon votre tranche de revenus et le gain énergétique.',
  },
  {
    Icon: Wallet,
    label: 'Éco-PTZ',
    value: 'jusqu\u2019à 50 000 €',
    description: 'Prêt à taux zéro pour financer le reste à charge sur une durée jusqu\u2019à 15 ans.',
  },
  {
    Icon: PiggyBank,
    label: 'TVA à 5,5 %',
    value: 'incluse',
    description: 'Taux réduit appliqué automatiquement sur l\u2019équipement et la pose par un professionnel RGE.',
  },
]

export function AidesMax() {
  return (
    <Section spacing="md" id="aides" className="bg-gradient-to-b from-background to-primary-50/40">
      <Container size="site">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-secondary-700">
            Aides 2026
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-primary-900 sm:text-4xl">
            Jusqu&apos;à{' '}
            <span className="text-accent-600">11 000 €</span> d&apos;aides cumulables
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Effinor gère l&apos;ensemble des démarches et déduit les primes directement de votre
            devis. Vous n&apos;avancez aucune somme.
          </p>
        </div>

        <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {AIDES.map(({ Icon, label, value, description }) => (
            <li
              key={label}
              className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-500/10 text-accent-700">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-accent-700">
                {label}
              </p>
              <p className="mt-1 text-xl font-bold tracking-tight text-primary-900">{value}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{description}</p>
            </li>
          ))}
        </ul>

        <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-muted-foreground">
          Montants indicatifs selon les barèmes nationaux 2026. L&apos;éligibilité et le
          cumul dépendent de votre situation fiscale, de votre logement et du gain
          énergétique. Simulation gratuite ci-dessus.
        </p>
      </Container>
    </Section>
  )
}
