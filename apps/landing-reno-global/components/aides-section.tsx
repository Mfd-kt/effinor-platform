import { ArrowRight, BadgePercent, TrendingUp } from 'lucide-react'
import { Button, Container, Section } from '@effinor/design-system'

type AideRow = {
  sauts: string
  minimum: string
  description: string
  highlight?: boolean
}

const AIDES: AideRow[] = [
  {
    sauts: '2 sauts de classe',
    minimum: '4 700 €',
    description: "Bouquet minimal BAR-TH-174 (SC1 ou SC2 selon configuration).",
  },
  {
    sauts: '3 sauts de classe',
    minimum: '5 800 €',
    description:
      "Rénovation d'ampleur, souvent atteinte en passant par une classe F ou G.",
    highlight: true,
  },
  {
    sauts: '4 sauts ou plus',
    minimum: '7 400 €',
    description:
      "Saut maximal — possible depuis une passoire thermique (G → C, par exemple).",
  },
]

export function AidesSection() {
  return (
    <Section spacing="md" id="aides" className="bg-gradient-to-b from-background to-primary-50/40">
      <Container size="site">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-secondary-700">
            Aides 2026
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-primary-900 sm:text-4xl">
            Primes CEE par <span className="text-accent-600">sauts de classe DPE</span>
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Cumulez la prime CEE BAR-TH-174 avec MaPrimeRénov&apos; Rénovation d&apos;ampleur
            et l&apos;éco-PTZ pour financer jusqu&apos;à{' '}
            <strong className="font-semibold text-foreground">90 % du montant</strong> des
            travaux.
          </p>
        </div>

        {/* Tableau desktop */}
        <div className="mx-auto mt-10 hidden max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:block">
          <table className="w-full text-sm">
            <thead className="bg-primary-50/60">
              <tr>
                <th className="px-6 py-4 text-left font-semibold uppercase tracking-wide text-xs text-primary-900">
                  Sauts de classe DPE
                </th>
                <th className="px-6 py-4 text-left font-semibold uppercase tracking-wide text-xs text-primary-900">
                  Prime CEE minimum
                </th>
                <th className="px-6 py-4 text-left font-semibold uppercase tracking-wide text-xs text-primary-900">
                  Typologie
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {AIDES.map((row) => (
                <tr
                  key={row.sauts}
                  className={row.highlight ? 'bg-secondary-50/40' : 'bg-card'}
                >
                  <td className="px-6 py-4 align-top">
                    <div className="flex items-center gap-2">
                      <TrendingUp
                        className="h-4 w-4 shrink-0 text-secondary-600"
                        aria-hidden="true"
                      />
                      <span className="font-semibold text-primary-900">{row.sauts}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <span className="text-xl font-bold text-accent-700">{row.minimum}</span>
                  </td>
                  <td className="px-6 py-4 align-top text-muted-foreground">
                    {row.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cards mobile */}
        <ul className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-3 md:hidden">
          {AIDES.map((row) => (
            <li
              key={row.sauts}
              className={[
                'rounded-xl border bg-card p-4',
                row.highlight ? 'border-secondary-300 bg-secondary-50/40' : 'border-border',
              ].join(' ')}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-primary-900">{row.sauts}</span>
                <span className="text-lg font-bold text-accent-700">{row.minimum}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{row.description}</p>
            </li>
          ))}
        </ul>

        <div className="mx-auto mt-6 max-w-3xl space-y-2 text-center text-xs text-muted-foreground">
          <p className="flex items-center justify-center gap-2">
            <BadgePercent
              className="h-3.5 w-3.5 shrink-0 text-secondary-600"
              aria-hidden="true"
            />
            Prime majorée selon la <strong className="font-semibold text-foreground">
            surface habitable</strong> (facteur 0,4 à 1,3) et le profil de revenus.
          </p>
          <p>
            Source : cahier des charges BAR-TH-174 version A80.3 (2026). Montants plancher
            — la prime réelle peut être bien supérieure après pondération.
          </p>
        </div>

        <div className="mt-8 text-center">
          <Button asChild variant="accent" size="lg">
            <a href="#simulateur">
              Calculer mes aides
              <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
            </a>
          </Button>
        </div>
      </Container>
    </Section>
  )
}
