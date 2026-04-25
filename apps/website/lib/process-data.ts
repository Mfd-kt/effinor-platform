import type { LucideIcon } from 'lucide-react'
import { Calculator, ClipboardCheck, Wrench, BadgeEuro } from 'lucide-react'

export interface ProcessStep {
  step: number
  title: string
  description: string
  icon: LucideIcon
  duration: string
}

export const processSteps: ProcessStep[] = [
  {
    step: 1,
    title: 'Estimation gratuite',
    description:
      "Vous remplissez un formulaire en 2 minutes. Nous calculons immédiatement le montant de vos aides et la rentabilité du projet.",
    icon: Calculator,
    duration: '2 minutes',
  },
  {
    step: 2,
    title: 'Visite technique',
    description:
      "Un technicien certifié RGE se déplace chez vous pour étudier votre logement, vos besoins et vous proposer la meilleure solution.",
    icon: ClipboardCheck,
    duration: 'Gratuit · Sans engagement',
  },
  {
    step: 3,
    title: 'Travaux clé en main',
    description:
      "Nos équipes qualifiées installent votre nouvel équipement dans le respect des normes. Chantier propre, délais tenus.",
    icon: Wrench,
    duration: '1 à 5 jours selon projet',
  },
  {
    step: 4,
    title: 'Aides versées',
    description:
      "Nous gérons l'ensemble des démarches administratives. Vos primes CEE et MaPrimeRénov' sont versées directement.",
    icon: BadgeEuro,
    duration: 'Sous 30 à 60 jours',
  },
]
