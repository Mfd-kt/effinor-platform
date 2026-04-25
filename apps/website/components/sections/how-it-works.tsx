import { Container, Section } from '@effinor/design-system'
import { processSteps } from '@/lib/process-data'

export function HowItWorks() {
  return (
    <Section spacing="lg" id="comment-ca-marche">
      <Container size="site">
        <div className="text-center max-w-content mx-auto">
          <p className="text-sm font-semibold uppercase tracking-widest text-secondary-600">
            Comment ça marche
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Un parcours simple, du diagnostic au versement des aides
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Nous vous accompagnons à chaque étape. Vous n&apos;avez aucune démarche
            administrative à gérer.
          </p>
        </div>

        <div className="mt-12 lg:mt-16">
          <ol className="relative grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            <div
              className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-secondary-200 to-transparent lg:block"
              aria-hidden="true"
            />

            {processSteps.map((step) => {
              const Icon = step.icon
              return (
                <li
                  key={step.step}
                  className="relative flex flex-col items-start lg:items-center lg:text-center"
                >
                  <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-secondary-500 text-white shadow-md ring-4 ring-background">
                    <Icon className="h-6 w-6" />
                    <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary-900 text-xs font-bold text-white">
                      {step.step}
                    </span>
                  </div>

                  <h3 className="mt-5 text-base font-semibold tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground lg:max-w-[16rem]">
                    {step.description}
                  </p>
                  <p className="mt-3 inline-flex items-center rounded-full bg-secondary-50 px-2.5 py-1 text-xs font-medium text-secondary-700">
                    {step.duration}
                  </p>
                </li>
              )
            })}
          </ol>
        </div>
      </Container>
    </Section>
  )
}
