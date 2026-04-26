import { Container, Section } from '@effinor/design-system'
import {
  Leaf,
  PiggyBank,
  Snowflake,
  Sun,
  Volume2,
  Wallet,
} from 'lucide-react'

const BENEFITS = [
  {
    Icon: PiggyBank,
    title: "Jusqu'à 75 % d'économies",
    description:
      'Une PAC restitue 3 à 4 kWh de chaleur pour 1 kWh consommé (COP 3 à 4). Facture divisée par 3 vs chauffage fioul ou tout-électrique.',
  },
  {
    Icon: Wallet,
    title: 'Aides déduites du devis',
    description:
      "CEE + MaPrimeRénov' + éco-PTZ intégrés directement. Zéro avance de trésorerie à faire côté client.",
  },
  {
    Icon: Snowflake,
    title: 'Chauffage et rafraîchissement',
    description:
      "Les modèles réversibles chauffent l'hiver et rafraîchissent l'été, pour un confort stable toute l'année.",
  },
  {
    Icon: Leaf,
    title: "3× moins d'émissions CO₂",
    description:
      "La chaleur provient de l'air : énergie renouvelable, empreinte carbone réduite, conforme RT2020.",
  },
  {
    Icon: Volume2,
    title: 'Silence de fonctionnement',
    description:
      'Moins de 40 dB à 1 mètre pour les gammes Daikin Altherma 3 et Mitsubishi Ecodan. Installation discrète.',
  },
  {
    Icon: Sun,
    title: 'Chauffage + eau chaude',
    description:
      "Un seul équipement pour remplacer chaudière et chauffe-eau : gain de place et maintenance unique.",
  },
] as const

export function Benefits() {
  return (
    <Section spacing="md" id="avantages">
      <Container size="site">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-secondary-700">
            Pourquoi passer à la PAC ?
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-primary-900 sm:text-4xl">
            Un seul équipement, <span className="text-secondary-600">6 bénéfices concrets</span>
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Économies, confort, impact carbone — la PAC air-eau remplace avantageusement
            votre chaudière gaz ou fioul et sécurise votre facture énergie sur 15 à 20 ans.
          </p>
        </div>

        <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map(({ Icon, title, description }) => (
            <li
              key={title}
              className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary-500/10 text-secondary-700"
                aria-hidden="true"
              >
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold tracking-tight text-primary-900">
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
