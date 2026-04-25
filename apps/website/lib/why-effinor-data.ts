import type { LucideIcon } from 'lucide-react'
import { Award, Wallet, HeartHandshake } from 'lucide-react'

export interface Pillar {
  title: string
  description: string
  icon: LucideIcon
}

export const pillars: Pillar[] = [
  {
    icon: Award,
    title: 'Expertise certifiée',
    description:
      "Nos équipes sont labellisées RGE QualiPAC, QualiPV et Qualibois. Plus de 10 ans d'expérience dans la rénovation énergétique.",
  },
  {
    icon: Wallet,
    title: 'Aides maximisées',
    description:
      "Nous identifions et cumulons toutes les aides disponibles : CEE, MaPrimeRénov', éco-PTZ, aides locales. Jusqu'à 90% de financement.",
  },
  {
    icon: HeartHandshake,
    title: 'Accompagnement de A à Z',
    description:
      "De l'audit initial au versement des primes, un interlocuteur unique gère votre dossier. Aucune démarche administrative à votre charge.",
  },
]
