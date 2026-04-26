import { BadgeCheck, Check, ChevronRight } from 'lucide-react'
import { Container, Section } from '@effinor/design-system'

type Scenario = {
  id: 'SC1' | 'SC2'
  title: string
  badge: string
  badgeTone: 'primary' | 'secondary'
  tagline: string
  travaux: { label: string; detail?: string }[]
  recommendation: string
}

const SCENARIOS: Scenario[] = [
  {
    id: 'SC1',
    title: 'Scénario 1 — Rénovation complète',
    badge: 'Aides maximales',
    badgeTone: 'secondary',
    tagline:
      'Bouquet intégral : toutes les surfaces déperditives sont traitées en une seule opération.',
    travaux: [
      {
        label: 'Isolation des combles',
        detail: 'R ≥ 7 m²·K/W (combles perdus) ou R ≥ 6 m²·K/W (rampants).',
      },
      {
        label: 'Isolation du sous-sol / vide sanitaire',
        detail: 'Plancher bas R ≥ 3 m²·K/W — frein au froid venant du sol.',
      },
      {
        label: 'Ballon thermodynamique (BTD)',
        detail: 'Eau chaude sanitaire aérothermique, COP ≥ 2,5.',
      },
      {
        label: 'VMC performante',
        detail: 'VMC hygro B ou double-flux selon la configuration.',
      },
    ],
    recommendation:
      'Recommandé quand le logement dispose d’un sous-sol ou vide sanitaire isolable. Gain DPE le plus important.',
  },
  {
    id: 'SC2',
    title: 'Scénario 2 — Rénovation flexible',
    badge: 'Solution adaptable',
    badgeTone: 'primary',
    tagline:
      "Alternative quand le sous-sol n'est pas accessible : on remplace par l'isolation d'un mur.",
    travaux: [
      {
        label: 'Isolation des combles OU du sous-sol',
        detail: 'Choix selon la configuration du logement.',
      },
      {
        label: 'Ballon thermodynamique (BTD)',
        detail: 'Obligatoire dans les deux scénarios.',
      },
      {
        label: 'Isolation d’un mur par ITI',
        detail: 'Isolation par l’intérieur (ITI) ou par l’extérieur (ITE).',
      },
      {
        label: 'VMC performante',
        detail: 'VMC hygro B ou double-flux.',
      },
    ],
    recommendation:
      'Recommandé pour les maisons sans sous-sol exploitable ou pour étaler les travaux dans le temps.',
  },
]

export function ScenariosSection() {
  return (
    <Section spacing="md" variant="muted" id="scenarios">
      <Container size="site">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-secondary-700">
            Bouquet de travaux
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-primary-900 sm:text-4xl">
            2 scénarios pour gagner{' '}
            <span className="text-secondary-600">2 classes DPE minimum</span>
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Le cahier des charges BAR-TH-174 définit deux bouquets types. Notre auditeur
            certifié sélectionne le scénario le plus adapté à votre logement lors de la
            visite technique.
          </p>
        </div>

        <ul className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {SCENARIOS.map((s) => (
            <li
              key={s.id}
              className={[
                'relative flex flex-col rounded-2xl border-2 bg-card p-6 shadow-sm',
                s.badgeTone === 'secondary'
                  ? 'border-secondary-300 ring-2 ring-secondary-200/50'
                  : 'border-primary-200',
              ].join(' ')}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold tracking-tight text-primary-900">
                  {s.title}
                </h3>
                <span
                  className={[
                    'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
                    s.badgeTone === 'secondary'
                      ? 'bg-secondary-500 text-white'
                      : 'bg-primary-500/10 text-primary-700',
                  ].join(' ')}
                >
                  <BadgeCheck className="h-3 w-3" aria-hidden="true" />
                  {s.badge}
                </span>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {s.tagline}
              </p>

              <ul className="mt-5 space-y-3">
                {s.travaux.map((t) => (
                  <li key={t.label} className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary-500/15 text-secondary-700">
                      <Check className="h-3 w-3" aria-hidden="true" />
                    </span>
                    <div className="text-sm">
                      <p className="font-medium text-foreground">{t.label}</p>
                      {t.detail ? (
                        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                          {t.detail}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex items-start gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
                <ChevronRight
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary-600"
                  aria-hidden="true"
                />
                <p>{s.recommendation}</p>
              </div>
            </li>
          ))}
        </ul>

        <p className="mx-auto mt-8 max-w-3xl rounded-xl border border-accent-200 bg-accent-50/60 p-4 text-center text-xs text-accent-900 sm:text-sm">
          <strong className="font-semibold">Obligation BAR-TH-174</strong> : un minimum
          d&apos;isolation des combles ET du sous-sol (ou du mur en SC2) est requis pour
          garantir le saut de 2 classes DPE minimum. Le dimensionnement exact est validé
          par l&apos;audit énergétique.
        </p>
      </Container>
    </Section>
  )
}
