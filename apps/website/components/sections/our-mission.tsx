import { Container, Section } from '@effinor/design-system'
import { missionValues } from '@/lib/about-data'

export function OurMission() {
  return (
    <Section spacing="lg" variant="muted" id="notre-mission">
      <Container size="site">
        <div className="text-center max-w-content mx-auto">
          <p className="text-sm font-semibold uppercase tracking-widest text-secondary-600">
            Nos valeurs
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Trois engagements forts qui guident chaque projet
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Nos valeurs ne sont pas des mots affichés sur un mur. Ce sont les principes
            concrets que nous appliquons à chaque chantier, chaque client, chaque jour.
          </p>
        </div>

        <ul className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {missionValues.map((value) => {
            const Icon = value.icon
            return (
              <li
                key={value.title}
                className="rounded-xl border border-border bg-card p-6 lg:p-8"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary-50 text-secondary-700">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">
                  {value.title}
                </h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  {value.description}
                </p>
              </li>
            )
          })}
        </ul>
      </Container>
    </Section>
  )
}
