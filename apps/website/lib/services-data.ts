import type { LucideIcon } from 'lucide-react'
import { Home, Building2, Sun, Hammer } from 'lucide-react'

export interface ServiceCard {
  slug: string
  href: string
  title: string
  shortDescription: string
  benefitTagline: string
  icon: LucideIcon
  imageSrc: string
  imageAlt: string
}

export const homeServices: ServiceCard[] = [
  {
    slug: 'pac-maison',
    href: '/services/pompe-a-chaleur/maison-individuelle',
    title: 'Pompe à chaleur — Maison individuelle',
    shortDescription:
      "Remplacez votre ancien système de chauffage par une pompe à chaleur air-eau ou air-air haute performance.",
    benefitTagline: "Jusqu'à 11 000 € d'aides cumulables",
    icon: Home,
    imageSrc: '/images/services/pac-maison.jpg',
    imageAlt: "Installation d'une pompe à chaleur dans une maison individuelle",
  },
  {
    slug: 'pac-immeuble',
    href: '/services/pompe-a-chaleur/immeuble-collectif',
    title: 'Pompe à chaleur — Immeuble collectif',
    shortDescription:
      "Solution centralisée pour copropriétés et bailleurs sociaux. Études thermiques et mise en œuvre clé en main.",
    benefitTagline: 'Solutions collectives sur-mesure',
    icon: Building2,
    imageSrc: '/images/services/pac-immeuble.jpg',
    imageAlt: 'Pompe à chaleur installée pour un immeuble collectif',
  },
  {
    slug: 'systeme-solaire-combine',
    href: '/services/systeme-solaire-combine',
    title: 'Système solaire combiné (SSC)',
    shortDescription:
      "Chauffage et eau chaude sanitaire grâce à l'énergie solaire. Une solution écologique et durable.",
    benefitTagline: "Jusqu'à 60% d'autonomie énergétique",
    icon: Sun,
    imageSrc: '/images/services/ssc-solaire.jpg',
    imageAlt: 'Panneaux solaires thermiques installés sur une toiture',
  },
  {
    slug: 'renovation-globale',
    href: '/services/renovation-globale',
    title: 'Rénovation globale',
    shortDescription:
      "Bouquet de travaux pour atteindre 2 sauts de classe DPE minimum. Conforme au cahier des charges BAR-TH-174.",
    benefitTagline: "Jusqu'à 90% du montant financé",
    icon: Hammer,
    imageSrc: '/images/services/renovation-globale.jpg',
    imageAlt: 'Chantier de rénovation énergétique globale',
  },
]
