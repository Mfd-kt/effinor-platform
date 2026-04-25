import { Container, Section } from '@effinor/design-system'
import { processSteps } from '@/lib/process-data'

export function HowItWorks() {
  return (
    <Section spacing="lg" id="comment-ca-marche">
      <Container size="site">
        <div className="text-center max-w-content mx-auto">
          <p className="text-sm font-semibold uppercase tracking-widest text-secondary-700">
            Comment ça marche
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-primary-900 sm:text-4xl lg:text-5xl">
            Un parcours simple, du diagnostic au versement des aides
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            Nous vous accompagnons à chaque étape. Vous n&apos;avez aucune démarche
            administrative à gérer.
          </p>
        </div>

        <ol className="relative mt-16 grid grid-cols-1 gap-y-10 gap-x-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Ligne de connexion (desktop uniquement) */}
          <div
            aria-hidden="true"
            className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-secondary-300 to-transparent lg:block"
          />

          {processSteps.map((step) => {
            const Icon = step.icon
            return (
              <li
                key={step.step}
                className="relative flex flex-col items-center text-center"
              >
                {/* Numéro de l'étape (chip au-dessus de l'icone) */}
                <span className="relative z-10 mb-4 inline-flex h-7 items-center rounded-full border border-secondary-200 bg-background px-3 text-xs font-bold uppercase tracking-widest text-secondary-700">
                  Étape {step.step}
                </span>

                {/* Icone ronde */}
                <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary-500 text-white shadow-lg shadow-secondary-500/30 ring-8 ring-background">
                  <Icon className="h-7 w-7" />
                </div>

                {/* Titre */}
                <h3 className="mt-6 text-lg font-semibold tracking-tight text-primary-900">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>

                {/* Durée */}
                <p className="mt-4 inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground ring-1 ring-border">
                  {step.duration}
                </p>
              </li>
            )
          })}
        </ol>
      </Container>
    </Section>
  )
}
