import { Container, Section } from '@effinor/design-system'
import { teamStats } from '@/lib/about-data'

export function TeamStats() {
  return (
    <Section spacing="lg" id="notre-equipe">
      <Container size="site">
        <div className="text-center max-w-content mx-auto">
          <p className="text-sm font-semibold uppercase tracking-widest text-secondary-600">
            Notre équipe
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Une équipe d&apos;experts à votre service
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Bureau d&apos;études, techniciens certifiés, équipe administrative dédiée :
            chaque profil a un rôle précis dans la réussite de votre projet.
          </p>
        </div>

        <ul className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {teamStats.map((stat) => {
            const Icon = stat.icon
            return (
              <li
                key={stat.label}
                className="flex flex-col items-center rounded-xl border border-border bg-card p-8 text-center"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary-500 text-white">
                  <Icon className="h-7 w-7" />
                </div>
                <p className="mt-5 text-4xl font-bold text-primary-900">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-secondary-700">
                  {stat.label}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {stat.description}
                </p>
              </li>
            )
          })}
        </ul>
      </Container>
    </Section>
  )
}
