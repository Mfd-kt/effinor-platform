import { Container } from '@effinor/design-system'
import { siteStats } from '@/lib/site-stats'

export function TrustBar() {
  return (
    <section className="border-b border-border bg-background py-10">
      <Container size="site">
        <dl className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {siteStats.map((stat) => (
            <div key={stat.label} className="text-center">
              <dt className="text-3xl font-bold tracking-tight text-primary-900 sm:text-4xl">
                {stat.value}
              </dt>
              <dd className="mt-1.5 text-sm text-muted-foreground">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  )
}
