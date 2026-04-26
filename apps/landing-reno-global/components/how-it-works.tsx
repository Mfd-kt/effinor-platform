import { Container, Section } from '@effinor/design-system'
import { BadgeCheck, ClipboardList, FileCheck, Wrench } from 'lucide-react'

const STEPS = [
  {
    Icon: ClipboardList,
    title: 'Audit énergétique',
    description:
      "Réalisé par un auditeur certifié RGE études. Diagnostic DPE avant-travaux, chiffrage du gain énergétique.",
  },
  {
    Icon: BadgeCheck,
    title: 'Sélection du scénario',
    description:
      "Choix SC1 (complet) ou SC2 (flexible) selon la configuration — validé lors de la visite technique.",
  },
  {
    Icon: Wrench,
    title: 'Travaux clé en main',
    description:
      'Isolation, VMC, ballon thermodynamique réalisés par nos entreprises RGE partenaires. Planning géré par Effinor.',
  },
  {
    Icon: FileCheck,
    title: 'Dépôt CEE + aides',
    description:
      "DPE post-travaux, constitution du dossier CEE + MaPrimeRénov', versement 30 à 60 jours après mise en service.",
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
            De l&apos;audit aux aides versées,{' '}
            <span className="text-secondary-600">4 étapes</span>
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Un interlocuteur unique coordonne l&apos;audit, les artisans et le dossier
            administratif — vous gardez le contrôle à chaque étape sans gérer la
            paperasse.
          </p>
        </div>

        <ol className="relative mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
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
