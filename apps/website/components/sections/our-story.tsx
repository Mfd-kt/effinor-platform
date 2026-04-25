import { Container, Section } from '@effinor/design-system'
import { aboutTimeline } from '@/lib/about-data'

export function OurStory() {
  return (
    <Section spacing="lg" id="notre-histoire">
      <Container size="content">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-secondary-600">
            Notre histoire
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            8 ans d&apos;expertise au service de la transition énergétique
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            De la création en 2018 à notre déploiement national, retour sur les étapes
            clés qui ont fait d&apos;Effinor un acteur reconnu de la rénovation énergétique.
          </p>
        </div>

        <ol className="mt-12 space-y-8 lg:mt-16">
          {aboutTimeline.map((event, index) => (
            <li key={event.year} className="relative flex gap-6 lg:gap-8">
              {/* Année + ligne verticale */}
              <div className="flex flex-col items-center">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-secondary-500 text-sm font-bold text-white shadow-md ring-4 ring-background">
                  {event.year}
                </div>
                {index < aboutTimeline.length - 1 ? (
                  <div className="mt-3 w-0.5 flex-1 bg-gradient-to-b from-secondary-200 to-transparent" />
                ) : null}
              </div>

              {/* Contenu */}
              <div className="flex-1 pb-8 last:pb-0">
                <h3 className="text-lg font-semibold tracking-tight">
                  {event.title}
                </h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  {event.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  )
}
