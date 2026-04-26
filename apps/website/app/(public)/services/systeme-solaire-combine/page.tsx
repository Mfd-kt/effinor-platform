import type { Metadata } from 'next'
import { Sun, Droplets, Leaf, ShieldCheck, Wallet, Wrench, Timer } from 'lucide-react'
import { JsonLdService } from '@/components/seo/json-ld-service'
import { ServiceHero } from '@/components/sections/service-hero'
import { ServiceTrustBar, type ServiceTrustStat } from '@/components/sections/service-trust-bar'
import { PartnersBar } from '@/components/sections/partners-bar'
import { ServiceBenefits } from '@/components/sections/service-benefits'
import { HowItWorks } from '@/components/sections/how-it-works'
import { FinalCTA } from '@/components/sections/final-cta'
import { siteConfig } from '@/lib/site-config'

const canonical = `${siteConfig.url.replace(/\/$/, '')}/services/systeme-solaire-combine`

export const metadata: Metadata = {
  title: 'Système solaire combiné (SSC)',
  description:
    "Le Système Solaire Combiné couvre chauffage et eau chaude sanitaire grâce à l'énergie solaire. Installation par Effinor, équipes RGE QualiSol.",
  alternates: { canonical },
  openGraph: {
    url: canonical,
    type: 'website',
    title: 'Système solaire combiné (SSC)',
    description: "Chauffage, ECS, aides CEE & MaPrimeRénov' — Effinor RGE QualiSol.",
  },
}

const benefits = [
  {
    icon: Sun,
    title: "Jusqu'à 60% d'autonomie",
    description:
      "Un SSC bien dimensionné couvre 40 à 60% des besoins annuels en chauffage et eau chaude. Vos factures énergétiques chutent durablement.",
  },
  {
    icon: Droplets,
    title: 'Eau chaude solaire',
    description:
      "Production d'ECS toute l'année grâce aux capteurs thermiques. En été, le solaire couvre quasi 100% de vos besoins en eau chaude.",
  },
  {
    icon: Leaf,
    title: 'Énergie 100% renouvelable',
    description:
      "Aucune émission de CO₂ pour la part solaire. Une démarche concrète pour réduire l'empreinte carbone de votre logement.",
  },
]

const approach = [
  {
    icon: Wrench,
    title: 'Capteurs thermiques performants',
    description:
      "Capteurs plans haut rendement ou tubes sous vide selon votre situation. Sélection des marques européennes avec garantie 10 ans minimum.",
  },
  {
    icon: ShieldCheck,
    title: 'Installation certifiée QualiSol',
    description:
      "Pose par techniciens certifiés, conforme aux DTU. Étude d'orientation et de masques solaires pour maximiser la production.",
  },
  {
    icon: Wallet,
    title: 'Aides cumulables',
    description:
      "MaPrimeRénov', CEE, éco-PTZ, TVA 5,5% : nous montons l'ensemble des dossiers pour réduire votre reste à charge au minimum.",
  },
]

const serviceTrust: ServiceTrustStat[] = [
  { value: '60 %', label: "Autonomie moyenne visée", icon: Sun },
  { value: 'ECS', label: 'Eau chaude solaire', icon: Droplets },
  { value: '25 ans', label: 'Installation durable', icon: Timer },
  { value: 'RGE', label: 'Installateurs QualiSol', icon: ShieldCheck },
]

export default function SystemeSolaireCombinePage() {
  return (
    <>
      <JsonLdService
        name="Système solaire combiné (SSC) — solaire thermique"
        description="Production solaire pour chauffage et ECS, aides publiques, installation certifiée — Effinor."
        urlPath="/services/systeme-solaire-combine"
        serviceType="Système solaire combiné"
      />
      <ServiceHero
        eyebrow="Solaire thermique"
        title={
          <>
            Système <span className="text-secondary-600">solaire combiné</span>
          </>
        }
        description="Une seule installation pour produire eau chaude sanitaire et chauffage grâce au soleil. Le SSC est l'une des solutions les plus rentables sur la durée pour les maisons bien orientées."
        imageSrc="/images/services/ssc-solaire.jpg"
        imageAlt="Panneaux solaires thermiques sur une toiture"
        imageBlurKey="ssc"
        benefitTagline="Jusqu'à 60% d'autonomie énergétique"
      />
      <ServiceTrustBar items={serviceTrust} />
      <PartnersBar />

      <ServiceBenefits
        eyebrow="Avantages"
        title="Pourquoi un Système Solaire Combiné ?"
        description="Production d'énergie gratuite, éligibilité aux aides, durabilité éprouvée."
        benefits={benefits}
      />

      <ServiceBenefits
        eyebrow="Notre approche"
        title="Une installation pensée pour 25 ans"
        benefits={approach}
        variant="muted"
        spacing="md"
      />

      <HowItWorks />
      <FinalCTA />
    </>
  )
}
