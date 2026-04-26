import { ClipboardCheck, HomeIcon, Sparkles, Wrench } from 'lucide-react'
import { Container, Section } from '@effinor/design-system'

const STEPS = [
  {
    Icon: ClipboardCheck,
    title: 'Simulation gratuite',
    description: '2 minutes en ligne, 6 questions simples.',
  },
  {
    Icon: HomeIcon,
    title: 'Visite technique',
    description: 'Un technicien RGE QualiPAC visite votre logement, étude gratuite.',
  },
  {
    Icon: Wrench,
    title: 'Installation',
    description: '1 à 2 jours de chantier, équipe certifiée, chantier propre.',
  },
  {
    Icon: Sparkles,
    title: 'Aides versées',
    description: 'CEE + MaPrimeRénov’ sous 30 à 60 jours après la mise en service.',
  },
] as const

export function HowItWorks() {
  return (
    <Section spacing="lg" variant="muted" id="etapes">
      <Container size="site">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-secondary-600">
            Comment ça marche ?
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-primary-900 sm:text-4xl">
            De la simulation aux aides versées, 4 étapes
          </h2>
        </div>

        <ol className="relative mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <span
            aria-hidden="true"
            className="absolute left-0 right-0 top-6 -z-0 hidden h-0.5 bg-gradient-to-r from-secondary-200 via-secondary-400 to-secondary-200 lg:block"
          />

          {STEPS.map(({ Icon, title, description }, i) => (
            <li key={title} className="relative z-10 flex flex-col items-center text-center">
              <span className="relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-secondary-500 bg-background text-secondary-700 shadow-sm">
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-secondary-500 text-[10px] font-bold text-white">
                  {i + 1}
                </span>
              </span>
              <h3 className="mt-5 text-base font-semibold tracking-tight text-primary-900 sm:text-lg">
                {title}
              </h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  )
}
