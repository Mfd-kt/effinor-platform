import { BadgeCheck, ShieldCheck, Wallet, Star } from 'lucide-react'
import { Container } from '@effinor/design-system'

import { getSiteStats } from '@/lib/site-settings'

const ICONS = [BadgeCheck, Wallet, Star, ShieldCheck] as const

export async function TrustBar() {
  const stats = await getSiteStats()

  return (
    <section className="border-y border-border bg-muted/40">
      <Container size="site">
        <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-none border border-border bg-border lg:grid-cols-4">
          {stats.map((stat, idx) => {
            const Icon = ICONS[idx] ?? BadgeCheck
            return (
              <li
                key={`${stat.label}-${idx}`}
                className="flex min-h-[5.5rem] items-center gap-3 border-0 bg-muted/40 px-3 py-4 sm:gap-4 sm:px-5 sm:py-5 lg:min-h-0 lg:px-6 lg:py-7"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-500/10 text-secondary-700 sm:h-11 sm:w-11">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-lg font-bold leading-tight text-primary-900 sm:text-xl lg:text-2xl">
                    {stat.value}
                  </p>
                  <p className="line-clamp-2 break-words text-[11px] leading-snug text-muted-foreground sm:text-xs sm:leading-tight md:text-sm">
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
