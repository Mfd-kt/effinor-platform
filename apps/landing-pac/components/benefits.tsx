import { Container, Section } from '@effinor/design-system'
import { Leaf, PiggyBank, ShieldCheck, Wallet } from 'lucide-react'

const BENEFITS = [
  {
    Icon: PiggyBank,
    title: "Économies d'énergie",
    description: "Jusqu'à 75 % d'économies sur la facture vs chauffage au fioul ou tout-électrique.",
  },
  {
    Icon: Wallet,
    title: 'Aides maximales',
    description:
      "Jusqu'à 11 000 € de primes cumulables : CEE + MaPrimeRénov' + Coup de pouce.",
  },
  {
    Icon: ShieldCheck,
    title: 'Confort optimal',
    description:
      'Chauffage et eau chaude sanitaire, température constante dans toutes les pièces.',
  },
  {
    Icon: Leaf,
    title: 'Écologique',
    description:
      "3× moins d'émissions CO₂ que le gaz. Énergie renouvelable, aérothermie.",
  },
] as const

export function Benefits() {
  return (
    <Section spacing="lg" id="avantages">
      <Container size="site">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-secondary-600">
            Pourquoi choisir la PAC ?
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-primary-900 sm:text-4xl">
            La pompe à chaleur air-eau, le chauffage du futur
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Un seul équipement pour remplacer votre chaudière et chauffer votre maison
            avec l&apos;énergie de l&apos;air.
          </p>
        </div>

        <ul className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map(({ Icon, title, description }) => (
            <li
              key={title}
              className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-500/10 text-secondary-700"
                aria-hidden="true"
              >
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-lg font-semibold tracking-tight text-primary-900">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  )
}
