import type { Metadata } from 'next'
import { Building2, Wallet, Users, ClipboardCheck } from 'lucide-react'
import { ServiceHero } from '@/components/sections/service-hero'
import { ServiceBenefits } from '@/components/sections/service-benefits'
import { HowItWorks } from '@/components/sections/how-it-works'
import { FinalCTA } from '@/components/sections/final-cta'

export const metadata: Metadata = {
  title: 'Pompe à chaleur — Immeuble collectif',
  description:
    "Solutions de pompes à chaleur pour copropriétés, bailleurs sociaux et immeubles résidentiels. Étude thermique, AMO, installation clé en main par Effinor.",
}

const benefits = [
  {
    icon: Wallet,
    title: 'Aides collectives mobilisées',
    description:
      "MaPrimeRénov' Copropriétés, CEE bonifiés, fonds chaleur ADEME : nous identifions et montons l'ensemble des dossiers de financement collectif.",
  },
  {
    icon: Building2,
    title: 'Solutions adaptées au bâti',
    description:
      "PAC air-eau centralisées, PAC géothermiques, hybridation gaz/PAC : la solution est dimensionnée selon votre immeuble et son réseau de chauffage.",
  },
  {
    icon: Users,
    title: 'Accompagnement syndic & CS',
    description:
      "Présentation en AG, support technique au syndic, communication aux copropriétaires. Nous facilitons la prise de décision collective.",
  },
]

const approach = [
  {
    icon: ClipboardCheck,
    title: "Audit énergétique préalable",
    description:
      "Diagnostic complet du bâtiment, des consommations actuelles et des scénarios de rénovation. Livrable conforme aux exigences MaPrimeRénov' Copropriétés.",
  },
  {
    icon: Building2,
    title: 'Dimensionnement collectif',
    description:
      "Étude thermique poussée intégrant les besoins de chauffage, d'ECS et la production d'eau chaude. Sélection des équipements adaptés à un usage intensif.",
  },
  {
    icon: Users,
    title: "Mise en service & formation",
    description:
      "Mise en service complète, paramétrage de la GTB, formation du gardien ou de l'exploitant. Suivi technique pendant la première saison de chauffe.",
  },
]

export default function PacImmeublePage() {
  return (
    <>
      <ServiceHero
        eyebrow="Pompe à chaleur"
        title={
          <>
            Pompe à chaleur pour <span className="text-secondary-600">immeuble collectif</span>
          </>
        }
        description="Solutions centralisées pour copropriétés, bailleurs sociaux et résidences. De l'audit énergétique à la mise en service, nous accompagnons votre projet collectif de bout en bout — y compris l'animation des AG."
        imageSrc="/images/services/pac-immeuble.jpg"
        imageAlt="Pompe à chaleur installée pour un immeuble collectif"
        benefitTagline="Aides MaPrimeRénov' Copropriétés mobilisables"
      />

      <ServiceBenefits
        eyebrow="Avantages"
        title="Pourquoi équiper votre immeuble en PAC ?"
        description="Une solution éprouvée pour décarboner le chauffage collectif tout en réduisant les charges."
        benefits={benefits}
      />

      <ServiceBenefits
        eyebrow="Notre méthode"
        title="Un projet collectif piloté de A à Z"
        benefits={approach}
        variant="muted"
      />

      <HowItWorks />
      <FinalCTA />
    </>
  )
}
