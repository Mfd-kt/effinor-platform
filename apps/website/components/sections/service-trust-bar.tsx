import type { LucideIcon } from 'lucide-react'
import { Container } from '@effinor/design-system'

export type ServiceTrustStat = {
  value: string
  label: string
  icon: LucideIcon
}

type ServiceTrustBarProps = {
  items: readonly ServiceTrustStat[]
}

export function ServiceTrustBar({ items }: ServiceTrustBarProps) {
  return (
    <section className="border-b border-border bg-muted/35">
      <Container size="site">
        <ul className="grid grid-cols-2 divide-y divide-border lg:grid-cols-4 lg:divide-x lg:divide-y-0">
          {items.map((item, idx) => {
            const Icon = item.icon
            return (
              <li
                key={item.label}
                className={[
                  'flex items-center gap-3 px-2 py-4 sm:px-5 sm:py-5',
                  idx === 1 ? 'border-l border-border lg:border-l-0' : '',
                ].join(' ')}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary-500/10 text-secondary-700">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-base font-bold leading-tight text-primary-900 sm:text-lg">
                    {item.value}
                  </p>
                  <p className="text-[11px] leading-tight text-muted-foreground sm:text-xs">
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
