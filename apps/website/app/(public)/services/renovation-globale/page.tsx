import type { Metadata } from 'next'
import {
  Hammer,
  TrendingUp,
  Wallet,
  ClipboardCheck,
  Users,
  ShieldCheck,
} from 'lucide-react'
import { ServiceHero } from '@/components/sections/service-hero'
import { ServiceBenefits } from '@/components/sections/service-benefits'
import { HowItWorks } from '@/components/sections/how-it-works'
import { FinalCTA } from '@/components/sections/final-cta'

export const metadata: Metadata = {
  title: 'Rénovation globale (BAR-TH-174)',
  description:
    "Bouquet de travaux pour atteindre 2 sauts de classe DPE minimum. Conforme au cahier des charges BAR-TH-174 — financement jusqu'à 90%.",
}

const benefits = [
  {
    icon: TrendingUp,
    title: '2 sauts de classe DPE minimum',
    description:
      "L'objectif d'une rénovation globale BAR-TH-174 est d'atteindre au moins 2 classes DPE de mieux. Votre logement gagne en confort et en valeur.",
  },
  {
    icon: Wallet,
    title: "Jusqu'à 90% de financement",
    description:
      "Cumul MaPrimeRénov' Parcours Accompagné + CEE rénovation globale + éco-PTZ : peu de projets bénéficient d'autant d'aides cumulables.",
  },
  {
    icon: Hammer,
    title: 'Bouquet cohérent de travaux',
    description:
      "Isolation (murs, toiture, planchers), changement d'équipement de chauffage, ventilation : tous les leviers sont activés ensemble pour un résultat optimal.",
  },
]

const approach = [
  {
    icon: ClipboardCheck,
    title: 'Audit énergétique réglementaire',
    description:
      "Nous réalisons l'audit énergétique exigé par la prime, avec scénarios chiffrés et plan de travaux détaillé. Livrable conforme aux exigences ANAH.",
  },
  {
    icon: Users,
    title: "Mon Accompagnateur Rénov'",
    description:
      "Effinor agit comme votre Accompagnateur Rénov' agréé. Un seul interlocuteur pour le pilotage technique, financier et administratif.",
  },
  {
    icon: ShieldCheck,
    title: 'Maîtrise d\'œuvre & coordination',
    description:
      "Coordination des artisans (isolation, chauffage, menuiseries), respect du planning, contrôle qualité à chaque étape, livraison clé en main.",
  },
]

export default function RenovationGlobalePage() {
  return (
    <>
      <ServiceHero
        eyebrow="Rénovation globale"
        title={
          <>
            Rénovation globale <span className="text-secondary-600">BAR-TH-174</span>
          </>
        }
        description="Une rénovation énergétique d'envergure permet de transformer votre logement durablement, tout en mobilisant le maximum d'aides. Effinor pilote l'ensemble du projet en tant qu'Accompagnateur Rénov'."
        imageSrc="/images/services/renovation-globale.jpg"
        imageAlt="Chantier de rénovation énergétique globale"
        benefitTagline="Jusqu'à 90% du montant financé"
      />

      <ServiceBenefits
        eyebrow="Pourquoi rénover globalement ?"
        title="Le saut de performance qui change tout"
        description="Une approche intégrée plus efficace, plus rentable et davantage soutenue financièrement."
        benefits={benefits}
      />

      <ServiceBenefits
        eyebrow="Notre méthode"
        title="Un projet ambitieux piloté de bout en bout"
        benefits={approach}
        variant="muted"
      />

      <HowItWorks />
      <FinalCTA />
    </>
  )
}
