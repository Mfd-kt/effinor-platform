import { BadgeCheck, ShieldCheck, Wallet, Star } from 'lucide-react'
import { Container } from '@effinor/design-system'

import { getSiteStats } from '@/lib/site-settings'

const ICONS = [BadgeCheck, Wallet, Star, ShieldCheck] as const

export async function TrustBar() {
  const stats = await getSiteStats()

  return (
    <section className="border-y border-border bg-muted/40">
      <Container size="site">
        <ul className="grid grid-cols-2 divide-y divide-border lg:grid-cols-4 lg:divide-x lg:divide-y-0">
          {stats.map((stat, idx) => {
            const Icon = ICONS[idx] ?? BadgeCheck
            return (
              <li
                key={`${stat.label}-${idx}`}
                className={[
                  'flex items-center gap-4 px-2 py-5 sm:px-6 lg:py-7',
                  idx === 1 ? 'border-l border-border lg:border-l-0' : '',
                ].join(' ')}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary-500/10 text-secondary-700">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xl font-bold leading-tight text-primary-900 sm:text-2xl">
                    {stat.value}
                  </p>
                  <p className="truncate text-xs text-muted-foreground sm:text-sm">
                    {stat.label}
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
