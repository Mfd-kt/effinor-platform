import type { Metadata } from 'next'
import {
  ThermometerSun,
  Wallet,
  Leaf,
  Wrench,
  ShieldCheck,
  Gauge,
} from 'lucide-react'
import { ServiceHero } from '@/components/sections/service-hero'
import { ServiceBenefits } from '@/components/sections/service-benefits'
import { ServiceFAQ } from '@/components/sections/service-faq'
import { HowItWorks } from '@/components/sections/how-it-works'
import { FinalCTA } from '@/components/sections/final-cta'

export const metadata: Metadata = {
  title: 'Pompe à chaleur — Maison individuelle',
  description:
    "Installation de pompes à chaleur air-eau et air-air pour maisons individuelles. Devis gratuit, jusqu'à 11 000 € d'aides cumulables, équipes RGE QualiPAC.",
  openGraph: {
    title: 'Pompe à chaleur pour maison individuelle',
    description:
      "PAC air-eau et air-air haute performance — installation clé en main par Effinor.",
  },
}

const benefits = [
  {
    icon: ThermometerSun,
    title: 'Confort toute l\'année',
    description:
      "Chauffage l'hiver et rafraîchissement l'été (modèles réversibles). Une température stable et homogène dans toute la maison.",
  },
  {
    icon: Wallet,
    title: "Jusqu'à 70% d'économies",
    description:
      "Une PAC consomme 3 à 4 fois moins d'énergie qu'une chaudière classique. Vos factures fondent dès la première année d'utilisation.",
  },
  {
    icon: Leaf,
    title: 'Énergie renouvelable',
    description:
      "70 à 80% de l'énergie produite provient de l'air extérieur, gratuit et inépuisable. Une démarche écologique concrète.",
  },
]

const technicalArguments = [
  {
    icon: Gauge,
    title: 'Dimensionnement précis',
    description:
      "Étude thermique du logement avant chaque devis : surface, isolation, émetteurs existants, climat local. Pas de sur-dimensionnement coûteux.",
  },
  {
    icon: Wrench,
    title: 'Installateurs RGE QualiPAC',
    description:
      "Nos techniciens sont certifiés QualiPAC. Pose conforme aux normes NF, mise en service complète, formation à l'utilisation.",
  },
  {
    icon: ShieldCheck,
    title: 'Garanties solides',
    description:
      "Garantie décennale sur l'installation, garantie constructeur 5 à 10 ans sur l'équipement, contrat d'entretien annuel optionnel.",
  },
]

const faqItems = [
  {
    question: 'Quelle pompe à chaleur choisir : air-eau ou air-air ?',
    answer:
      "Le choix dépend de votre installation existante. Si votre maison est équipée de radiateurs ou d'un plancher chauffant à eau, une PAC air-eau est idéale (elle remplace votre chaudière). Si vous chauffez actuellement à l'électrique ou souhaitez climatiser, une PAC air-air (split / multi-split) sera plus adaptée. Notre bureau d'études vous accompagne dans le choix lors de la visite technique.",
  },
  {
    question: 'Quelles aides puis-je obtenir pour ma PAC ?',
    answer:
      "Vous pouvez cumuler MaPrimeRénov' (jusqu'à 5 000 € selon revenus), les Certificats d'Économie d'Énergie (CEE — jusqu'à 4 000 €), l'éco-PTZ (prêt à 0% jusqu'à 50 000 €) et la TVA réduite à 5,5%. Soit un total qui peut dépasser 11 000 € d'aides directes pour une maison individuelle. Notre équipe identifie et monte les dossiers à votre place.",
  },
  {
    question: 'Combien de temps prend l\'installation ?',
    answer:
      "Une installation de PAC air-eau prend généralement 2 à 3 jours pour un remplacement de chaudière (raccordement à un circuit de chauffage existant). Une PAC air-air (multi-split) est posée en 1 à 2 jours. Nous fixons les dates avec vous et tenons les délais — chantier propre garanti.",
  },
  {
    question: 'Faut-il entretenir une pompe à chaleur ?',
    answer:
      "Oui, un contrôle d'étanchéité est obligatoire tous les 2 ans pour les PAC contenant plus de 2 kg de fluide frigorigène. Au-delà de l'obligation légale, un entretien annuel par un professionnel certifié garantit la performance et la durée de vie de votre équipement (15 à 20 ans en moyenne).",
  },
  {
    question: 'Une PAC fonctionne-t-elle vraiment quand il fait très froid ?',
    answer:
      "Les PAC modernes fonctionnent jusqu'à -20°C voire -25°C pour les modèles haut de gamme. La performance (COP) baisse légèrement par grand froid, raison pour laquelle un appoint électrique d'urgence est intégré. En climat français standard, votre PAC couvre 95% à 100% de vos besoins de chauffage sans appoint significatif.",
  },
]

export default function PacMaisonIndividuellePage() {
  return (
    <>
      <ServiceHero
        eyebrow="Pompe à chaleur"
        title={
          <>
            Pompe à chaleur pour <span className="text-secondary-600">maison individuelle</span>
          </>
        }
        description="Remplacez votre ancien système de chauffage par une pompe à chaleur air-eau ou air-air haute performance. Économies immédiates, confort augmenté, démarche écologique. Étude thermique, installation et démarches d'aides incluses."
        imageSrc="/images/services/pac-maison.jpg"
        imageAlt="Pompe à chaleur installée dans une maison individuelle"
        benefitTagline="Jusqu'à 11 000 € d'aides cumulables"
      />

      <ServiceBenefits
        eyebrow="Pourquoi une PAC ?"
        title="3 raisons d'opter pour la pompe à chaleur"
        description="Une technologie mature, performante et largement subventionnée par l'État."
        benefits={benefits}
      />

      <ServiceBenefits
        eyebrow="Notre approche"
        title="Une installation pensée pour durer"
        description="Étude personnalisée, équipements premium, pose certifiée."
        benefits={technicalArguments}
        variant="muted"
      />

      <HowItWorks />

      <ServiceFAQ
        description="Tout ce qu'il faut savoir avant d'installer une pompe à chaleur dans votre maison."
        items={faqItems}
      />

      <FinalCTA />
    </>
  )
}
