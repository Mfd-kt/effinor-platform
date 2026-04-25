import { BadgeCheck, ShieldCheck, Wallet, Star } from 'lucide-react'
import { Container } from '@effinor/design-system'

interface TrustItem {
  icon: typeof BadgeCheck
  value: string
  label: string
}

const items: TrustItem[] = [
  {
    icon: BadgeCheck,
    value: '2 500+',
    label: 'Chantiers réalisés',
  },
  {
    icon: Wallet,
    value: '1 800 €',
    label: 'Économies moyennes / an',
  },
  {
    icon: Star,
    value: '4.7/5',
    label: 'Note clients',
  },
  {
    icon: ShieldCheck,
    value: 'RGE',
    label: 'QualiPAC · QualiPV',
  },
]

export function TrustBar() {
  return (
    <section className="border-y border-border bg-muted/40">
      <Container size="site">
        <ul className="grid grid-cols-2 divide-y divide-border lg:grid-cols-4 lg:divide-x lg:divide-y-0">
          {items.map((item, idx) => {
            const Icon = item.icon
            return (
              <li
                key={item.label}
                className={[
                  'flex items-center gap-4 px-2 py-6 sm:px-6 lg:py-8',
                  idx === 1 ? 'border-l border-border lg:border-l-0' : '',
                ].join(' ')}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary-500/10 text-secondary-700">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xl font-bold leading-tight text-primary-900 sm:text-2xl">
                    {item.value}
                  </p>
                  <p className="truncate text-xs text-muted-foreground sm:text-sm">
                    {item.label}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      </Container>
    </section>
  )
}
