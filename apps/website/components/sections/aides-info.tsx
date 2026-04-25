import Link from 'next/link'
import { ArrowRight, BadgeEuro, ShieldCheck, Wallet } from 'lucide-react'
import { Button, Container, Section } from '@effinor/design-system'

interface AideCard {
  icon: typeof BadgeEuro
  title: string
  amount: string
  description: string
}

const aidesCards: AideCard[] = [
  {
    icon: BadgeEuro,
    title: "MaPrimeRénov'",
    amount: "Jusqu'à 70 000 €",
    description:
      "Aide de l'État pour les travaux de rénovation énergétique, modulée selon les revenus et le type de travaux.",
  },
  {
    icon: Wallet,
    title: 'Certificats CEE',
    amount: "Jusqu'à 7 400 €",
    description:
      "Prime versée par les fournisseurs d'énergie pour vous inciter à réaliser des économies d'énergie.",
  },
  {
    icon: ShieldCheck,
    title: 'Éco-PTZ',
    amount: "Jusqu'à 50 000 €",
    description:
      "Prêt à taux zéro pour financer le reste à charge de vos travaux. Cumulable avec les autres aides.",
  },
]

export function AidesInfo() {
  return (
    <Section spacing="lg" variant="muted" id="aides-financement">
      <Container size="site">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center">
          {/* Colonne texte */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-secondary-600">
              Aides & financement
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Profitez de toutes les aides cumulables en 2026
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              MaPrimeRénov&apos;, CEE, éco-PTZ : nous identifions et cumulons toutes les
              aides disponibles pour réduire votre reste à charge au minimum.
              Notre expertise vous garantit le meilleur financement.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary-500" />
                <span>
                  <strong className="font-semibold">Étude personnalisée</strong> de
                  votre situation et de vos revenus
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary-500" />
                <span>
                  <strong className="font-semibold">Cumul optimisé</strong> de toutes
                  les aides nationales et locales
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary-500" />
                <span>
                  <strong className="font-semibold">Démarches incluses</strong> :
                  nous gérons l&apos;ensemble des dossiers à votre place
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary-500" />
                <span>
                  <strong className="font-semibold">Aides versées rapidement</strong> :
                  généralement sous 30 à 60 jours après les travaux
                </span>
              </li>
            </ul>

            <div className="mt-8">
              <Button asChild variant="accent" size="lg">
                <Link href="/contact">
                  Calculer mes aides
                  <ArrowRight className="ml-1" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Colonne cards */}
          <div className="space-y-4">
            {aidesCards.map((aide) => {
              const Icon = aide.icon
              return (
                <div
                  key={aide.title}
                  className="rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary-50 text-secondary-700">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <h3 className="text-base font-semibold tracking-tight">
                          {aide.title}
                        </h3>
                        <p className="text-sm font-semibold text-secondary-700">
                          {aide.amount}
                        </p>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {aide.description}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
            <p className="text-xs text-muted-foreground">
              Montants indicatifs maximums selon les barèmes en vigueur en 2026.
              Le montant exact dépend de votre situation et de la nature des travaux.
            </p>
          </div>
        </div>
      </Container>
    </Section>
  )
}
