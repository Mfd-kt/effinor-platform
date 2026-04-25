import { Container, Section } from '@effinor/design-system'
import { pillars } from '@/lib/why-effinor-data'

export function WhyEffinor() {
  return (
    <Section variant="muted" spacing="lg">
      <Container size="site">
        <div className="text-center max-w-content mx-auto">
          <p className="text-sm font-semibold uppercase tracking-widest text-secondary-600">
            Pourquoi Effinor
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-primary-900 sm:text-4xl">
            Un partenaire de confiance pour votre transition énergétique
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            De l&apos;étude à la réception des travaux, un seul interlocuteur, une qualité
            d&apos;exécution garantie et un maximum d&apos;aides mobilisées.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {pillars.map((pillar) => {
            const Icon = pillar.icon
            return (
              <div
                key={pillar.title}
                className="flex flex-col items-center rounded-2xl border border-border bg-card p-6 text-center shadow-sm lg:p-8"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary-50 text-secondary-700 ring-1 ring-secondary-100">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="mt-5 text-xl font-semibold tracking-tight text-primary-900">
                  {pillar.title}
                </h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            )
          })}
        </div>
      </Container>
    </Section>
  )
}
