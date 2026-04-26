import { Container, Section } from '@effinor/design-system'
import {
  ClipboardCheck,
  HomeIcon,
  LifeBuoy,
  Sparkles,
  Wrench,
} from 'lucide-react'

const STEPS = [
  {
    Icon: ClipboardCheck,
    title: 'Simulation gratuite',
    description: '2 min en ligne, 6 questions — résultat immédiat et rappel sous 24 h ouvrées.',
  },
  {
    Icon: HomeIcon,
    title: 'Visite technique',
    description: 'Un technicien RGE QualiPAC visite le logement (gratuit) et valide la faisabilité.',
  },
  {
    Icon: Wrench,
    title: 'Installation clé en main',
    description: '1 à 2 jours de chantier par nos propres équipes. Zéro sous-traitance.',
  },
  {
    Icon: Sparkles,
    title: 'Aides versées',
    description: "CEE + MaPrimeRénov' déduites directement du devis. Pas d'avance à faire.",
  },
  {
    Icon: LifeBuoy,
    title: 'SAV local',
    description: 'Maintenance annuelle incluse 1 an + équipe locale joignable 7j/7.',
  },
] as const

export function HowItWorks() {
  return (
    <Section spacing="md" id="etapes">
      <Container size="site">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-secondary-700">
            Comment ça marche ?
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-primary-900 sm:text-4xl">
            De la simulation aux aides versées,{' '}
            <span className="text-secondary-600">5 étapes</span>
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Un interlocuteur unique. Aucune sous-traitance. Tous les artisans sont salariés
            Effinor.
          </p>
        </div>

        <ol className="relative mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
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
              <h3 className="mt-4 text-base font-semibold tracking-tight text-primary-900">
                {title}
              </h3>
              <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  )
}
