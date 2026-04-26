import { Container, Section } from '@effinor/design-system'
import { Droplets, Mountain, Wind } from 'lucide-react'

const TYPES = [
  {
    Icon: Droplets,
    name: 'PAC air-eau',
    badge: 'Recommandée',
    description:
      "Récupère les calories de l'air extérieur pour chauffer l'eau du circuit de chauffage (radiateurs, plancher chauffant) et l'eau chaude sanitaire.",
    pros: [
      'Remplace idéalement une chaudière gaz ou fioul',
      'Compatible radiateurs basse température',
      'Aides CEE + MaPrimeRénov\u2019 maximales',
    ],
    operation: 'BAR-TH-171 (proprio occupant) / BAR-TH-179 (SCI / bailleur)',
  },
  {
    Icon: Wind,
    name: 'PAC air-air',
    badge: 'Climatisation réversible',
    description:
      "Puise la chaleur de l'air extérieur et la diffuse directement dans les pièces via des splits. Mode rafraîchissement en été.",
    pros: [
      'Installation rapide, pas de raccordement au circuit d\u2019eau',
      'Idéale en appoint ou en région méditerranéenne',
      'Rafraîchit aussi en été',
    ],
    operation: 'Non éligible CEE « Coup de pouce chauffage »',
  },
  {
    Icon: Mountain,
    name: 'PAC géothermique',
    badge: 'Haute performance',
    description:
      'Capte la chaleur du sol via un réseau enterré (capteurs horizontaux ou sonde verticale). Rendement très stable toute l\u2019année.',
    pros: [
      'COP constant même par grand froid',
      'Durée de vie 20 ans et plus',
      'Solution premium, projet de terrain requis',
    ],
    operation: 'Aides MaPrimeRénov\u2019 majorées',
  },
]

export function TypesPac() {
  return (
    <Section spacing="md" variant="muted" id="types-pac">
      <Container size="site">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-secondary-700">
            Bien choisir sa PAC
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-primary-900 sm:text-4xl">
            Les 3 types de pompes à chaleur
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Pour une <strong className="font-semibold text-foreground">maison individuelle</strong>{' '}
            déjà équipée d&apos;un chauffage central, la PAC air-eau est la solution la plus
            cohérente. Effinor installe les 3 technologies selon votre logement.
          </p>
        </div>

        <ul className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {TYPES.map(({ Icon, name, badge, description, pros, operation }, i) => (
            <li
              key={name}
              className={[
                'relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm',
                i === 0
                  ? 'border-secondary-300 ring-2 ring-secondary-200/60'
                  : 'border-border',
              ].join(' ')}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500/10 text-primary-700">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="text-lg font-semibold tracking-tight text-primary-900">
                  {name}
                </h3>
              </div>
              <span
                className={[
                  'mt-3 inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                  i === 0
                    ? 'bg-secondary-500 text-white'
                    : 'bg-secondary-500/10 text-secondary-700',
                ].join(' ')}
              >
                {badge}
              </span>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
              <ul className="mt-4 space-y-1.5 text-sm text-foreground">
                {pros.map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-secondary-500" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 border-t border-border pt-3 text-[11px] uppercase tracking-wide text-muted-foreground">
                {operation}
              </p>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  )
}
