import { Award, Hammer, ShieldCheck, Star } from 'lucide-react'
import { Container } from '@effinor/design-system'

const ITEMS = [
  {
    Icon: Hammer,
    value: '2 500+',
    label: 'Chantiers réalisés',
    sublabel: 'Foyers équipés en France',
  },
  {
    Icon: Star,
    value: '4,7 / 5',
    label: 'Note Google',
    sublabel: 'Sur plus de 400 avis',
  },
  {
    Icon: Award,
    value: 'RGE',
    label: 'QualiPAC',
    sublabel: 'Certification 2026',
  },
  {
    Icon: ShieldCheck,
    value: '10 ans',
    label: 'Garantie décennale',
    sublabel: 'SAV local réactif',
  },
] as const

export function TrustBar() {
  return (
    <section className="border-y border-border bg-muted/40" aria-label="Notre expertise en chiffres">
      <Container size="site">
        <ul className="grid grid-cols-2 divide-y divide-border lg:grid-cols-4 lg:divide-x lg:divide-y-0">
          {ITEMS.map(({ Icon, value, label, sublabel }, i) => (
            <li
              key={label}
              className={[
                'flex items-center gap-4 px-2 py-5 sm:px-6 lg:py-7',
                i === 1 ? 'border-l border-border lg:border-l-0' : '',
              ].join(' ')}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary-500/10 text-secondary-700">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xl font-bold leading-tight text-primary-900 sm:text-2xl">
                  {value}
                </p>
                <p className="truncate text-xs font-medium text-foreground sm:text-sm">
                  {label}
                </p>
                <p className="truncate text-[11px] text-muted-foreground sm:text-xs">
                  {sublabel}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
