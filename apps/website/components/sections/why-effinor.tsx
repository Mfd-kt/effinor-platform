import { Container, Section } from '@effinor/design-system'
import { pillars } from '@/lib/why-effinor-data'

export function WhyEffinor() {
  return (
    <Section spacing="lg" variant="muted">
      <Container size="site">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-16">
          {/* Colonne gauche : intro */}
          <div className="lg:col-span-1">
            <p className="text-sm font-semibold uppercase tracking-widest text-secondary-700">
              Pourquoi Effinor
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-primary-900 sm:text-4xl">
              Trois engagements forts pour votre projet
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              De l&apos;étude à la réception des travaux, un seul interlocuteur, une qualité
              d&apos;exécution garantie et un maximum d&apos;aides mobilisées.
            </p>
          </div>

          {/* Colonne droite : 3 piliers en stack vertical */}
          <ul className="space-y-5 lg:col-span-2">
            {pillars.map((pillar) => {
              const Icon = pillar.icon
              return (
                <li
                  key={pillar.title}
                  className="group flex gap-5 rounded-2xl border border-border bg-card p-6 transition-all hover:border-secondary-300 hover:shadow-md sm:gap-6 sm:p-7"
                >
                  <div className="shrink-0">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary-500/10 text-secondary-700 ring-1 ring-secondary-500/10 transition-colors group-hover:bg-secondary-500 group-hover:text-white">
                      <Icon className="h-7 w-7" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold tracking-tight text-primary-900 sm:text-xl">
                      {pillar.title}
                    </h3>
                    <p className="mt-2 leading-relaxed text-muted-foreground">
                      {pillar.description}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </Container>
    </Section>
  )
}
